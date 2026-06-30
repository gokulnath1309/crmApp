declare const process: { env: Record<string, string | undefined> };

import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { canEditField } from "./rbac";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { notifyUser } from "./lib/notifications";

function formatUserDoc(user: any) {
  return {
    _id: user._id,
    clerkId: user.clerkId,
    email: user.email ?? "",
    name: user.name ?? "",
    role: user.role ?? "employee",
    managerId: user.managerId,
    department: user.department,
    jobFunction: user.jobFunction,
    permissions: user.permissions ?? [],
    isActive: user.isActive ?? true,
    lastLogin: user.lastLogin,
    avatarUrl: user.image ?? user.avatarUrl,
    emailVerified: user.emailVerified ?? false,
    createdAt: user.createdAt ?? user._creationTime,
    updatedAt: user.updatedAt ?? user._creationTime,
    coverImage: user.coverImage,
    company: user.company,
    location: user.location,
    timezone: user.timezone,
    bio: user.bio,
    jobTitle: user.jobTitle,
    phone: user.phone,
    workspaceId: user.activeWorkspaceId,
    activeWorkspaceId: user.activeWorkspaceId,
    isOwner: user.isOwner,
  };
}

export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const t = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    console.log(`[getCurrentUser] t=${t} identity:`, { exists: !!identity, subject: identity?.subject, email: identity?.email });
    const user = await resolveUserReadOnly(ctx);
    if (user) {
      console.log(`[getCurrentUser] t=${t} Found:`, user._id, "bannerStorageId:", user.bannerStorageId, "profileStorageId:", user.profileStorageId);
      const doc = formatUserDoc(user);
      if (user.bannerStorageId) {
        const url = await ctx.storage.getUrl(user.bannerStorageId);
        console.log(`[getCurrentUser] t=${t} Resolved bannerStorageId ->`, url);
        if (url) doc.coverImage = url;
      }
      if (user.profileStorageId) {
        const url = await ctx.storage.getUrl(user.profileStorageId);
        console.log(`[getCurrentUser] t=${t} Resolved profileStorageId ->`, url);
        if (url) doc.avatarUrl = url;
      }
      console.log(`[getCurrentUser] t=${t} Returning doc:`, { coverImage: doc.coverImage, avatarUrl: doc.avatarUrl });
      return doc;
    }

    if (args.token) {
      const legacyUser = await ctx.db
        .query("users")
        .withIndex("by_authToken", (q) => q.eq("authToken", args.token))
        .unique();
      if (legacyUser) {
        console.log(`[getCurrentUser] t=${t} Found by legacy token:`, legacyUser._id);
        return formatUserDoc(legacyUser);
      }
    }

    console.log(`[getCurrentUser] t=${t} Not found, returning null`);
    return null;
  },
});

export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role ?? "employee",
      department: user.department,
      jobTitle: user.jobTitle,
      workspaceId: user.activeWorkspaceId,
      avatarUrl: user.image ?? user.avatarUrl,
    };
  },
});

export const debugEnv = action({
  args: {},
  handler: async () => {
    const convexSiteUrl = typeof process !== "undefined" ? process.env.CONVEX_SITE_URL : "process not defined";
    const siteUrl = typeof process !== "undefined" ? process.env.SITE_URL : "process not defined";
    const resendKey = typeof process !== "undefined" ? (process.env.RESEND_API_KEY ? "✅ Set (length: " + process.env.RESEND_API_KEY.length + ")" : "❌ MISSING") : "process not defined";
    return {
      CONVEX_SITE_URL: convexSiteUrl,
      SITE_URL: siteUrl,
      RESEND_API_KEY: resendKey,
      nodeEnv: typeof process !== "undefined" ? process.env.NODE_ENV : "N/A",
    };
  },
});

