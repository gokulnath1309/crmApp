import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createTestEnv = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const testUserId = await ctx.db.insert("users", {
      email: "test-admin@example.com",
      name: "Test Admin",
      role: "super_admin",
      createdAt: now,
      updatedAt: now,
    });
    
    const testWorkspaceId = await ctx.db.insert("workspaces", {
      name: "Test Workspace",
      createdBy: testUserId,
      createdAt: now,
      status: "active",
    });

    await ctx.db.patch(testUserId, {
      activeWorkspaceId: testWorkspaceId,
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId: testWorkspaceId,
      clerkUserId: "mock-clerk-id-admin",
      userId: testUserId,
      role: "SUPER_ADMIN",
      department: "Management",
      status: "active",
      joinedAt: now,
    });

    return { testUserId, testWorkspaceId };
  },
});

export const cleanupTestEnv = internalMutation({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }

    const invitations = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    for (const i of invitations) {
      await ctx.db.delete(i._id);
    }

    await ctx.db.delete(args.userId);
    await ctx.db.delete(args.workspaceId);
  },
});

export const setInviteExpired = internalMutation({
  args: { id: v.id("workspaceInvitations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "expired",
      expiresAt: Date.now() - 1000,
    });
  },
});

export const setInviteAccepted = internalMutation({
  args: { id: v.id("workspaceInvitations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "accepted",
    });
  },
});
