declare const process: { env: Record<string, string | undefined> };

import { v } from "convex/values";
import { query, action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Generate a cryptographically-secure random hex token */
function generateRandomToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── REQUEST PASSWORD RESET ACTION (ENTRY POINT FOR CLIENTS) ──────────────────

export const requestPasswordReset = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; reason?: string; message?: string }> => {
    console.log("[ForgotPassword] requestPasswordReset action invoked for:", args.email);

    // 1. Verify if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("[ForgotPassword] RESEND_API_KEY is not configured on the Convex backend.");
      return {
        success: false,
        reason: "NO_API_KEY",
        message: "Password reset email service is not configured.",
      };
    }

    // 2. Generate and store the reset token in the database
    const tokenResult = await ctx.runMutation(
      internal.passwordReset.generateResetToken,
      { email: args.email }
    );

    if (!tokenResult.success) {
      return {
        success: false,
        message: tokenResult.message,
      };
    }

    const token = tokenResult.token as string;
    const name = tokenResult.name as string;
    const email = tokenResult.email as string;

    // 3. Send the password reset email synchronously
    try {
      console.log("[ForgotPassword] Dispatching email to:", email);
      const emailResult = await ctx.runAction(api.email.sendPasswordResetEmail, {
        email,
        name,
        token,
      });

      if (!emailResult || !emailResult.success) {
        throw new Error("Email sending failed according to email provider.");
      }

      console.log("[ForgotPassword] Reset email successfully sent & confirmed.");
      return { success: true };
    } catch (error) {
      console.error("[ForgotPassword] Email dispatch failed:", error);
      
      // Cleanup the generated token since email dispatch failed
      await ctx.runMutation(internal.passwordReset.cleanupResetToken, { token });

      return {
        success: false,
        message: "Failed to send password reset email. Please try again.",
      };
    }
  },
});

// ─── RESET PASSWORD ACTION (ENTRY POINT FOR CLIENTS) ─────────────────────────

export const resetPassword = action({
  args: {
    token: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; reason?: string; message?: string }> => {
    console.log("[resetPassword] Action invoked with token:", args.token ? "present" : "missing");

    if (!args.token) {
      console.warn("[resetPassword] No token provided");
      return { success: false, reason: "INVALID_TOKEN", message: "This password reset link is invalid. Request a new one." };
    }

    // Call validateResetToken query
    console.log("[resetPassword] Looking up token in DB...");
    const validation = await ctx.runQuery(internal.passwordReset.validateResetTokenInternal, {
      token: args.token,
    });
    console.log("[resetPassword] Token lookup validation result:", validation);

    if (!validation.valid || !validation.email) {
      const reason = validation.reason ?? "INVALID_TOKEN";
      const reasonMsg =
        reason === "EXPIRED" || reason === "ALREADY_USED"
          ? "This password reset link has expired. Request a new one."
          : "This password reset link is invalid. Request a new one.";
      return { 
        success: false, 
        reason: reason === "EXPIRED" ? "EXPIRED_TOKEN" : "INVALID_TOKEN", 
        message: reasonMsg 
      };
    }

    // Validate password strength
    const pw = args.password;
    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
      console.warn("[resetPassword] Password validation failed (complexity requirement not met)");
      return {
        success: false,
        reason: "PASSWORD_INVALID",
        message: "Password must be at least 8 characters and contain uppercase, lowercase, and numbers.",
      };
    }

    // --- Complete reset on Convex db ---
    try {
      console.log("[resetPassword] Executing completeResetPassword mutation in Convex db...");
      await ctx.runMutation(internal.passwordReset.completeResetPassword, {
        token: args.token,
        password: args.password,
      });
      console.log("[resetPassword] Convex db password update succeeded!");
    } catch (err: any) {
      console.error("[resetPassword] Convex db mutation error stack trace:", err.stack || err);
      let reason: string = "PASSWORD_UPDATE_FAILED";
      let message: string = "Failed to complete password reset in database.";
      if (err.message?.includes("INVALID_TOKEN")) {
        reason = "INVALID_TOKEN";
        message = "This password reset link is invalid. Request a new one.";
      } else if (err.message?.includes("ALREADY_USED")) {
        reason = "EXPIRED_TOKEN";
        message = "This password reset link has already been used.";
      } else if (err.message?.includes("EXPIRED")) {
        reason = "EXPIRED_TOKEN";
        message = "This password reset link has expired.";
      } else if (err.message?.includes("USER_NOT_FOUND")) {
        reason = "USER_NOT_FOUND";
        message = "User not found.";
      }
      return {
        success: false,
        reason,
        message,
      };
    }

    return { success: true };
  },
});

