import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tasks = args.status
      ? await ctx.db
          .query("tasks")
          .withIndex("by_status", (idx) => idx.eq("status", args.status as string))
          .collect()
      : await ctx.db.query("tasks").collect();
    return tasks.sort((a, b) => a.dueDate - b.dueDate);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    dueDate: v.number(),
    status: v.string(),
    priority: v.string(),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.string(),
    dueDate: v.number(),
    status: v.string(),
    priority: v.string(),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const currentUser = userId ? await ctx.db.get(userId) : null;
    const userName = currentUser?.name || "System";

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Task not found");

    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });

    if (args.status === "Completed" && existing.status !== "Completed") {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "task_completed",
        description: `completed task "${args.title}"`,
        userId: userId ?? undefined,
        userName,
        entityType: "task",
        entityId: id,
      });
    }

    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    await ctx.db.delete(args.id);
    return args.id;
  },
});
