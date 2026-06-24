import { v } from "convex/values";
import { query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { resolveUserReadOnly } from "./lib/getCurrentUser";

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const listInvitations = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || !workspaceId) {
      return [];
    }

    const invitations = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const now = Date.now();
    return invitations.map((inv) => {
      let status = inv.status;
      if (status === "pending" && inv.expiresAt < now) {
        status = "expired";
      }
      return { ...inv, status };
    });
  },
});

export const diagnoseInvitation = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const invitations = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    return invitations.map((inv) => ({
      _id: inv._id,
      status: inv.status,
      workspaceId: inv.workspaceId,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      isExpired: inv.expiresAt < Date.now(),
    }));
  },
});

export const getInvitationMetrics = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || !workspaceId) {
      return { activeEmployees: 0, pendingInvites: 0, expiredInvites: 0 };
    }

    const [members, invitations] = await Promise.all([
      ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
        .collect(),
      ctx.db
        .query("workspaceInvitations")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
        .collect(),
    ]);

    const activeEmployees = members.filter((m) => m.status === "active").length;
    const now = Date.now();

    let pendingInvites = 0;
    let expiredInvites = 0;

    for (const inv of invitations) {
      if (inv.status === "pending") {
        inv.expiresAt < now ? expiredInvites++ : pendingInvites++;
      } else if (inv.status === "expired") {
        expiredInvites++;
      }
    }

    return { activeEmployees, pendingInvites, expiredInvites };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────
export const prepareRetryRecord = internalMutation({
  args: {
    id: v.id("workspaceInvitations"),
    callerUserId: v.id("users"),
    callerWorkspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.id);
    if (!invitation) throw new Error("Invitation not found");

    if (invitation.workspaceId !== args.callerWorkspaceId) {
      throw new Error("Unauthorized: Cannot retry invitation for another workspace");
    }

    const now = Date.now();
    const isExpired = invitation.status === "pending" && invitation.expiresAt < now;
    const retryable = invitation.status === "expired" || isExpired;
    
    // We allow retrying any pending or expired for simplicity
    if (!retryable && invitation.status !== "pending") {
      throw new Error(
        `Cannot retry a '${invitation.status}' invitation. Only pending or expired invitations can be retried.`
      );
    }

    const updatedToken =
      invitation.inviteToken && invitation.inviteToken.length > 10
        ? invitation.inviteToken
        : crypto.randomUUID();

    await ctx.db.patch(args.id, {
      status: "pending",
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // fresh 7-day window
      inviteToken: updatedToken,
    });

    const workspace = await ctx.db.get(invitation.workspaceId);
    const workspaceName = workspace?.name ?? "CRM Pro";

    return {
      email: invitation.email,
      role: invitation.role,
      department: invitation.department,
      workspaceName,
      token: updatedToken,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ACTION
// ─────────────────────────────────────────────────────────────────────────────
export const retryInvitationAction = action({
  args: {
    id: v.id("workspaceInvitations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated. Please sign in first.");

    const callerUser: any = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!callerUser) throw new Error("User record not found.");
    
    const membership: any = await ctx.runQuery(api.workspaceMembers.getActiveMembership, {});
    
    if (!membership || (membership.role !== "SUPER_ADMIN" && membership.role !== "ADMIN")) {
      throw new Error("Unauthorized: Only Admins can retry invitations.");
    }
    
    const workspaceId = callerUser.activeWorkspaceId;
    if (!workspaceId) {
      throw new Error("Unauthorized: You must belong to a workspace.");
    }

    const retryData = await ctx.runMutation(internal.workspaceInvitations.prepareRetryRecord, {
      id: args.id,
      callerUserId: callerUser._id,
      callerWorkspaceId: workspaceId,
    });

    const { email, role, department, workspaceName, token } = retryData;

    try {
      await ctx.runAction(api.email.sendInvitationEmail, {
        email,
        name: "User", // Legacy compatibility
        role,
        department,
        managerName: "Admin", // Legacy compatibility
        companyName: workspaceName,
        token,
      });

      // We removed email tracking fields, so we just assume pending status holds.
      return args.id;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[retryInvitationAction] ❌ Email failed:", errorMsg);
      throw new Error(errorMsg);
    }
  },
});
