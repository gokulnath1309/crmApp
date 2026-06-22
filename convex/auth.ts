declare const process: { env: Record<string, string | undefined> };

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

// Helper functions for password hashing
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

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── CONVEX AUTH (GOOGLE OAUTH) CONFIGURATION ────────────────────────────────
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx_, args) {
      const ctx = ctx_ as unknown as MutationCtx;
      const { existingUserId, profile } = args;
      const email = (profile.email ?? "").trim().toLowerCase();

      console.log("[Google OAuth] createOrUpdateUser:", {
        email,
        existingUserId,
        profileName: profile.name,
      });

      if (!email) {
        throw new Error("Email is required for Google sign-in");
      }

      const now = Date.now();

      // Case 1: Auth link already exists — update existing user
      if (existingUserId !== null) {
        const user = await ctx.db.get(existingUserId);
        if (user === null) {
          console.warn(`[Google OAuth] User doc ${existingUserId} not found, creating new`);
          const newUserId = await ctx.db.insert("users", {
            email,
            name: (profile.name as string) ?? undefined,
            image: (profile.image as string) ?? undefined,
            role: "member",
            emailVerified: true,
            authProvider: "google",
            createdAt: now,
            updatedAt: now,
          });
          return newUserId;
        }
        await ctx.db.patch(existingUserId, {
          name: (profile.name as string) ?? undefined,
          image: (profile.image as string) ?? undefined,
          emailVerified: true,
          authProvider: "google",
          updatedAt: now,
        });
        console.log("[Google OAuth] Existing user signed in:", { email, userId: existingUserId });
        return existingUserId;
      }

      // Case 2: No auth link yet — find or create by email
      const existingUsers = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();

      if (existingUsers.length > 0) {
        const passwordUser = existingUsers.find((u) => u.passwordHash);
        const googleUser = existingUsers.find((u) => !u.passwordHash);

        if (passwordUser) {
          await ctx.db.patch(passwordUser._id, {
            name: passwordUser.name ?? (profile.name as string) ?? undefined,
            image: passwordUser.image ?? (profile.image as string) ?? undefined,
            emailVerified: true,
            authProvider: "google",
            updatedAt: now,
          });

          if (googleUser && googleUser._id !== passwordUser._id) {
            console.log("[Google OAuth] Merging duplicate Google user:", googleUser._id, "into password user:", passwordUser._id);
            await ctx.db.delete(googleUser._id);
          }

          console.log("[Google OAuth] Linked Google to existing password user:", passwordUser._id);
          return passwordUser._id;
        }

        if (googleUser) {
          await ctx.db.patch(googleUser._id, {
            name: (profile.name as string) ?? undefined,
            image: (profile.image as string) ?? undefined,
            emailVerified: true,
            authProvider: "google",
            updatedAt: now,
          });
          console.log("[Google OAuth] Re-linking existing Google user:", googleUser._id);
          return googleUser._id;
        }
      }

      // Case 3: No existing user — create new
      const newUserId = await ctx.db.insert("users", {
        email,
        name: (profile.name as string) ?? undefined,
        image: (profile.image as string) ?? undefined,
        role: "member",
        emailVerified: true,
        authProvider: "google",
        createdAt: now,
        updatedAt: now,
      });

      console.log("[Google OAuth] New user created:", { email, userId: newUserId });
      return newUserId;
    },
  },
});

// ─── CUSTOM PASSWORD AUTHENTICATION MUTATIONS (WITH OTP GATING) ──────────────

export const customSignUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize: always compare lowercase+trimmed emails
    const email = args.email.trim().toLowerCase();
    const { password, name } = args;

    console.log("[customSignUp] Signup email:", email);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    console.log("[customSignUp] Existing user:", existingUser ? { id: existingUser._id, hasPassword: !!existingUser.passwordHash } : null);

    if (existingUser) {
      if (existingUser.passwordHash) {
        return { error: "This email already exists. Please sign in." };
      }
      return { error: "This email is registered with Google. Please use Continue with Google." };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    // Clear existing OTPs for this email
    const existingOtps = await ctx.db
      .query("emailOtps")
      .withIndex("email", (q) => q.eq("email", email))
      .collect();
    for (const o of existingOtps) {
      await ctx.db.delete(o._id);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("[customSignUp] Generated OTP for signup");

    // Insert pending OTP record with cached signup details
    await ctx.db.insert("emailOtps", {
      email,
      otp: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      verified: false,
      createdAt: Date.now(),
      pendingName: name,
      pendingPasswordHash: passwordHash,
      pendingSalt: salt,
    });

    console.info(`[customSignUp] OTP scheduled for ${email}`);
    await ctx.scheduler.runAfter(0, api.email.sendOtpEmail, { email, otp: otpCode });

    return {
      requiresOtp: true,
      email,
    };
  },
});