export const updateProfile = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) {
      if (args.token) {
        const legacyUser = await ctx.db
          .query("users")
          .withIndex("by_authToken", (q) => q.eq("authToken", args.token))
          .unique();
        if (legacyUser) {
          const patch: Record<string, string | number | undefined> = { updatedAt: Date.now() };
          if (args.name !== undefined) patch.name = args.name;
          if (args.avatarUrl !== undefined) {
            patch.avatarUrl = args.avatarUrl;
            patch.image = args.avatarUrl;
          }
          await ctx.db.patch(legacyUser._id, patch);
          return {
            _id: legacyUser._id,
            email: legacyUser.email ?? "",
            name: args.name ?? legacyUser.name ?? "",
            role: legacyUser.role ?? "employee",
            avatarUrl: args.avatarUrl ?? legacyUser.image ?? legacyUser.avatarUrl,
            createdAt: legacyUser.createdAt ?? legacyUser._creationTime,
            updatedAt: patch.updatedAt as number,
          };
        }
      }
      throw new Error("Not authenticated");
    }

    const patch: Record<string, string | number | undefined> = {
      updatedAt: Date.now(),
    };
    if (args.name !== undefined) patch.name = args.name;
    if (args.avatarUrl !== undefined) {
      patch.avatarUrl = args.avatarUrl;
      patch.image = args.avatarUrl;
    }

    await ctx.db.patch(user._id, patch);

    return {
      _id: user._id,
      email: user.email ?? "",
      name: args.name ?? user.name ?? "",
      role: user.role ?? "employee",
      avatarUrl: args.avatarUrl ?? user.image ?? user.avatarUrl,
      createdAt: user.createdAt ?? user._creationTime,
      updatedAt: patch.updatedAt as number,
    };
  },
});

export const generateProfileUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateProfileImage = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to retrieve uploaded image");
    }

    await ctx.db.patch(user._id, {
      avatarUrl: url,
      image: url,
      profileStorageId: args.storageId,
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "avatar_updated",
      description: "Updated profile avatar",
      userId: user._id,
      userName: user.name || "System",
      entityType: "user",
      entityId: user._id,
    });

    return { _id: user._id, avatarUrl: url };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser) {
      return [];
    }
    const workspaceId = currentUser.activeWorkspaceId;
    if (!workspaceId) {
      return [];
    }
    
    // Get all members for this workspace
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    // Fetch the user documents for each member
    const users = await Promise.all(
      members.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        if (!u) return null;
        return {
          _id: u._id,
          name: u.name || "Unknown User",
          email: u.email || "",
          role: m.role || "employee", // Get role from membership
          managerId: u.managerId,
          department: m.department || u.department, // Get department from membership
          jobTitle: u.jobTitle,
          permissions: u.permissions || [],
          isActive: m.status === "active",
          lastLogin: u.lastLogin,
          avatarUrl: u.image || u.avatarUrl,
        };
      })
    );

    return users.filter((u): u is NonNullable<typeof u> => u != null);
  },
});

export const ensureUserExists = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUser(ctx);
    return user ? formatUserDoc(user) : null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Pure DB writer — receives pre-validated caller context as args.
// Auth is resolved in the action (inviteUser) where Clerk identity is reliable.
// ─────────────────────────────────────────────────────────────────────────────
export const createInvitationRecord = internalMutation({
  args: {
    // Caller-provided (pre-validated in the action)
    callerUserId: v.id("users"),
    callerName: v.string(),
    callerWorkspaceId: v.id("workspaces"),
    callerWorkspaceName: v.string(),
    callerManagerName: v.optional(v.string()),
    // Invitation payload
    email: v.string(),
    name: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
    permissions: v.optional(v.array(v.string())),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const now = Date.now();

    console.log("[createInvitationRecord] Creating invitation record", { email, role: args.role, company: args.callerWorkspaceId });

    // Check if user already exists in company
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingUser) {
      const existingMembership = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_user_workspace", (q) =>
          q.eq("userId", existingUser._id).eq("workspaceId", args.callerWorkspaceId)
        )
        .first();
      if (existingMembership && existingMembership.status === "active") {
        throw new Error("User with this email is already a member of your company");
      }
    }

    // Check for existing pending (not yet expired) invitation
    const existingInvitation = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_workspace_email", (q) =>
        q.eq("workspaceId", args.callerWorkspaceId).eq("email", email)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (existingInvitation) {
      if (existingInvitation.expiresAt < now) {
        console.log("[createInvitationRecord] Found expired pending invitation — auto-expiring it:", existingInvitation._id);
        await ctx.db.patch(existingInvitation._id, { status: "expired" });
      } else {
        console.error("[createInvitationRecord] Blocking — active pending invitation exists:", existingInvitation._id);
        throw new Error("An invitation is already pending for this email address");
      }
    }

    const invitationId = await ctx.db.insert("workspaceInvitations", {
      workspaceId: args.callerWorkspaceId,
      email,
      role: args.role,
      department: args.department,
      invitedBy: args.callerUserId,
      inviteToken: args.token,
      status: "pending",
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: now,
    });

    console.log("[createInvitationRecord] Invitation record created:", invitationId);

    // Log activity
    await ctx.db.insert("activities", {
      type: "user_invited",
      description: `invited ${args.name} (${email}) to join the company`,
      userId: args.callerUserId,
      userName: args.callerName,
      entityType: "user",
      entityId: invitationId,
      workspaceId: args.callerWorkspaceId,
      createdAt: now,
    });

    return { invitationId };
  },
});

