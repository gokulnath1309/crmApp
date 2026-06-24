import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { type Id } from "./_generated/dataModel";

export const hasMemberships = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return false;

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return membership !== null;
  },
});

export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const workspaces = await Promise.all(
      memberships.map(async (m) => {
        const workspace = await ctx.db.get(m.workspaceId);
        return {
          membershipId: m._id,
          workspaceId: m.workspaceId,
          workspaceName: workspace?.name ?? "Unknown",
          role: m.role,
          isActive: user.activeWorkspaceId === m.workspaceId,
        };
      })
    );

    return workspaces;
  },
});

export const getActiveMembership = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser) return null;

    const workspaceId = currentUser.activeWorkspaceId;
    if (!workspaceId) return null;

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", currentUser._id).eq("workspaceId", workspaceId)
      )
      .first();

    return membership;
  },
});

export const switchWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", currentUser._id).eq("workspaceId", args.workspaceId)
      )
      .first();

    if (!membership || membership.status !== "active") {
      throw new Error("You are not a member of this workspace");
    }

    await ctx.db.patch(currentUser._id, { activeWorkspaceId: args.workspaceId });

    return args.workspaceId;
  },
});
