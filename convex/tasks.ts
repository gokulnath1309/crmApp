import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { canAccessTask, canAssignTask, hasPermission } from "./rbac";
import { notifyUser, notifyAdmins } from "./lib/notifications";

export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const userId = currentUser?._id;
    if (!currentUser || currentUser.isActive === false) {
      return [];
    }

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      return [];
    }

    const taskQuery = args.status
      ? ctx.db.query("tasks").withIndex("by_workspaceId", (idx) => idx.eq("workspaceId", workspaceId)).filter((q) => q.eq(q.field("status"), args.status))
      : ctx.db.query("tasks").withIndex("by_workspaceId", (idx) => idx.eq("workspaceId", workspaceId));
    let tasks = await taskQuery.collect();

    // Scope tasks by permission
    const permissions = {
      canViewAllData: hasPermission(currentUser, "canViewAllData"),
      canViewAssignedTasks: hasPermission(currentUser, "canViewAssignedTasks"),
    };

    if (!permissions.canViewAllData) {
      if (permissions.canViewAssignedTasks) {
        tasks = tasks.filter((t) => t.assignedTo === userId || t.createdBy === userId);
      } else {
        return [];
      }
    }

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
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userName = currentUser.name || "System";
    const currentUserId = currentUser._id;
    const userId = currentUser._id;

    const allowed = await canAssignTask(ctx, currentUserId, args.assignedTo);
    if (!allowed) {
      throw new Error("Unauthorized: You do not have permission to assign tasks to this user");
    }

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      ...args,
      createdBy: currentUserId,
      workspaceId: (currentUser.activeWorkspaceId || currentUser.workspaceId),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "task_created",
      description: `created task "${args.title}"`,
      userId: currentUserId,
      userName,
      entityType: "task",
      entityId: taskId,
    });

    if (args.assignedTo) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "task_assigned",
        description: `assigned task "${args.title}" to ${args.assignedTo === currentUserId ? "themselves" : "user"}`,
        userId: userId ?? undefined,
        userName,
        entityType: "task",
        entityId: taskId,
      });

      if (args.assignedTo !== currentUserId) {
        await notifyUser(ctx, args.assignedTo, "task_assigned", {
          entityName: args.title,
          entityType: "task",
          entityId: taskId,
          createdBy: currentUserId,
        });
      }
    }

    return taskId;
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
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Task not found");

    const isAccessible = await canAccessTask(ctx, userId, existing);
    if (!isAccessible) {
      throw new Error("Unauthorized: You do not have permission to modify this task");
    }

    if (args.assignedTo !== existing.assignedTo) {
      const allowed = await canAssignTask(ctx, userId!, args.assignedTo);
      if (!allowed) {
        throw new Error("Unauthorized: You do not have permission to reassign this task");
      }
    }

    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });

    if (args.status !== existing.status) {
      const activityType =
        args.status === "Completed" ? "task_completed" :
        args.status === "In Progress" ? "task_started" :
        args.status === "Blocked" ? "task_blocked" :
        "task_status_changed";
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: activityType,
        description: `changed task "${args.title}" to ${args.status}`,
        userId: userId ?? undefined,
        userName,
        entityType: "task",
        entityId: id,
      });

      if (args.status === "Completed") {
        const completedAssignee = args.assignedTo || existing.assignedTo;
        if (completedAssignee && completedAssignee !== (userId as any)) {
          await notifyUser(ctx, completedAssignee, "task_completed", {
            entityName: args.title,
            entityType: "task",
            entityId: id,
            createdBy: userId ?? undefined,
          });
        }
        await notifyAdmins(ctx, undefined, "task_completed", {
          entityName: args.title,
          entityType: "task",
          entityId: id,
          createdBy: userId ?? undefined,
        });
      }
    }

    if (args.assignedTo !== existing.assignedTo) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "task_assigned",
        description: `reassigned task "${args.title}" to user`,
        userId: userId ?? undefined,
        userName,
        entityType: "task",
        entityId: id,
      });

      if (args.assignedTo && args.assignedTo !== (userId as any)) {
        await notifyUser(ctx, args.assignedTo, "task_assigned", {
          entityName: args.title,
          entityType: "task",
          entityId: id,
          createdBy: userId ?? undefined,
        });
      }
    }

    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    if (existing.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: You do not have permission to delete this task");
    }

    if (currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Admins can delete tasks");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