export const updateInvitationEmailStatus = internalMutation({
  args: {
    invitationId: v.id("workspaceInvitations"),
    status: v.string(), // "email_sent" | "email_failed"
    emailStatus: v.string(), // "sent" | "failed"
    emailError: v.optional(v.string()),
    messageId: v.optional(v.string()),
    smtpResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: any = {
      status: args.status,
      emailStatus: args.emailStatus,
      lastDeliveryStatus: args.emailStatus,
    };
    if (args.emailStatus === "sent") {
      patch.sentAt = Date.now();
      patch.emailSentAt = Date.now();
      if (args.messageId) {
        patch.messageId = args.messageId;
      }
      if (args.smtpResponse) {
        patch.smtpResponse = args.smtpResponse;
      }
      patch.lastDeliveryError = undefined;
    } else {
      patch.lastDeliveryError = args.emailError;
    }
    if (args.emailError !== undefined) {
      patch.emailError = args.emailError;
    }
    console.log("[updateInvitationEmailStatus] Patching invitation", args.invitationId, {
      status: args.status,
      emailStatus: args.emailStatus,
      hasError: !!args.emailError,
    });
    await ctx.db.patch(args.invitationId, patch);
    console.log("[updateInvitationEmailStatus] ✅ Patched successfully");
  },
});

export const createInviteNotification = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    invitedName: v.string(),
    invitedEmail: v.string(),
    invitationId: v.id("workspaceInvitations"),
    senderId: v.id("users"),
    senderName: v.string(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, invitedName, invitedEmail, invitationId, senderId, senderName, success, errorMessage } = args;
    const now = Date.now();

    // Find all admin and super_admin users in the company via workspaceMembers
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const adminMembers = members.filter(
      (m) =>
        m.role.toLowerCase() === "admin" ||
        m.role.toLowerCase() === "super_admin"
    );

    const title = success
      ? `Invitation sent to ${invitedName}`
      : `Failed to invite ${invitedName}`;
    const message = success
      ? `${senderName} invited ${invitedName} (${invitedEmail}) to join the company.`
      : `Failed to send invitation to ${invitedName} (${invitedEmail}). Error: ${errorMessage || "Unknown error"}`;

    for (const member of adminMembers) {
      // Don't notify the sender on success (they already know)
      if (member.userId === senderId && success) continue;

      await ctx.db.insert("notifications", {
        userId: member.userId,
        workspaceId,
        title,
        message,
        type: success ? "user_invited" : "invite_failed",
        entityType: "invitation",
        entityId: invitationId,
        read: false,
        createdBy: senderId,
        createdAt: now,
      });
    }
  },
});

