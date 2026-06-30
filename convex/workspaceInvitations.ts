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
export const getInvitationForResend = query({
  args: {
    id: v.id("workspaceInvitations"),
    callerWorkspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.id);
    if (!invitation) {
      return { error: "Invitation not found" };
    }

    if (invitation.workspaceId !== args.callerWorkspaceId) {
      return { error: "Unauthorized: Invitation belongs to another workspace" };
    }

    const now = Date.now();
    const isExpired = invitation.expiresAt < now || invitation.status === "expired" || invitation.status === "revoked";
    const isAccepted = invitation.status === "accepted";

    if (isAccepted) {
      return { error: "Accepted invitation - resend blocked" };
    }
    if (isExpired) {
      return { error: "Expired invitation - resend blocked" };
    }

    const workspace = await ctx.db.get(invitation.workspaceId);
    const workspaceName = workspace?.name ?? "CRM Pro";

    return {
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      department: invitation.department,
      workspaceName,
    };
  },
});

export const updateResendSuccess = internalMutation({
  args: {
    id: v.id("workspaceInvitations"),
    token: v.string(),
    messageId: v.string(),
    smtpResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "pending",
      inviteToken: args.token,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days fresh window
      resentAt: now,
      messageId: args.messageId,
      smtpResponse: args.smtpResponse,
      lastDeliveryStatus: "sent",
      lastDeliveryError: undefined,
    });
  },
});

export const updateResendFailure = internalMutation({
  args: {
    id: v.id("workspaceInvitations"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastDeliveryStatus: "failed",
      lastDeliveryError: args.error,
    });
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
    console.log("[Resend Invite] Resend requested", { invitationId: args.id });

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

    // 1. Get and validate invitation
    const invitationData = await ctx.runQuery(api.workspaceInvitations.getInvitationForResend, {
      id: args.id,
      callerWorkspaceId: workspaceId,
    });

    if (invitationData.error) {
      if (invitationData.error === "Invitation not found") {
        console.error("[Resend Invite] Invitation not found", { invitationId: args.id });
        throw new Error("Invitation not found");
      }
      if (invitationData.error.includes("Accepted")) {
        console.error("[Resend Invite] Accepted invitation - resend blocked", { invitationId: args.id });
        throw new Error("Invitation has already been accepted. Resend is blocked.");
      }
      if (invitationData.error.includes("Expired")) {
        console.error("[Resend Invite] Expired invitation - resend blocked", { invitationId: args.id });
        throw new Error("Invitation has expired. Resend is blocked.");
      }
      console.error("[Resend Invite] Validation failed:", invitationData.error);
      throw new Error(invitationData.error);
    }

    console.log("[Resend Invite] Invitation found", { email: invitationData.email });

    const invitationInfo = invitationData as { email: string; name?: string; role: string; department?: string; workspaceName: string; };

    // 2. Generate fresh token
    const newInviteToken = crypto.randomUUID();
    console.log("[Resend Invite] Generating invitation link", { token: newInviteToken });

    // 3. Send email via Nodemailer
    console.log("[Resend Invite] Sending email", { to: invitationData.email });
    try {
      const emailResult = await ctx.runAction(api.email.sendInvitationEmail, {
        email: invitationInfo.email,
        name: invitationInfo.name || invitationInfo.email.split('@')[0] || "User",
        role: invitationInfo.role,
        department: invitationInfo.department,
        managerName: "Admin",
        companyName: invitationInfo.workspaceName,
        token: newInviteToken,
      });

      console.log("[Resend Invite] Message ID:", emailResult.messageId);
      console.log("[Resend Invite] SMTP response:", emailResult.smtpResponse);

      // 4. Update database on success
      await ctx.runMutation(internal.workspaceInvitations.updateResendSuccess, {
        id: args.id,
        token: newInviteToken,
        messageId: emailResult.messageId,
        smtpResponse: emailResult.smtpResponse,
      });

      console.log("[Resend Invite] Resend successful", { invitationId: args.id });
      return args.id;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[Resend Invite] sendMail failed", { error: errorMsg });

      if (errorMsg.includes("rejected") || errorMsg.includes("envelope")) {
        console.error("[Resend Invite] Email rejected", { error: errorMsg });
      } else {
        console.error("[Resend Invite] SMTP failed", { error: errorMsg });
      }

      // Update database with failure details
      await ctx.runMutation(internal.workspaceInvitations.updateResendFailure, {
        id: args.id,
        error: errorMsg,
      });

      throw new Error("Failed to resend invitation email.");
    }
  },
});