export const customSignIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize email
    const email = args.email.trim().toLowerCase();
    const { password } = args;

    const users = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    const user = users.find((u) => u.passwordHash) ?? null;
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordHash = await hashPassword(password, user.salt ?? "");
    if (passwordHash !== (user.passwordHash ?? "")) {
      throw new Error("Invalid email or password");
    }

    // Clear existing OTPs
    const existingOtps = await ctx.db
      .query("emailOtps")
      .withIndex("email", (q) => q.eq("email", email))
      .collect();
    for (const o of existingOtps) {
      await ctx.db.delete(o._id);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert pending OTP record
    await ctx.db.insert("emailOtps", {
      email,
      otp: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      verified: false,
      createdAt: Date.now(),
    });

    console.info(`[Credentials Signin] Scheduled OTP send for ${email}: ${otpCode}`);
    await ctx.scheduler.runAfter(0, api.email.sendOtpEmail, { email, otp: otpCode });

    return {
      requiresOtp: true,
      email,
    };
  },
});

export const customSignOut = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authToken", (q) => q.eq("authToken", args.token))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { authToken: undefined, updatedAt: Date.now() });
    }
  },
});

// ─── OTP VERIFICATION MUTATIONS & QUERIES ───────────────────────────────────

export const verifyOtp = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Verifying OTP");
    console.log("Email:", args.email);
    console.log("OTP:", args.otp);

    const otpRecords = await ctx.db
      .query("emailOtps")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();

    console.log("Found OTP Records count:", otpRecords.length);

    // Fetch the latest OTP record
    const otpRecord = otpRecords[otpRecords.length - 1] ?? null;
    console.log("OTP Record:", otpRecord);

    if (otpRecord === null) {
      console.error("[verifyOtp] Error: OTP not found");
      throw new Error("OTP not found");
    }

    if (Date.now() > otpRecord.expiresAt) {
      console.error("[verifyOtp] Error: OTP expired");
      throw new Error("OTP expired");
    }

    if (otpRecord.otp !== args.otp) {
      console.error("[verifyOtp] Error: Invalid OTP");
      throw new Error("Invalid OTP");
    }

    // Success! Mark verified
    await ctx.db.patch(otpRecord._id, { verified: true });
    
    // Clean up all OTP records for this email
    for (const record of otpRecords) {
      await ctx.db.delete(record._id);
    }

    console.info(`[verifyOtp] Verification success for email: ${args.email}`);

    // Is it a signup flow?
    if (otpRecord.pendingName && otpRecord.pendingPasswordHash && otpRecord.pendingSalt) {
      console.info(`[verifyOtp] Creating user for signup: ${args.email}`);

      // GUARD: ensure no duplicate slipped in between customSignUp and verifyOtp
      const alreadyExists = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .collect();
      const dupPasswordUser = alreadyExists.find((u) => u.passwordHash) ?? null;
      if (dupPasswordUser) {
        console.error(`[verifyOtp] Duplicate detected for ${args.email} — returning existing session`);
        const authToken = generateToken();
        await ctx.db.patch(dupPasswordUser._id, { authToken, emailVerified: true, updatedAt: Date.now() });
        return {
          userId: dupPasswordUser._id,
          token: authToken,
          user: { _id: dupPasswordUser._id, email: dupPasswordUser.email, name: dupPasswordUser.name, role: dupPasswordUser.role },
        };
      }

      const userId = await ctx.db.insert("users", {
        email: args.email,
        name: otpRecord.pendingName,
        passwordHash: otpRecord.pendingPasswordHash,
        salt: otpRecord.pendingSalt,
        authProvider: "password",
        emailVerified: true,
        role: "member",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const authToken = generateToken();
      await ctx.db.patch(userId, { authToken });

      console.info(`[verifyOtp] Session created for signup user: ${userId}`);
      return {
        userId,
        token: authToken,
        user: {
          _id: userId,
          email: args.email,
          name: otpRecord.pendingName,
          role: "member",
        },
      };
    } else {
      // It is login or Google OAuth flow
      console.info(`[verifyOtp] Resolving existing user: ${args.email}`);
      const existingUsers = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .collect();

      // Prefer the password user for login flow; otherwise take the first user found (Google OAuth)
      const user = existingUsers.find((u) => u.passwordHash) ?? existingUsers[0] ?? null;

      if (!user) {
        console.error("[verifyOtp] Error: Email not found");
        throw new Error("Email not found");
      }

      await ctx.db.patch(user._id, {
        emailVerified: true,
        updatedAt: Date.now(),
      });

      // If password user, generate legacy token
      if (user.passwordHash) {
        const authToken = generateToken();
        await ctx.db.patch(user._id, { authToken });

        console.info(`[verifyOtp] Session created for credentials user: ${user._id}`);
        return {
          userId: user._id,
          token: authToken,
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }

      console.info(`[verifyOtp] Session verified for Google user: ${user._id}`);
      return {
        success: true,
        userId: user._id,
      };
    }
  },
});

