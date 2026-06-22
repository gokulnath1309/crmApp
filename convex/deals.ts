import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("deals")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    value: v.number(),
    status: v.string(),
    stage: v.string(),
    company: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const currentUser = userId ? await ctx.db.get(userId) : null;
    const userName = currentUser?.name || "System";

    const now = Date.now();
    const dealId = await ctx.db.insert("deals", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "deal_created",
      description: `created a new deal "${args.title}" ($${args.value.toLocaleString()})`,
      userId: userId ?? undefined,
      userName,
      entityType: "deal",
      entityId: dealId,
    });

    return dealId;
  },
});

export const update = mutation({
  args: {
    id: v.id("deals"),
    title: v.string(),
    value: v.number(),
    status: v.string(),
    stage: v.string(),
    company: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const currentUser = userId ? await ctx.db.get(userId) : null;
    const userName = currentUser?.name || "System";

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Deal not found");

    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });

    // Log won activity if transitioned to Won
    if (args.status === "Won" && existing.status !== "Won") {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "deal_won",
        description: `won the deal "${args.title}" ($${args.value.toLocaleString()})`,
        userId: userId ?? undefined,
        userName,
        entityType: "deal",
        entityId: id,
      });
    }

    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");

    await ctx.db.delete(args.id);
    return args.id;
  },
});
