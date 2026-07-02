import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { hasPermission } from "./rbac";
import type { Id, Doc } from "./_generated/dataModel";

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser?.activeWorkspaceId || currentUser?.workspaceId;
    if (!currentUser || !workspaceId) return null;
    const workspace = await ctx.db.get(workspaceId as Id<"workspaces">) as Doc<"workspaces"> | null;
    if (!workspace) return null;
    return {
      name: workspace.name,
      currency: "INR",
      monthlySalesTarget: workspace.monthlySalesTarget ?? 0,
    };
  },
});

export const setMonthlyTarget = mutation({
  args: {
    target: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    const workspaceId = currentUser?.activeWorkspaceId || currentUser?.workspaceId;
    if (!currentUser || !workspaceId) throw new Error("No workspace");
    if (!hasPermission(currentUser, "canManageWorkspace")) throw new Error("Unauthorized");
    await ctx.db.patch(workspaceId, { monthlySalesTarget: args.target });
    return args.target;
  },
});