export const cancelInvitation = mutation({
  args: {
    id: v.id("workspaceInvitations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");
    const workspaceId = currentUser.activeWorkspaceId;
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      throw new Error("Unauthorized: Only Admins can cancel workspaceInvitations");
    }

    const invitation = await ctx.db.get(args.id);
    if (!invitation) throw new Error("Invitation not found");

    if (invitation.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: Cannot cancel invitation for another company");
    }

    await ctx.db.patch(args.id, { status: "revoked" });

    await ctx.db.insert("activities", {
      type: "invite_revoked",
      description: `revoked invitation for ${invitation.email}`,
      userId: currentUser._id,
      userName: currentUser.name || "System",
      entityType: "user",
      entityId: args.id,
      workspaceId,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ACTION: Validates auth here (Clerk identity is reliable in actions),
// then orchestrates DB write → email send → status update atomically.
// ─────────────────────────────────────────────────────────────────────────────
export const inviteUser = action({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
    permissions: v.optional(v.array(v.string())),
    token: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // ── STEP 1: Authenticate & Authorise ──────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity();
    console.log("[inviteUser] Step 1 — Identity:", {
      exists: !!identity,
      subject: identity?.subject,
      email: identity?.email,
    });
    if (!identity) {
      console.error("[inviteUser] Step 1 ❌ — No identity found");
      throw new Error("Not authenticated. Please sign in first.");
    }

    // Resolve the Convex user from the database
    console.log("[inviteUser] Step 1 — Resolving Convex user from identity...");
    const callerUser: any = await ctx.runQuery(api.users.getCurrentUser, {});
    console.log("[inviteUser] Step 1 — Current User:", {
      id: callerUser?._id,
      role: callerUser?.role,
      workspaceId: callerUser?.activeWorkspaceId,
      name: callerUser?.name,
    });

    if (!callerUser) {
      console.error("[inviteUser] Step 1 ❌ — Convex user record not found");
      throw new Error("User record not found. Try refreshing.");
    }
    if (callerUser.role !== "super_admin" && callerUser.role !== "admin") {
      console.error("[inviteUser] Step 1 ❌ — Unauthorized role:", callerUser.role);
      throw new Error(`Unauthorized: Your role is '${callerUser.role}'. Only Super Admin or Admin can invite users.`);
    }
    const workspaceId = callerUser.activeWorkspaceId;
    if (!workspaceId) {
      console.error("[inviteUser] Step 1 ❌ — User has no activeWorkspaceId");
      throw new Error("Unauthorized: You must belong to a company workspace to invite users.");
    }

    // ── STEP 2: Check plan user limit ────────────────────────────────────────
    console.log("[inviteUser] Step 2 — Checking plan user limit...");
    const limitResult: any = await ctx.runMutation(api.subscriptions.checkUserLimit, { workspaceId });
    if (limitResult.atLimit) {
      console.error(`[inviteUser] Step 2 ❌ — User limit reached: ${limitResult.currentCount}/${limitResult.maxUsers}`);
      throw new Error(
        `User limit reached. Your ${limitResult.plan === "basic" ? "Basic" : "current"} plan allows up to ${limitResult.maxUsers} users. ` +
        (limitResult.plan === "basic"
          ? "Upgrade to Professional to add more users."
          : "Please contact support or upgrade your plan.")
      );
    }
    console.log("[inviteUser] Step 2 ✅ — User limit OK:", `${limitResult.currentCount}/${limitResult.maxUsers}`);

    // ── STEP 3: Resolve company and manager names ─────────────────────────────
    console.log("[inviteUser] Step 3 — Looking up company...");
    const company: any = await ctx.runQuery(api.workspaces.getById, { id: workspaceId });
    const callerWorkspaceName = company?.name || "CRM Pro";
    console.log("[inviteUser] Step 3 — Company:", { id: workspaceId, name: callerWorkspaceName });

    let callerManagerName: string | undefined;
    if (args.managerId) {
      console.log("[inviteUser] Step 3 — Looking up manager...");
      const manager: any = await ctx.runQuery(api.users.getUserById, { id: args.managerId });
      callerManagerName = manager?.name || manager?.email;
      console.log("[inviteUser] Step 3 — Manager:", { id: args.managerId, name: callerManagerName });
    }

    // ── STEP 4: Create invitation record (status: pending) ────────────────────
    console.log("[inviteUser] Step 4 — Creating invitation record in DB...");
    console.log("[inviteUser] Step 4 — Payload:", {
      email: args.email,
      name: args.name,
      role: args.role,
      department: args.department,
      workspaceId: workspaceId,
      token: args.token?.slice(0, 8) + "...",
    });
    const { invitationId } = await (ctx.runMutation(internal.users.createInvitationRecord, {
      callerUserId: callerUser._id,
      callerName: callerUser.name || callerUser.email || "Admin",
      callerWorkspaceId: workspaceId,
      callerWorkspaceName,
      callerManagerName,
      email: args.email,
      name: args.name,
      role: args.role,
      department: args.department,
      jobTitle: args.jobTitle,
      managerId: args.managerId,
      permissions: args.permissions,
      token: args.token,
    }) as any);
    console.log("[inviteUser] Step 4 ✅ — Invitation record created:", invitationId);

    // ── STEP 5: Send email via Resend ─────────────────────────────────────────
    try {
      console.log("[inviteUser] Step 5 — Preparing to call sendInvitationEmail action...");
      console.log("[inviteUser] Step 5 — Email args:", {
        to: args.email.trim().toLowerCase(),
        name: args.name.trim(),
        role: args.role,
        company: callerWorkspaceName,
        token: args.token?.slice(0, 8) + "...",
      });
      const emailResult = await ctx.runAction(api.email.sendInvitationEmail, {
        email: args.email.trim().toLowerCase(),
        name: args.name.trim(),
        role: args.role,
        department: args.department,
        managerName: callerManagerName,
        companyName: callerWorkspaceName,
        token: args.token,
      });
      console.log("[inviteUser] Step 5 ✅ — Resend API response:", JSON.stringify(emailResult));

      console.log("[inviteUser] Step 5 — Updating invitation status → email_sent");
      await ctx.runMutation(internal.users.updateInvitationEmailStatus, {
        invitationId,
        status: "email_sent",
        emailStatus: "sent",
        messageId: emailResult.messageId,
        smtpResponse: emailResult.smtpResponse,
      });

      // ── STEP 6: Notify admins ─────────────────────────────────────────────
      console.log("[inviteUser] Step 6 — Creating success notifications for admins...");
      await ctx.runMutation(internal.users.createInviteNotification, {
        workspaceId: workspaceId,
        invitedName: args.name.trim(),
        invitedEmail: args.email.trim().toLowerCase(),
        invitationId,
        senderId: callerUser._id,
        senderName: callerUser.name || "Admin",
        success: true,
      });

      console.log("[inviteUser] ✅ Invitation flow complete. ID:", invitationId);
      return invitationId;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : "No stack trace";
      console.error("[inviteUser] ❌ Email send FAILED at Step 4.");
      console.error("[inviteUser] ❌ Error message:", errorMsg);
      console.error("[inviteUser] ❌ Error stack:", errorStack);

      // ── STEP 5 (failure path): Mark as email_failed ─────────────────────
      console.log("[inviteUser] Step 5 (fail) — Updating invitation status → email_failed");
      await ctx.runMutation(internal.users.updateInvitationEmailStatus, {
        invitationId,
        status: "email_failed",
        emailStatus: "failed",
        emailError: errorMsg,
      });

      console.log("[inviteUser] Step 5 (fail) — Creating failure notifications for admins...");
      await ctx.runMutation(internal.users.createInviteNotification, {
        workspaceId: workspaceId,
        invitedName: args.name.trim(),
        invitedEmail: args.email.trim().toLowerCase(),
        invitationId,
        senderId: callerUser._id,
        senderName: callerUser.name || "Admin",
        success: false,
        errorMessage: errorMsg,
      });

      // Surface the error to the UI — it is already tracked in DB
      throw new Error(errorMsg);
    }
  },
});

export const updateUserRole = mutation({
  args: {
    id: v.id("users"),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    managerId: v.optional(v.union(v.id("users"), v.null())),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");
    const workspaceId = currentUser.activeWorkspaceId;

    const targetUser = await ctx.db.get(args.id);
    if (!targetUser) throw new Error("User not found");

    const targetMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", targetUser._id).eq("workspaceId", workspaceId)
      )
      .first();
    if (!targetMembership || targetMembership.status !== "active") {
      throw new Error("Unauthorized: Cannot modify user outside your company");
    }

    const isSuperAdmin = currentUser.role === "super_admin";

    if (targetUser.role === "super_admin" && !isSuperAdmin) {
      throw new Error("Unauthorized: Only Super Admins can modify Super Admin accounts");
    }

    const isAdmin = currentUser.role === "admin" && targetUser.managerId === currentUser._id;

    if (!isSuperAdmin && !isAdmin) {
      throw new Error("Unauthorized");
    }

    const patch: any = { updatedAt: Date.now() };

    if (args.role !== undefined) {
      if (!isSuperAdmin) throw new Error("Unauthorized to change roles");
      patch.role = args.role;

      if (targetUser.role !== args.role) {
        await ctx.scheduler.runAfter(0, internal.activities.log, {
          type: "role_updated",
          description: `changed role of ${targetUser.name || targetUser.email} from ${targetUser.role || "none"} to ${args.role}`,
          userId: currentUser._id ?? undefined,
          userName: currentUser.name || "System",
          entityType: "user",
          entityId: args.id,
        });
      }
    }

    if (args.department !== undefined) patch.department = args.department;
    if (args.jobTitle !== undefined) patch.jobTitle = args.jobTitle;
    if (args.managerId !== undefined) {
      if (!isSuperAdmin) throw new Error("Unauthorized to change manager");
      patch.managerId = args.managerId === null ? undefined : args.managerId;
    }
    if (args.permissions !== undefined) {
      if (!isSuperAdmin) throw new Error("Unauthorized to change permissions");
      patch.permissions = args.permissions;
    }
    if (args.isActive !== undefined) {
      patch.isActive = args.isActive;
    }

    await ctx.db.patch(args.id, patch);

    if (args.role !== undefined && targetUser.role !== args.role) {
      await notifyUser(ctx, args.id, "role_changed", {
        entityName: targetUser.name || "User",
        role: args.role,
        entityType: "user",
        entityId: args.id,
        createdBy: currentUser._id,
      });
    }

    return args.id;
  },
});

export const updateProfileDetails = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    location: v.optional(v.string()),
    timezone: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    company: v.optional(v.string()),
    activityType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("[AUTH] Profile details update started");
    const user = await resolveUser(ctx);
    if (!user) {
      console.error("[AUTH] Profile details update: No authenticated user");
      throw new Error("Not authenticated");
    }
    console.log("[AUTH] Profile details update: user resolved", user._id, "role:", user.role);

    const userRole = user.role || "employee";

    const keysToCheck = [
      { key: "name", name: "name" },
      { key: "phone", name: "phone" },
      { key: "department", name: "department" },
      { key: "jobTitle", name: "jobTitle" },
      { key: "location", name: "location" },
      { key: "timezone", name: "timezone" },
      { key: "bio", name: "bio" },
      { key: "avatarUrl", name: "avatarUrl" },
      { key: "company", name: "company" },
    ];

    for (const { key, name } of keysToCheck) {
      if ((args as any)[key] !== undefined) {
        const currentValue = (user as any)[key === "avatarUrl" ? "avatarUrl" : key];
        const newValue = (args as any)[key];
        if (currentValue !== newValue) {
          if (!canEditField(name, userRole)) {
            throw new Error("You do not have permission to modify this field.");
          }
        }
      }
    }

    const patch: any = { updatedAt: Date.now() };

    if (args.name !== undefined) patch.name = args.name;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.department !== undefined) patch.department = args.department;
    if (args.jobTitle !== undefined) patch.jobTitle = args.jobTitle;
    if (args.location !== undefined) patch.location = args.location;
    if (args.timezone !== undefined) patch.timezone = args.timezone;
    if (args.bio !== undefined) patch.bio = args.bio;
    if (args.avatarUrl !== undefined) {
      patch.avatarUrl = args.avatarUrl;
      patch.image = args.avatarUrl;
    }
    if (args.company !== undefined) patch.company = args.company;

    await ctx.db.patch(user._id, patch);
    console.log("[AUTH] Profile details patched:", user._id, Object.keys(patch));

    const logsToCreate: Array<{ type: string; desc: string }> = [];

    if (args.avatarUrl !== undefined && user.avatarUrl !== args.avatarUrl) {
      logsToCreate.push({ type: "avatar_updated", desc: "Updated profile avatar" });
    }
    if (args.department !== undefined && user.department !== args.department) {
      logsToCreate.push({ type: "department_updated", desc: "Updated department assignment" });
    }
    if (args.jobTitle !== undefined && user.jobTitle !== args.jobTitle) {
      logsToCreate.push({ type: "job_title_updated", desc: "Updated job title" });
    }

    let generalProfileChanged = false;
    const generalFields = ["name", "phone", "location", "timezone", "bio", "company"];
    for (const f of generalFields) {
      if ((args as any)[f] !== undefined && (user as any)[f] !== (args as any)[f]) {
        generalProfileChanged = true;
        break;
      }
    }

    if (generalProfileChanged) {
      const actType = args.activityType || "profile_updated";
      const actDesc = actType === "personal_info_updated" ? "Updated personal information" : "Updated profile information";
      logsToCreate.push({ type: actType, desc: actDesc });
    }

    for (const logItem of logsToCreate) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: logItem.type,
        description: logItem.desc,
        userId: user._id,
        userName: user.name || "System",
        entityType: "user",
        entityId: user._id,
      });
    }

    return { _id: user._id, ...patch };
  },
});

