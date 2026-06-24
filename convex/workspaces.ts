import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { type Id, type Doc } from "./_generated/dataModel";

export const getMyWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || !workspaceId) {
      return null;
    }
    return (await ctx.db.get(workspaceId as Id<"workspaces">)) as Doc<"workspaces"> | null;
  },
});

export const createWorkspace = mutation({
  args: {
    name: v.string(),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.subject) {
      throw new Error("Unauthorized: Clerk identity not found");
    }

    const currentUser = await resolveUser(ctx);
    if (!currentUser) {
      throw new Error("Unauthorized: User not found in database");
    }

    const userId = currentUser._id;
    const now = Date.now();
    
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name.trim(),
      industry: args.industry?.trim(),
      companySize: args.employeeCount,
      createdBy: userId,
      status: "active",
      createdAt: now,
    });

    // Create membership for this user
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      clerkUserId: identity.subject,
      userId,
      role: "SUPER_ADMIN",
      department: "Management",
      status: "active",
      joinedAt: now,
    });

    // Set as active workspace
    await ctx.db.patch(userId, {
      activeWorkspaceId: workspaceId,
    });

    // Log activity
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "workspace_created",
      description: `created workspace "${args.name.trim()}"`,
      userId,
      userName: currentUser.name || "Founder",
      entityType: "workspace",
      entityId: workspaceId,
      workspaceId,
    });

    return workspaceId;
  },
});

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || currentUser.isActive === false || !workspaceId) {
      return [];
    }

    const myWorkspace = await ctx.db.get(workspaceId as Id<"workspaces">);
    if (!myWorkspace) {
      return [];
    }

    let workspaces = [myWorkspace];

    if (args.search) {
      const q = args.search.toLowerCase().trim();
      workspaces = workspaces.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          (w.industry && w.industry.toLowerCase().includes(q))
      );
    }

    if (args.status && args.status !== "all") {
      workspaces = workspaces.filter((w) => w.status === args.status);
    }

    return workspaces as Doc<"workspaces">[];
  },
});

export const getById = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || currentUser.isActive === false || !workspaceId) {
      return null;
    }

    if (args.id !== workspaceId) {
      return null; // Can only get your own active workspace directly this way, unless checking all memberships
    }

    return (await ctx.db.get(args.id)) as Doc<"workspaces"> | null;
  },
});

export const update = mutation({
  args: {
    id: v.id("workspaces"),
    name: v.string(),
    industry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || currentUser.isActive === false || !workspaceId) {
      throw new Error("Unauthorized");
    }

    if (args.id !== workspaceId) {
      throw new Error("Unauthorized: Cannot update other workspaces");
    }

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) => q.eq("userId", currentUser._id).eq("workspaceId", args.id))
      .first();

    if (!membership || membership.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: Only SUPER_ADMIN can update workspace");
    }

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Workspace not found");

    await ctx.db.patch(id, {
      ...fields,
      name: args.name.trim(),
    });

    const userName = currentUser.name || "System";
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "workspace_updated",
      description: `updated workspace "${args.name.trim()}"`,
      userId: currentUser._id,
      userName,
      entityType: "workspace",
      entityId: id,
      workspaceId: id,
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || currentUser.isActive === false || !workspaceId) {
      throw new Error("Unauthorized");
    }

    if (args.id !== workspaceId) {
      throw new Error("Unauthorized: Cannot delete other workspaces");
    }

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) => q.eq("userId", currentUser._id).eq("workspaceId", args.id))
      .first();

    if (!membership || membership.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: Only SUPER_ADMIN can delete workspace");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Workspace not found");

    await ctx.db.delete(args.id);

    const userName = currentUser.name || "System";
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "workspace_deleted",
      description: `deleted workspace "${existing.name}"`,
      userId: currentUser._id,
      userName,
      entityType: "workspace",
      entityId: args.id,
      workspaceId: args.id,
    });

    return args.id;
  },
});