export const getOtpStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const otps = await ctx.db
      .query("emailOtps")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();

    const otp = otps[otps.length - 1] ?? null;

    return {
      exists: !!otp,
      expiresAt: otp?.expiresAt ?? null,
      createdAt: otp?.createdAt ?? null,
      verified: otp?.verified ?? false,
    };
  },
});

// ─── INTERNAL OTP GENERATION FOR ACTION CALLS ───────────────────────────────

export const generateOtpInternal = mutation({
  args: {
    email: v.string(),
    flow: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, flow } = args;

    const existingOtps = await ctx.db
      .query("emailOtps")
      .withIndex("email", (q) => q.eq("email", email))
      .collect();

    const existingOtp = existingOtps[existingOtps.length - 1] ?? null;

    if (existingOtp && existingOtp.otp !== "pending" && Date.now() - existingOtp.createdAt < 30000) {
      throw new Error("Please wait 30 seconds before requesting a new OTP");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up all existing OTPs
    for (const o of existingOtps) {
      await ctx.db.delete(o._id);
    }

    await ctx.db.insert("emailOtps", {
      email,
      otp: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      verified: false,
      createdAt: Date.now(),
      pendingName: existingOtp?.pendingName,
      pendingPasswordHash: existingOtp?.pendingPasswordHash,
      pendingSalt: existingOtp?.pendingSalt,
    });

    console.info(`[generateOtpInternal] Generated ${flow} OTP for ${email}: ${otpCode}`);
    return otpCode;
  },
});

// ─── OTP SEND ACTION (MAKES EXTERNAL CALL TO RESEND) ─────────────────────────

export const sendOtpEmailAction = mutation({
  args: {
    email: v.string(),
    flow: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;
    
    // Generate the OTP
    const existingOtps = await ctx.db
      .query("emailOtps")
      .withIndex("email", (q) => q.eq("email", email))
      .collect();
    const existingOtp = existingOtps[existingOtps.length - 1] ?? null;

    if (existingOtp && existingOtp.otp !== "pending" && Date.now() - existingOtp.createdAt < 30000) {
      throw new Error("Please wait 30 seconds before requesting a new OTP");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up all existing OTPs
    for (const o of existingOtps) {
      await ctx.db.delete(o._id);
    }

    await ctx.db.insert("emailOtps", {
      email,
      otp: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      verified: false,
      createdAt: Date.now(),
      pendingName: existingOtp?.pendingName,
      pendingPasswordHash: existingOtp?.pendingPasswordHash,
      pendingSalt: existingOtp?.pendingSalt,
    });

    console.info(`[sendOtpEmailAction] Scheduled OTP send for ${email}: ${otpCode}`);
    await ctx.scheduler.runAfter(0, api.email.sendOtpEmail, { email, otp: otpCode });
    return { success: true };
  },
});