export const generateBannerUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateCoverImage = mutation({
  args: {
    storageId: v.optional(v.id("_storage")),
    coverImage: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userRole = user.role || "employee";

    // Remove cover image
    if (args.storageId === undefined && args.coverImage === null) {
      console.log("[updateCoverImage] REMOVE path for user", user._id);
      if (!canEditField("coverImage", userRole)) {
        throw new Error("You do not have permission to modify this field.");
      }
      await ctx.db.patch(user._id, {
        coverImage: undefined,
        bannerStorageId: undefined,
        updatedAt: Date.now(),
      });
      return { _id: user._id, coverImage: null };
    }

    // File upload via storage
    if (args.storageId !== undefined) {
      console.log("[updateCoverImage] FILE UPLOAD path, storageId:", args.storageId);
      if (!canEditField("coverImage", userRole)) {
        throw new Error("You do not have permission to modify this field.");
      }
      const url = await ctx.storage.getUrl(args.storageId);
      if (!url) {
        throw new Error("Failed to retrieve uploaded image");
      }
      console.log("[updateCoverImage] Resolved URL:", url);
      await ctx.db.patch(user._id, {
        coverImage: url,
        bannerStorageId: args.storageId,
        updatedAt: Date.now(),
      });
      console.log("[updateCoverImage] Patched coverImage + bannerStorageId");
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "cover_updated",
        description: "Updated profile cover",
        userId: user._id,
        userName: user.name || "System",
        entityType: "user",
        entityId: user._id,
      });
      return { _id: user._id, coverImage: url };
    }

    // URL paste fallback
    if (args.coverImage !== undefined) {
      console.log("[updateCoverImage] URL PASTE path, coverImage:", args.coverImage);
      if (!canEditField("coverImage", userRole)) {
        throw new Error("You do not have permission to modify this field.");
      }
      const url = args.coverImage;
      await ctx.db.patch(user._id, {
        coverImage: url === null ? undefined : url,
        bannerStorageId: undefined,
        updatedAt: Date.now(),
      });
      return { _id: user._id, coverImage: url };
    }

    console.log("[updateCoverImage] FALLTHROUGH — no args matched");
    return { _id: user._id, coverImage: user.coverImage ?? null };
  },
});

