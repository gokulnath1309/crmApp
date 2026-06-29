import { type QueryCtx, type MutationCtx } from "../_generated/server";
import { auth } from "../auth";
import { hasPermission as rbacHasPermission } from "../rbac";

const PREFIX = "[resolveUser]";

async function lookupUser(
  ctx: QueryCtx | MutationCtx,
  clerkId: string,
  email: string | null | undefined,
) {
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
  if (user) return user;

  if (!email) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const usersByEmail = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .collect();

  if (usersByEmail.length === 0) return null;

  if (usersByEmail.length === 1) return usersByEmail[0];

  console.warn(PREFIX, `Multiple users (${usersByEmail.length}) found for email:`, normalizedEmail);
  const withClerkId = usersByEmail.find((u) => u.clerkId === clerkId);
  if (withClerkId) return withClerkId;
  const withPassword = usersByEmail.find((u) => u.passwordHash);
  if (withPassword) return withPassword;
  const withGoogleAuth = usersByEmail.find((u) => u.authProvider === "google");
  if (withGoogleAuth) return withGoogleAuth;
  return usersByEmail[0];
}

async function resolveActiveMembership(ctx: QueryCtx | MutationCtx, user: any) {
  const workspaceId = user.activeWorkspaceId || user.workspaceId;
  if (!workspaceId) return null;

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user_workspace", (q) =>
      q.eq("userId", user._id).eq("workspaceId", workspaceId)
    )
    .first();

  return membership;
}

async function attachMembership(user: any, membership: any) {
  if (!user) return user;

  return {
    ...user,
    activeWorkspaceId: user.activeWorkspaceId || user.workspaceId,
    role: membership?.role?.toLowerCase() || user.role || "employee",
    department: membership?.department || user.department,
    jobTitle: membership?.jobTitle || user.jobTitle,
    managerId: membership?.managerId || user.managerId,
    permissions: membership?.permissions || user.permissions || [],
    isActive: membership ? membership.status === "active" : (user.isActive ?? true),
    isOwner: membership?.role === "SUPER_ADMIN" || user.isOwner === true,
    membershipId: membership?._id,
  };
}

export async function resolveUser(ctx: MutationCtx): Promise<any> {
  const t = Date.now();
  console.log(PREFIX, `t=${t} Started (mutation)`);

  const identity = await ctx.auth.getUserIdentity();
  console.log(PREFIX, `t=${t} Identity:`, {
    exists: !!identity,
    subject: identity?.subject,
    email: identity?.email,
  });

  if (identity?.subject) {
    let user = await lookupUser(ctx, identity.subject, identity.email);
    const email = identity.email?.trim().toLowerCase();
    const isSuperAdminEmail = email === "gokulnath13092001@gmail.com";

    if (user) {
      if (!user.clerkId || isSuperAdminEmail) {
        console.log(PREFIX, "Found by email, linking clerkId & bootstrapping super_admin:", user._id);
        const patch: any = {
          updatedAt: Date.now(),
        };
        if (!user.clerkId) patch.clerkId = identity.subject;
        if (isSuperAdminEmail) {
          patch.activeWorkspaceId = user.activeWorkspaceId || (user as any).workspaceId;
        }
        await ctx.db.patch(user._id, patch);
        const updated = await ctx.db.get(user._id);
        if (updated) user = updated;
      }

      const membership = await resolveActiveMembership(ctx, user);
      console.log(PREFIX, "User resolved:", user._id, "membership:", membership?._id);
      return attachMembership(user, membership);
    }

    console.log(PREFIX, "No Convex user — auto-creating from Clerk identity");
    const now = Date.now();
    const newId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: email,
      name: identity.name || identity.givenName || identity.nickname || "User",
      isActive: true,
      avatarUrl: identity.pictureUrl,
      emailVerified: true,
      lastLogin: now,
      createdAt: now,
      updatedAt: now,
    });
    console.log(PREFIX, "Auto-created user:", newId);
    const newUser = await ctx.db.get(newId);
    return attachMembership(newUser, null);
  }

  const convexUserId = await auth.getUserId(ctx);
  if (convexUserId) {
    const user = await ctx.db.get(convexUserId);
    if (user) {
      console.log(PREFIX, "Found by convexAuth:", user._id);
      const membership = await resolveActiveMembership(ctx, user);
      return attachMembership(user, membership);
    }
  }

  console.warn(PREFIX, "Not authenticated");
  return null;
}

export async function resolveUserReadOnly(ctx: QueryCtx): Promise<any> {
  const t = Date.now();
  console.log(PREFIX, `t=${t} Started (query)`);

  const identity = await ctx.auth.getUserIdentity();
  console.log(PREFIX, `t=${t} Identity:`, {
    exists: !!identity,
    subject: identity?.subject,
    email: identity?.email,
  });

  if (identity?.subject) {
    const user = await lookupUser(ctx, identity.subject, identity.email);
    if (user) {
      console.log(PREFIX, `t=${t} User resolved (read-only):`, user._id);
      const membership = await resolveActiveMembership(ctx, user);
      return attachMembership(user, membership);
    }
    console.log(PREFIX, `t=${t} No Convex user found (read-only)`);
    return null;
  }

  const convexUserId = await auth.getUserId(ctx);
  if (convexUserId) {
    const user = await ctx.db.get(convexUserId);
    if (user) {
      console.log(PREFIX, `t=${t} Found by convexAuth:`, user._id);
      const membership = await resolveActiveMembership(ctx, user);
      return attachMembership(user, membership);
    }
  }

  console.warn(PREFIX, `t=${t} Not authenticated`);
  return null;
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<any> {
  const user = await resolveUserReadOnly(ctx);
  return user;
}

export async function isSuperAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return user?.role === "super_admin" && user?.isActive !== false;
}

export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return (user?.role === "super_admin" || user?.role === "admin") && user?.isActive !== false;
}

export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  permission: string
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return rbacHasPermission(user, permission);
}
