import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import type { Id } from "./_generated/dataModel";
import type { PlanId, BillingCycle, SubscriptionStatus } from "../src/types";

const PLAN_CONFIGS: Record<PlanId, { maxUsers: number; maxWorkspaces: number }> = {
  basic: { maxUsers: 999999, maxWorkspaces: 1 },
  professional: { maxUsers: 999999, maxWorkspaces: 3 },
  enterprise: { maxUsers: 999999, maxWorkspaces: 999999 },
};

function getPlanLimits(plan: PlanId) {
  return PLAN_CONFIGS[plan] ?? PLAN_CONFIGS.basic;
}

export const getWorkspaceSubscription = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || !workspaceId) return null;

    const workspace = await ctx.db.get(workspaceId as Id<"workspaces">);
    if (!workspace) return null;

    const plan = (workspace.plan as PlanId) || "basic";
    const limits = getPlanLimits(plan);

    const activeMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId as Id<"workspaces">))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      plan,
      billingCycle: (workspace.billingCycle as BillingCycle) || "monthly",
      status: (workspace.subscriptionStatus as SubscriptionStatus) || "active",
      maxUsers: workspace.maxUsers ?? limits.maxUsers,
      maxWorkspaces: workspace.maxWorkspaces ?? limits.maxWorkspaces,
      currentUsers: activeMembers.length,
      assignedAt: workspace.createdAt,
      updatedAt: workspace.subscriptionUpdatedAt ?? workspace.updatedAt ?? workspace.createdAt,
      futureBillingProvider: workspace.futureBillingProvider,
      futureSubscriptionId: workspace.futureSubscriptionId,
    };
  },
});

export const assignPlanToWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    plan: v.string(),
    billingCycle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Unauthorized");

    const currentUser = await resolveUser(ctx);
    if (!currentUser) throw new Error("User not found");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", currentUser._id).eq("workspaceId", args.workspaceId)
      )
      .first();

    if (!membership || membership.role !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can assign a plan");
    }

    const plan = args.plan as PlanId;
    const limits = getPlanLimits(plan);
    const billingCycle = (args.billingCycle as BillingCycle) || "monthly";

    await ctx.db.patch(args.workspaceId, {
      plan,
      billingCycle,
      subscriptionStatus: "active",
      maxUsers: limits.maxUsers,
      maxWorkspaces: limits.maxWorkspaces,
      subscriptionUpdatedAt: Date.now(),
    });

    return { plan, billingCycle, maxUsers: limits.maxUsers, maxWorkspaces: limits.maxWorkspaces };
  },
});

export const upgradePlan = mutation({
  args: {
    targetPlan: v.string(),
    billingCycle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || !workspaceId) throw new Error("Unauthorized");

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", currentUser._id).eq("workspaceId", workspaceId as Id<"workspaces">)
      )
      .first();

    if (!membership || membership.role !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can upgrade the plan");
    }

    const targetPlan = args.targetPlan as PlanId;
    const limits = getPlanLimits(targetPlan);
    const billingCycle = (args.billingCycle as BillingCycle) || "monthly";

    await ctx.db.patch(workspaceId as Id<"workspaces">, {
      plan: targetPlan,
      billingCycle,
      subscriptionStatus: "active",
      maxUsers: limits.maxUsers,
      maxWorkspaces: limits.maxWorkspaces,
      subscriptionUpdatedAt: Date.now(),
    });

    return { plan: targetPlan, billingCycle, maxUsers: limits.maxUsers, maxWorkspaces: limits.maxWorkspaces };
  },
});

export const downgradePlan = mutation({
  args: {
    targetPlan: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || !workspaceId) throw new Error("Unauthorized");

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", currentUser._id).eq("workspaceId", workspaceId as Id<"workspaces">)
      )
      .first();

    if (!membership || membership.role !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can downgrade the plan");
    }

    const targetPlan = args.targetPlan as PlanId;
    const limits = getPlanLimits(targetPlan);

    const activeMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId as Id<"workspaces">))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (activeMembers.length > limits.maxUsers) {
      throw new Error(
        `Cannot downgrade: workspace has ${activeMembers.length} active members, but the ${targetPlan} plan allows up to ${limits.maxUsers}. Please remove some members first.`
      );
    }

    await ctx.db.patch(workspaceId as Id<"workspaces">, {
      plan: targetPlan,
      billingCycle: "monthly",
      subscriptionStatus: "active",
      maxUsers: limits.maxUsers,
      maxWorkspaces: limits.maxWorkspaces,
      subscriptionUpdatedAt: Date.now(),
    });

    return { plan: targetPlan, billingCycle: "monthly", maxUsers: limits.maxUsers, maxWorkspaces: limits.maxWorkspaces };
  },
});

export const checkUserLimit = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const plan = (workspace.plan as PlanId) || "basic";
    const limits = getPlanLimits(plan);
    const maxUsers = workspace.maxUsers ?? limits.maxUsers;

    const activeMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const currentCount = activeMembers.length;
    const atLimit = currentCount >= maxUsers;
    const remaining = Math.max(0, maxUsers - currentCount);

    return {
      atLimit,
      currentCount,
      maxUsers,
      remaining,
      plan,
    };
  },
});

export const getUserLimitStatus = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser?.activeWorkspaceId;
    if (!currentUser || !workspaceId) return null;

    const workspace = await ctx.db.get(workspaceId as Id<"workspaces">);
    if (!workspace) return null;

    const plan = (workspace.plan as PlanId) || "basic";
    const limits = getPlanLimits(plan);
    const maxUsers = workspace.maxUsers ?? limits.maxUsers;

    const activeMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId as Id<"workspaces">))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const currentCount = activeMembers.length;

    return {
      atLimit: currentCount >= maxUsers,
      currentCount,
      maxUsers,
      remaining: Math.max(0, maxUsers - currentCount),
      plan,
    };
  },
});

export const getWorkspaceLimitStatus = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser) return null;

    const workspaceId = currentUser.activeWorkspaceId;
    if (!workspaceId) {
      return {
        atLimit: false,
        currentCount: 0,
        maxWorkspaces: 1,
        remaining: 1,
        plan: "basic",
      };
    }

    const workspace = await ctx.db.get(workspaceId as Id<"workspaces">);
    if (!workspace) return null;

    const plan = (workspace.plan as PlanId) || "basic";
    const limits = getPlanLimits(plan);
    const maxWorkspaces = workspace.maxWorkspaces ?? limits.maxWorkspaces;

    const userMemberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const currentCount = userMemberships.length;

    return {
      atLimit: currentCount >= maxWorkspaces,
      currentCount,
      maxWorkspaces,
      remaining: Math.max(0, maxWorkspaces - currentCount),
      plan,
    };
  },
});