export const diagnoseUsers = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    const emailCounts = new Map<string, number>();
    for (const u of allUsers) {
      if (u.email) {
        emailCounts.set(u.email, (emailCounts.get(u.email) || 0) + 1);
      }
    }

    const duplicateEmails: string[] = [];
    for (const [email, count] of emailCounts) {
      if (count > 1) duplicateEmails.push(email);
    }

    const missingClerkId = allUsers.filter((u) => !u.clerkId);
    const missingEmail = allUsers.filter((u) => !u.email);
    const missingName = allUsers.filter((u) => !u.name);

    return {
      totalUsers: allUsers.length,
      usersMissingClerkId: missingClerkId.length,
      usersMissingEmail: missingEmail.length,
      usersMissingName: missingName.length,
      duplicateEmails,
      users: allUsers.map((u) => ({
        _id: u._id,
        clerkId: u.clerkId || "(missing)",
        email: u.email || "(missing)",
        name: u.name || "(missing)",
        role: u.role || "(missing)",
        authProvider: u.authProvider || "clerk",
        hasPassword: !!u.passwordHash,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      })),
    };
  },
});

export const healUsersTable = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    let healed = 0;
    let removed = 0;

    for (const email of new Set(allUsers.filter((u) => u.email).map((u) => u.email))) {
      const usersWithEmail = allUsers.filter((u) => u.email === email);
      if (usersWithEmail.length <= 1) continue;

      console.warn("[healUsersTable] Duplicate email detected:", email, "count:", usersWithEmail.length);
      const withPassword = usersWithEmail.find((u) => u.passwordHash);
      const withClerkId = usersWithEmail.find((u) => u.clerkId);
      const keeper = withPassword || withClerkId || usersWithEmail[0];

      for (const dup of usersWithEmail) {
        if (dup._id === keeper._id) continue;
        console.warn("[healUsersTable] Removing duplicate user:", dup._id, "keeping:", keeper._id);
        await ctx.db.delete(dup._id);
        removed++;
      }
    }

    const allUsersAfter = await ctx.db.query("users").collect();
    for (const user of allUsersAfter) {
      if (!user.clerkId) {
        console.warn("[healUsersTable] User missing clerkId:", user._id, user.email);
        healed++;
      }
    }

    return { healed, removed, totalAfter: allUsersAfter.length };
  },
});