// ─── INTERNAL MUTATIONS ──────────────────────────────────────────────────────

export const generateResetToken = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (!user) {
      return {
        success: false,
        message: "This email is not registered yet. Please create an account.",
      };
    }

    // Rate limiting: max 3 requests per email per 15 minutes
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const recentTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .collect();

    const recentCount = recentTokens.filter(
      (t) => t.createdAt > fifteenMinutesAgo
    ).length;

    if (recentCount >= 3) {
      return {
        success: false,
        message: "Too many reset requests. Please wait 15 minutes before trying again.",
      };
    }

    // Clean up expired / used tokens
    for (const t of recentTokens) {
      if (t.expiresAt < Date.now() || t.used) {
        await ctx.db.delete(t._id);
      }
    }

    // Generate secure token
    const token = generateRandomToken();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      email: normalizedEmail,
      token,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    return {
      success: true,
      token,
      name: user.name ?? "there",
      email: normalizedEmail,
    };
  },
});

export const cleanupResetToken = internalMutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (record) {
      console.log("[ForgotPassword] Cleaning up token after email failure:", args.token);
      await ctx.db.delete(record._id);
    }
  },
});

export const completeResetPassword = internalMutation({
  args: {
    token: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const token = args.token;
    console.log("Reset token:", token);

    // Validate the token
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    console.log("Token record:", resetToken);

    if (!resetToken) {
      throw new Error("INVALID_TOKEN");
    }

    if (resetToken.used) {
      throw new Error("ALREADY_USED");
    }

    if (Date.now() > resetToken.expiresAt) {
      throw new Error("EXPIRED");
    }

    // Find the associated user
    const user = await ctx.db.get(resetToken.userId);
    console.log("User found:", user?._id);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    console.log("Old salt:", user.salt);

    // Generate a NEW salt
    const salt = generateSalt();
    console.log("New salt:", salt);

    // Generate a new password hash using custom SHA-256 function
    const passwordHash = await hashPassword(args.password, salt);
    console.log("New password hash:", passwordHash);

    // Update the users table
    await ctx.db.patch(user._id, {
      passwordHash,
      salt,
      updatedAt: Date.now(),
    });
    console.log("Password successfully updated");

    // Database verification: immediately re-fetch the user and log
    const verifiedUser = await ctx.db.get(user._id);
    console.log("passwordHash exists:", !!verifiedUser?.passwordHash);
    console.log("salt exists:", !!verifiedUser?.salt);
    console.log("updatedAt changed:", verifiedUser?.updatedAt !== user.updatedAt);

    // Mark this token as used
    await ctx.db.patch(resetToken._id, { used: true });

    // Delete ALL other reset tokens for this user
    const otherTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_userId", (q) => q.eq("userId", resetToken.userId))
      .collect();

    for (const t of otherTokens) {
      if (t._id !== resetToken._id) {
        await ctx.db.delete(t._id);
      }
    }
  },
});

// ─── VALIDATE RESET TOKEN (query) ────────────────────────────────────────────

async function validateTokenHelper(ctx: any, token: string) {
  if (!token) {
    return { valid: false, reason: "MISSING_TOKEN" as const };
  }

  const record = await ctx.db
    .query("passwordResetTokens")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();

  if (!record) {
    console.warn("[validateResetToken] Token not found");
    return { valid: false, reason: "INVALID_TOKEN" as const };
  }

  if (record.used) {
    console.warn("[validateResetToken] Token already used");
    return { valid: false, reason: "ALREADY_USED" as const };
  }

  if (Date.now() > record.expiresAt) {
    console.warn("[validateResetToken] Token expired");
    return { valid: false, reason: "EXPIRED" as const };
  }

  return { valid: true, email: record.email };
}

export const validateResetTokenInternal = internalQuery({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    return await validateTokenHelper(ctx, args.token);
  },
});

export const validateResetToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    return await validateTokenHelper(ctx, args.token);
  },
});