export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.token))
      .first();

    if (!invitation) return null;

    const company = await ctx.db.get(invitation.workspaceId);
    const inviter = await ctx.db.get(invitation.invitedBy);
    let managerName = undefined;
    if ((invitation as any).managerId) {
      const manager = await ctx.db.get((invitation as any).managerId);
      managerName = (manager as any)?.name || (manager as any)?.email;
    }

    return {
      ...invitation,
      companyName: company?.name || "CRMPro Company",
      inviterName: inviter?.name || "Admin",
      managerName,
    };
  },
});

export const acceptInvitationMutation = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser) {
      throw new Error("Unauthorized: Not authenticated");
    }

    const invitation = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending" && invitation.status !== "email_sent") {
      throw new Error(`Invitation is already ${invitation.status}`);
    }

    if (Date.now() > invitation.expiresAt) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    // Accept invitation: update user properties
    const updateFields: Record<string, any> = {
      activeWorkspaceId: invitation.workspaceId,
      role: invitation.role,
      isActive: true,
      updatedAt: Date.now(),
    };
    if ((invitation as any).department) updateFields.department = (invitation as any).department;
    if ((invitation as any).jobTitle) updateFields.jobTitle = (invitation as any).jobTitle;
    if ((invitation as any).managerId) updateFields.managerId = (invitation as any).managerId;
    if ((invitation as any).permissions) updateFields.permissions = (invitation as any).permissions;
    await ctx.db.patch(currentUser._id, updateFields);

    // Create membership for the new workspace
    const existingMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", currentUser._id).eq("workspaceId", invitation.workspaceId)
      )
      .first();
    if (existingMembership) {
      if (existingMembership.status !== "active") {
        await ctx.db.patch(existingMembership._id, {
          role: invitation.role,
          department: invitation.department,
          status: "active",
          joinedAt: Date.now(),
        });
      }
    } else {
      await ctx.db.insert("workspaceMembers", {
        workspaceId: invitation.workspaceId,
        clerkUserId: currentUser.clerkId,
        userId: currentUser._id,
        role: invitation.role,
        department: invitation.department,
        status: "active",
        joinedAt: Date.now(),
      });
    }

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, {
      status: "accepted",
    });

    const company = await ctx.db.get(invitation.workspaceId);
    const companyName = company ? company.name : "the company";

    // Create welcome notification
    await ctx.db.insert("notifications", {
      userId: currentUser._id,
      workspaceId: invitation.workspaceId,
      title: `Welcome to ${companyName}`,
      message: `You have successfully joined ${companyName} as a ${invitation.role}.`,
      type: "system",
      read: false,
      createdAt: Date.now(),
    });

    // Create activity
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "joined_company",
      description: `joined ${companyName} via invitation`,
      userId: currentUser._id,
      userName: currentUser.name || "New Employee",
      entityType: "user",
      entityId: currentUser._id,
      workspaceId: invitation.workspaceId,
    });

    return {
      workspaceId: invitation.workspaceId,
      clerkOrgId: company?.clerkOrgId,
      clerkUserId: currentUser.clerkId,
      role: invitation.role,
    };
  },
});

export const acceptInvitation = action({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<any> => {
    // 1. Run the mutation internally
    const result = await (ctx.runMutation(internal.users.acceptInvitationMutation, {
      token: args.token,
    }) as any);

    // 2. Call Clerk Backend API to add user to Clerk Organization if clerkOrgId exists
    const apiKey = process.env.CLERK_SECRET_KEY;
    if (apiKey && result.clerkOrgId && result.clerkUserId) {
      const url = `https://api.clerk.com/v1/organizations/${result.clerkOrgId}/memberships`;
      console.log(`[acceptInvitation action] Adding user ${result.clerkUserId} to Clerk org ${result.clerkOrgId}`);
      
      const clerkRole = result.role === "admin" || result.role === "super_admin" ? "org:admin" : "org:member";
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: result.clerkUserId,
            role: clerkRole,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[acceptInvitation action] Clerk add member error:`, errText);
        } else {
          console.log(`[acceptInvitation action] Successfully added user to Clerk organization`);
        }
      } catch (err) {
        console.error(`[acceptInvitation action] Failed to add user to Clerk org via fetch:`, err);
      }
    }

    return {
      workspaceId: result.workspaceId,
      clerkOrgId: result.clerkOrgId,
    };
  },
});

