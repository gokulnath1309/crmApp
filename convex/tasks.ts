import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { canAccessTask, canAssignTask, hasPermission } from "./rbac";
import { notifyUser, notifyAdmins } from "./lib/notifications";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logHistory(
  ctx: any,
  taskId: Id<"tasks">,
  action: string,
  userId: Id<"users">,
  userName: string | undefined,
  workspaceId: Id<"workspaces"> | undefined,
  extra?: { field?: string; oldValue?: string; newValue?: string }
) {
  await ctx.db.insert("taskHistory", {
    taskId,
    action,
    field: extra?.field,
    oldValue: extra?.oldValue,
    newValue: extra?.newValue,
    userId,
    userName,
    timestamp: Date.now(),
    workspaceId,
  });
}

async function logActivity(
  ctx: any,
  type: string,
  description: string,
  userId: Id<"users"> | undefined,
  userName: string | undefined,
  entityId: string,
  workspaceId: Id<"workspaces"> | undefined
) {
  await ctx.scheduler.runAfter(0, internal.activities.log, {
    type,
    description,
    userId,
    userName,
    entityType: "task",
    entityId,
    workspaceId,
  });
}

// ─── Date Presets ─────────────────────────────────────────────────────────────

function getDateRange(preset: string | undefined, customStart?: number, customEnd?: number): { start: number; end: number } | null {
  if (customStart !== undefined && customEnd !== undefined) return { start: customStart, end: customEnd };
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
  const startOfMonth = (y: number, m: number) => new Date(y, m, 1).getTime();
  const endOfMonth = (y: number, m: number) => new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();

  switch (preset) {
    case "today": {
      const today = new Date(y, m, d);
      return { start: startOfDay(today), end: endOfDay(today) };
    }
    case "tomorrow": {
      const tomorrow = new Date(y, m, d + 1);
      return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
    }
    case "yesterday": {
      const yesterday = new Date(y, m, d - 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case "this_week": {
      const dayOfWeek = now.getDay();
      const start = new Date(y, m, d - dayOfWeek);
      const end = new Date(y, m, d + (6 - dayOfWeek));
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "next_week": {
      const dayOfWeek2 = now.getDay();
      const start = new Date(y, m, d + (7 - dayOfWeek2));
      const end = new Date(y, m, d + (13 - dayOfWeek2));
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "this_month":
      return { start: startOfMonth(y, m), end: endOfMonth(y, m) };
    case "last_month":
      return { start: startOfMonth(y, m - 1), end: endOfMonth(y, m - 1) };
    case "this_quarter": {
      const q = Math.floor(m / 3);
      return { start: startOfMonth(y, q * 3), end: endOfMonth(y, q * 3 + 2) };
    }
    case "this_year":
      return { start: new Date(y, 0, 1).getTime(), end: new Date(y, 11, 31, 23, 59, 59, 999).getTime() };
    default:
      return null;
  }
}

// ─── LIST ─────────────────────────────────────────────────────────────────────

export const list = query({
  args: {
    // Status filter
    status: v.optional(v.string()),
    statuses: v.optional(v.array(v.string())),

    // Priority filter
    priority: v.optional(v.string()),
    priorities: v.optional(v.array(v.string())),

    // Employee filters
    assignedTo: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
    assignedBy: v.optional(v.id("users")),
    completedBy: v.optional(v.id("users")),
    updatedBy: v.optional(v.id("users")),

    // Entity filters
    leadId: v.optional(v.id("leads")),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    teamId: v.optional(v.id("teams")),
    departmentId: v.optional(v.string()),

    // Tags
    tags: v.optional(v.array(v.string())),

    // Search
    search: v.optional(v.string()),

    // Date filters
    dateField: v.optional(v.string()), // "dueDate" | "createdAt" | "completedAt" | "updatedAt"
    datePreset: v.optional(v.string()),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),

    // Special filters
    overdue: v.optional(v.boolean()),
    unassigned: v.optional(v.boolean()),
    viewCompleted: v.optional(v.boolean()), // true = show completed tasks
    includeDeleted: v.optional(v.boolean()),

    // Sorting
    sortBy: v.optional(v.string()), // "newest" | "oldest" | "priority" | "status" | "dueDate" | "updatedAt" | "employee" | "creator" | "alphabetical"
    sortOrder: v.optional(v.string()), // "asc" | "desc"

    // Pagination
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return { tasks: [], nextCursor: null, totalCount: 0 };

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return { tasks: [], nextCursor: null, totalCount: 0 };
    const userId = currentUser._id;
    const limit = args.limit ?? 50;

    // Build query with proper index selection
    let tasks: Doc<"tasks">[];

    if (args.leadId) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_leadId", (q) => q.eq("leadId", args.leadId))
        .collect();
    } else if (args.assignedTo) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_workspaceId_assignedTo", (q) =>
          q.eq("workspaceId", workspaceId).eq("assignedTo", args.assignedTo)
        )
        .collect();
    } else if (args.createdBy) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_workspaceId_createdBy", (q) =>
          q.eq("workspaceId", workspaceId).eq("createdBy", args.createdBy)
        )
        .collect();
    } else if (args.status) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_workspaceId_status", (q) =>
          q.eq("workspaceId", workspaceId).eq("status", args.status!)
        )
        .collect();
    } else if (args.statuses && args.statuses.length >= 1) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_workspaceId_deletedAt", (q) => q.eq("workspaceId", workspaceId))
        .collect();
      tasks = tasks.filter((t) => args.statuses!.includes(t.status));
    } else {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_workspaceId_deletedAt", (q) => q.eq("workspaceId", workspaceId))
        .collect();
    }

    // Filter by workspace (safety check)
    tasks = tasks.filter((t) => t.workspaceId === workspaceId);

    // Permission scoping
    const permAllData = hasPermission(currentUser, "canViewAllData");
    const permAssigned = hasPermission(currentUser, "canViewAssignedTasks");

    if (!permAllData) {
      if (permAssigned) {
        tasks = tasks.filter((t) => t.assignedTo === userId || t.createdBy === userId);
      } else {
        return { tasks: [], nextCursor: null, totalCount: 0 };
      }
    }

    // Deleted filter
    if (!args.includeDeleted) {
      tasks = tasks.filter((t) => !t.deletedAt);
    }

    // Status filters
    if (args.status) {
      tasks = tasks.filter((t) => t.status === args.status);
    }
    if (args.statuses && args.statuses.length > 0) {
      tasks = tasks.filter((t) => args.statuses!.includes(t.status));
    }

    // Show completed tasks only when explicitly requested
    if (!args.viewCompleted && !args.status && (!args.statuses || args.statuses.length === 0)) {
      tasks = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
    }

    // Priority filters
    if (args.priority) {
      tasks = tasks.filter((t) => t.priority === args.priority);
    }
    if (args.priorities && args.priorities.length > 0) {
      tasks = tasks.filter((t) => args.priorities!.includes(t.priority));
    }

    // Employee filters
    if (args.assignedBy) tasks = tasks.filter((t) => t.assignedBy === args.assignedBy);
    if (args.completedBy) tasks = tasks.filter((t) => t.completedBy === args.completedBy);
    if (args.updatedBy) tasks = tasks.filter((t) => t.updatedBy === args.updatedBy);

    // Entity filters
    if (args.companyId) tasks = tasks.filter((t) => t.companyId === args.companyId);
    if (args.contactId) tasks = tasks.filter((t) => t.contactId === args.contactId);
    if (args.dealId) tasks = tasks.filter((t) => t.dealId === args.dealId);
    if (args.teamId) tasks = tasks.filter((t) => t.teamId === args.teamId || t.assignedTeamId === args.teamId);
    if (args.departmentId) tasks = tasks.filter((t) => t.departmentId === args.departmentId);

    // Tags
    if (args.tags && args.tags.length > 0) {
      tasks = tasks.filter((t) => t.tags && args.tags!.some((tag) => t.tags!.includes(tag)));
    }

    // Search
    if (args.search) {
      const q = args.search.toLowerCase();
      tasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Special filters
    if (args.unassigned) {
      tasks = tasks.filter((t) => !t.assignedTo);
    }
    if (args.overdue) {
      const now = Date.now();
      tasks = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled" && t.dueDate < now);
    }

    // Date filters
    const dateField = args.dateField || "dueDate";
    if (args.datePreset || (args.dateStart !== undefined && args.dateEnd !== undefined)) {
      const range = getDateRange(args.datePreset, args.dateStart, args.dateEnd);
      if (range) {
        tasks = tasks.filter((t) => {
          const val = (t as any)[dateField];
          return val !== undefined && val >= range.start && val <= range.end;
        });
      }
    }

    // Sorting
    const sortOrder = args.sortOrder === "asc" ? 1 : -1;
    const sortBy = args.sortBy || "dueDate";
    tasks.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "newest": cmp = a.createdAt - b.createdAt; break;
        case "oldest": cmp = b.createdAt - a.createdAt; break;
        case "priority": {
          const pMap: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          cmp = (pMap[a.priority] || 0) - (pMap[b.priority] || 0);
          break;
        }
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "dueDate": cmp = a.dueDate - b.dueDate; break;
        case "updatedAt": cmp = a.updatedAt - b.updatedAt; break;
        case "employee": cmp = (a.assignedTo || "").localeCompare(b.assignedTo || ""); break;
        case "creator": cmp = (a.createdBy || "").localeCompare(b.createdBy || ""); break;
        case "alphabetical": cmp = a.title.localeCompare(b.title); break;
        default: cmp = a.dueDate - b.dueDate;
      }
      return cmp * sortOrder;
    });

    const totalCount = tasks.length;

    // Pagination with cursor
    let nextCursor: string | null = null;
    if (args.cursor) {
      const cursorIndex = tasks.findIndex((t) => t._id === args.cursor);
      if (cursorIndex >= 0) {
        tasks = tasks.slice(cursorIndex + 1);
      }
    }
    if (tasks.length > limit) {
      const lastItem = tasks[limit - 1];
      nextCursor = lastItem._id;
      tasks = tasks.slice(0, limit);
    }

    return { tasks, nextCursor, totalCount };
  },
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────

export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return null;

    const task = await ctx.db.get(args.id);
    if (!task) return null;
    if (task.workspaceId !== (currentUser.activeWorkspaceId || currentUser.workspaceId)) return null;

    const accessible = await canAccessTask(ctx, currentUser._id, task);
    if (!accessible) return null;

    return task;
  },
});

// ─── GET HISTORY ──────────────────────────────────────────────────────────────

export const getHistory = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];

    const task = await ctx.db.get(args.taskId);
    if (!task) return [];
    if (task.workspaceId !== (currentUser.activeWorkspaceId || currentUser.workspaceId)) return [];

    const history = await ctx.db
      .query("taskHistory")
      .withIndex("by_taskId_timestamp", (q) => q.eq("taskId", args.taskId))
      .collect();

    return history.sort((a, b) => b.timestamp - a.timestamp);
  },
});

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.number(),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    leadId: v.optional(v.id("leads")),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    teamId: v.optional(v.id("teams")),
    departmentId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const allowed = args.assignedTo
      ? await canAssignTask(ctx, userId, args.assignedTo)
      : true;
    if (!allowed) throw new Error("You do not have permission to assign tasks");

    const now = Date.now();
    const status = args.status || "Pending";
    const priority = args.priority || "Medium";

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      status,
      priority,
      createdBy: userId,
      assignedTo: args.assignedTo,
      assignedBy: args.assignedTo ? userId : undefined,
      assignedTeamId: args.teamId,
      workspaceId,
      organizationId: workspaceId,
      leadId: args.leadId,
      companyId: args.companyId,
      contactId: args.contactId,
      dealId: args.dealId,
      teamId: args.teamId,
      departmentId: args.departmentId,
      tags: args.tags,
      projectId: args.projectId,
      assignedAt: args.assignedTo ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // History
    await logHistory(ctx, taskId, "created", userId, userName, workspaceId);

    if (args.assignedTo) {
      await logHistory(ctx, taskId, "assigned", userId, userName, workspaceId, {
        field: "assignedTo",
        newValue: args.assignedTo,
      });
    }

    // Activity
    await logActivity(ctx, "task_created", `created task "${args.title}"`, userId, userName, taskId, workspaceId);

    if (args.assignedTo) {
      await logActivity(ctx, "task_assigned", `assigned task "${args.title}"`, userId, userName, taskId, workspaceId);

      if (args.assignedTo !== userId) {
        await notifyUser(ctx, args.assignedTo, "task_assigned", {
          entityName: args.title,
          entityType: "task",
          entityId: taskId,
          createdBy: userId,
        });
      }
    }

    return taskId;
  },
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    leadId: v.optional(v.id("leads")),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    teamId: v.optional(v.id("teams")),
    departmentId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    projectId: v.optional(v.string()),
    assignedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Task not found");

    const isAccessible = await canAccessTask(ctx, userId, existing);
    if (!isAccessible) throw new Error("You do not have permission to modify this task");

    const now = Date.now();
    const patch: any = { updatedAt: now, updatedBy: userId };

    // Track changes for history
    const changes: { field: string; oldValue: string; newValue: string }[] = [];

    type FieldDef = { key: string; logName: string };
    const editableFields: FieldDef[] = [
      { key: "title", logName: "title" },
      { key: "description", logName: "description" },
      { key: "dueDate", logName: "dueDate" },
      { key: "status", logName: "status" },
      { key: "priority", logName: "priority" },
      { key: "leadId", logName: "lead" },
      { key: "companyId", logName: "company" },
      { key: "contactId", logName: "contact" },
      { key: "dealId", logName: "deal" },
      { key: "teamId", logName: "team" },
      { key: "departmentId", logName: "department" },
      { key: "tags", logName: "tags" },
      { key: "projectId", logName: "project" },
    ];

    for (const f of editableFields) {
      if ((fields as any)[f.key] !== undefined && (fields as any)[f.key] !== (existing as any)[f.key]) {
        const oldVal = (existing as any)[f.key];
        const newVal = (fields as any)[f.key];
        const oldStr = typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal || "");
        const newStr = typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal || "");
        changes.push({ field: f.logName, oldValue: oldStr, newValue: newStr });
        patch[f.key] = newVal;
      }
    }

    // Handle assignment changes
    if (fields.assignedTo !== undefined && fields.assignedTo !== existing.assignedTo) {
      const allowed = await canAssignTask(ctx, userId, fields.assignedTo);
      if (!allowed) throw new Error("You do not have permission to reassign this task");

      if (existing.assignedTo && fields.assignedTo) {
        changes.push({ field: "assignedTo", oldValue: existing.assignedTo, newValue: fields.assignedTo });
      } else if (fields.assignedTo) {
        changes.push({ field: "assignedTo", oldValue: "", newValue: fields.assignedTo });
      } else {
        changes.push({ field: "assignedTo", oldValue: existing.assignedTo || "", newValue: "" });
      }

      patch.assignedTo = fields.assignedTo;
      patch.assignedBy = fields.assignedTo ? userId : undefined;
      patch.assignedAt = fields.assignedTo ? now : undefined;
    }

    // Handle completion
    if (fields.status === "Completed" && existing.status !== "Completed") {
      patch.completedBy = userId;
      patch.completedAt = now;
    } else if (fields.status && fields.status !== "Completed" && existing.status === "Completed") {
      patch.completedBy = undefined;
      patch.completedAt = undefined;
    }

    // Handle deletion
    if (fields.status === "Cancelled" && existing.status !== "Cancelled") {
      patch.deletedBy = userId;
      patch.deletedAt = now;
    } else if (fields.status && fields.status !== "Cancelled" && existing.status === "Cancelled") {
      patch.deletedBy = undefined;
      patch.deletedAt = undefined;
    }

    await ctx.db.patch(id, patch);

    // Log history for each change
    for (const change of changes) {
      let action = "field_changed";
      if (change.field === "status") {
        action = change.newValue === "Completed" ? "completed" : change.newValue === "Cancelled" ? "deleted" : "status_changed";
        if (change.oldValue === "Completed") action = "reopened";
        if (change.oldValue === "Cancelled") action = "restored";
      } else if (change.field === "assignedTo") {
        action = change.oldValue && change.newValue ? "reassigned" : change.newValue ? "assigned" : "unassigned";
      } else if (change.field === "priority") {
        action = "priority_changed";
      } else if (change.field === "dueDate") {
        action = "due_date_changed";
      }

      await logHistory(ctx, id, action, userId, userName, existing.workspaceId, change);

      const fieldLabels: Record<string, string> = {
        assignedTo: "Assigned to",
        priority: "Priority",
        dueDate: "Due date",
        status: "Status",
        title: "Title",
        description: "Description",
      };
      await logActivity(ctx, `task_${action}`, `${fieldLabels[change.field] || change.field} changed`, userId, userName, id, existing.workspaceId);
    }

    // Notifications
    if (changes.some((c) => c.field === "assignedTo")) {
      const newAssignee = fields.assignedTo;
      if (newAssignee && newAssignee !== userId) {
        await notifyUser(ctx, newAssignee, "task_assigned", {
          entityName: existing.title,
          entityType: "task",
          entityId: id,
          createdBy: userId,
        });
      }
    }

    if (fields.status === "Completed" && existing.status !== "Completed") {
      const assignee = fields.assignedTo || existing.assignedTo;
      if (assignee && assignee !== userId) {
        await notifyUser(ctx, assignee, "task_completed", {
          entityName: existing.title,
          entityType: "task",
          entityId: id,
          createdBy: userId,
        });
      }
      await notifyAdmins(ctx, undefined, "task_completed", {
        entityName: existing.title,
        entityType: "task",
        entityId: id,
        createdBy: userId,
      });
    }

    return id;
  },
});

// ─── REMOVE (Soft Delete) ─────────────────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    if (currentUser.role !== "super_admin") {
      throw new Error("Only Super Admins can delete tasks");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      deletedAt: now,
      deletedBy: userId,
      status: "Cancelled",
      updatedAt: now,
      updatedBy: userId,
    });

    await logHistory(ctx, args.id, "deleted", userId, userName, existing.workspaceId);
    await logActivity(ctx, "task_deleted", `deleted task "${existing.title}"`, userId, userName, args.id, existing.workspaceId);

    return args.id;
  },
});

// ─── RESTORE ──────────────────────────────────────────────────────────────────

export const restore = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      deletedAt: undefined,
      deletedBy: undefined,
      status: "Pending",
      updatedAt: now,
      updatedBy: userId,
    });

    await logHistory(ctx, args.id, "restored", userId, userName, existing.workspaceId);
    await logActivity(ctx, "task_restored", `restored task "${existing.title}"`, userId, userName, args.id, existing.workspaceId);

    return args.id;
  },
});

// ─── ASSIGN ───────────────────────────────────────────────────────────────────

export const assign = mutation({
  args: {
    id: v.id("tasks"),
    assignedTo: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const isAccessible = await canAccessTask(ctx, userId, existing);
    if (!isAccessible) throw new Error("Unauthorized");

    const allowed = await canAssignTask(ctx, userId, args.assignedTo);
    if (!allowed) throw new Error("You do not have permission to assign tasks");

    const now = Date.now();
    const isReassign = !!existing.assignedTo;

    await ctx.db.patch(args.id, {
      assignedTo: args.assignedTo,
      assignedBy: userId,
      assignedAt: now,
      updatedAt: now,
      updatedBy: userId,
    });

    await logHistory(ctx, args.id, isReassign ? "reassigned" : "assigned", userId, userName, existing.workspaceId, {
      field: "assignedTo",
      oldValue: existing.assignedTo || "",
      newValue: args.assignedTo,
    });

    await logActivity(ctx, isReassign ? "task_reassigned" : "task_assigned",
      `${isReassign ? "reassigned" : "assigned"} task "${existing.title}"`,
      userId, userName, args.id, existing.workspaceId
    );

    if (args.assignedTo !== userId) {
      await notifyUser(ctx, args.assignedTo, "task_assigned", {
        entityName: existing.title,
        entityType: "task",
        entityId: args.id,
        createdBy: userId,
      });
    }

    return args.id;
  },
});

// ─── UNASSIGN ─────────────────────────────────────────────────────────────────

export const unassign = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const isAccessible = await canAccessTask(ctx, userId, existing);
    if (!isAccessible) throw new Error("Unauthorized");

    const now = Date.now();
    const prevAssignee = existing.assignedTo;

    await ctx.db.patch(args.id, {
      assignedTo: undefined,
      assignedBy: undefined,
      assignedAt: undefined,
      updatedAt: now,
      updatedBy: userId,
    });

    await logHistory(ctx, args.id, "unassigned", userId, userName, existing.workspaceId, {
      field: "assignedTo",
      oldValue: prevAssignee || "",
      newValue: "",
    });

    await logActivity(ctx, "task_unassigned", `unassigned task "${existing.title}"`, userId, userName, args.id, existing.workspaceId);

    return args.id;
  },
});

// ─── BULK ASSIGN ──────────────────────────────────────────────────────────────

export const bulkAssign = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
    assignedTo: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const allowed = await canAssignTask(ctx, userId, args.assignedTo);
    if (!allowed) throw new Error("You do not have permission to assign tasks");

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    const now = Date.now();
    const results: { taskId: Id<"tasks">; success: boolean; error?: string }[] = [];

    for (const taskId of args.taskIds) {
      try {
        const existing = await ctx.db.get(taskId);
        if (!existing) {
          results.push({ taskId, success: false, error: "Not found" });
          continue;
        }
        if (existing.workspaceId !== workspaceId) {
          results.push({ taskId, success: false, error: "Unauthorized" });
          continue;
        }

        const isReassign = !!existing.assignedTo;

        await ctx.db.patch(taskId, {
          assignedTo: args.assignedTo,
          assignedBy: userId,
          assignedAt: now,
          updatedAt: now,
          updatedBy: userId,
        });

        await logHistory(ctx, taskId, isReassign ? "reassigned" : "assigned", userId, userName, existing.workspaceId, {
          field: "assignedTo",
          oldValue: existing.assignedTo || "",
          newValue: args.assignedTo,
        });

        results.push({ taskId, success: true });
      } catch (e: any) {
        results.push({ taskId, success: false, error: e.message });
      }
    }

    return results;
  },
});

// ─── BULK UPDATE STATUS ───────────────────────────────────────────────────────

export const bulkUpdateStatus = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
    status: v.string(),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    const now = Date.now();
    const results: { taskId: Id<"tasks">; success: boolean; error?: string }[] = [];

    for (const taskId of args.taskIds) {
      try {
        const existing = await ctx.db.get(taskId);
        if (!existing) {
          results.push({ taskId, success: false, error: "Not found" });
          continue;
        }
        if (existing.workspaceId !== workspaceId) {
          results.push({ taskId, success: false, error: "Unauthorized" });
          continue;
        }

        const patch: any = { updatedAt: now, updatedBy: userId };

        if (args.status && args.status !== existing.status) {
          patch.status = args.status;
          if (args.status === "Completed") {
            patch.completedBy = userId;
            patch.completedAt = now;
          } else if (existing.status === "Completed" && args.status !== "Completed") {
            patch.completedBy = undefined;
            patch.completedAt = undefined;
          }

          await logHistory(ctx, taskId, args.status === "Completed" ? "completed" : "status_changed", userId, userName, existing.workspaceId, {
            field: "status",
            oldValue: existing.status,
            newValue: args.status,
          });
        }

        if (args.priority && args.priority !== existing.priority) {
          patch.priority = args.priority;
          await logHistory(ctx, taskId, "priority_changed", userId, userName, existing.workspaceId, {
            field: "priority",
            oldValue: existing.priority,
            newValue: args.priority,
          });
        }

        await ctx.db.patch(taskId, patch);
        results.push({ taskId, success: true });
      } catch (e: any) {
        results.push({ taskId, success: false, error: e.message });
      }
    }

    return results;
  },
});

// ─── BULK DELETE ──────────────────────────────────────────────────────────────

export const bulkDelete = mutation({
  args: { taskIds: v.array(v.id("tasks")) },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    const now = Date.now();
    const results: { taskId: Id<"tasks">; success: boolean; error?: string }[] = [];

    for (const taskId of args.taskIds) {
      try {
        const existing = await ctx.db.get(taskId);
        if (!existing) {
          results.push({ taskId, success: false, error: "Not found" });
          continue;
        }
        if (existing.workspaceId !== workspaceId) {
          results.push({ taskId, success: false, error: "Unauthorized" });
          continue;
        }

        await ctx.db.patch(taskId, {
          deletedAt: now,
          deletedBy: userId,
          status: "Cancelled",
          updatedAt: now,
          updatedBy: userId,
        });

        await logHistory(ctx, taskId, "deleted", userId, userName, existing.workspaceId);
        results.push({ taskId, success: true });
      } catch (e: any) {
        results.push({ taskId, success: false, error: e.message });
      }
    }

    return results;
  },
});

// ─── BULK RESTORE ─────────────────────────────────────────────────────────────

export const bulkRestore = mutation({
  args: { taskIds: v.array(v.id("tasks")) },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    const now = Date.now();
    const results: { taskId: Id<"tasks">; success: boolean; error?: string }[] = [];

    for (const taskId of args.taskIds) {
      try {
        const existing = await ctx.db.get(taskId);
        if (!existing) {
          results.push({ taskId, success: false, error: "Not found" });
          continue;
        }
        if (existing.workspaceId !== workspaceId) {
          results.push({ taskId, success: false, error: "Unauthorized" });
          continue;
        }

        await ctx.db.patch(taskId, {
          deletedAt: undefined,
          deletedBy: undefined,
          status: "Pending",
          updatedAt: now,
          updatedBy: userId,
        });

        await logHistory(ctx, taskId, "restored", userId, userName, existing.workspaceId);
        results.push({ taskId, success: true });
      } catch (e: any) {
        results.push({ taskId, success: false, error: e.message });
      }
    }

    return results;
  },
});

// ─── DASHBOARD METRICS ────────────────────────────────────────────────────────

export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return null;

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return null;

    const userId = currentUser._id;
    const permAllData = hasPermission(currentUser, "canViewAllData");

    let tasks: Doc<"tasks">[];
    if (permAllData) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_workspaceId_deletedAt", (q) => q.eq("workspaceId", workspaceId))
        .collect();
    } else {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_workspaceId_deletedAt", (q) => q.eq("workspaceId", workspaceId))
        .collect();
      tasks = tasks.filter((t) => t.assignedTo === userId || t.createdBy === userId);
    }

    const active = tasks.filter((t) => !t.deletedAt);
    const now = Date.now();

    const totalTasks = active.length;
    const pending = active.filter((t) => t.status === "Pending").length;
    const inProgress = active.filter((t) => t.status === "In Progress").length;
    const blocked = active.filter((t) => t.status === "Blocked").length;
    const completed = active.filter((t) => t.status === "Completed").length;
    const cancelled = active.filter((t) => t.status === "Cancelled").length;
    const overdue = active.filter((t) => t.status !== "Completed" && t.status !== "Cancelled" && t.dueDate < now).length;

    const completedTasks = active.filter((t) => t.completedAt);
    const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    const avgCompletionTime = completedTasks.length > 0
      ? Math.round(completedTasks.reduce((sum, t) => sum + ((t.completedAt || t.updatedAt) - t.createdAt), 0) / completedTasks.length)
      : 0;

    // Employee workload
    const userTasks = active.filter((t) => t.assignedTo);
    const tasksPerEmployee: Record<string, number> = {};
    for (const t of userTasks) {
      if (t.assignedTo) {
        tasksPerEmployee[t.assignedTo] = (tasksPerEmployee[t.assignedTo] || 0) + 1;
      }
    }
    const employeeWorkload = Object.entries(tasksPerEmployee).map(([userId, count]) => ({ userId, count }));

    // Tasks per team
    const teamTasks = active.filter((t) => t.teamId);
    const tasksPerTeam: Record<string, number> = {};
    for (const t of teamTasks) {
      if (t.teamId) {
        tasksPerTeam[t.teamId] = (tasksPerTeam[t.teamId] || 0) + 1;
      }
    }

    // Trend (last 7 days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentCreated = active.filter((t) => t.createdAt >= sevenDaysAgo).length;
    const recentCompleted = active.filter((t) => t.completedAt && t.completedAt >= sevenDaysAgo).length;

    return {
      totalTasks,
      pending,
      inProgress,
      blocked,
      completed,
      cancelled,
      overdue,
      completionRate,
      avgCompletionTime,
      employeeWorkload,
      tasksPerTeam: Object.entries(tasksPerTeam).map(([teamId, count]) => ({ teamId, count })),
      trend: { created: recentCreated, completed: recentCompleted },
    };
  },
});

// ─── EMPLOYEE WORKLOAD ────────────────────────────────────────────────────────

export const getEmployeeWorkload = query({
  args: {
    employeeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return [];

    const permAllData = hasPermission(currentUser, "canViewAllData");

    let targetIds: Id<"users">[];
    if (args.employeeId) {
      targetIds = [args.employeeId];
    } else {
      const members = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspaceId", (q: any) => q.eq("workspaceId", workspaceId))
        .collect();

      const users = await Promise.all(members.map((m: any) => ctx.db.get(m.userId)));
      targetIds = users.filter(Boolean).map((u: any) => u._id);
    }

    const now = Date.now();
    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_workspaceId_deletedAt", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const activeTasks = allTasks.filter((t) => !t.deletedAt);

    const workloads = [];
    for (const empId of targetIds) {
      const user = await ctx.db.get(empId);
      if (!user) continue;

      if (!permAllData && empId !== currentUser._id) continue;

      const empTasks = activeTasks.filter((t) => t.assignedTo === empId);
      const assigned = empTasks.length;
      const completed = empTasks.filter((t) => t.status === "Completed").length;
      const pending = empTasks.filter((t) => t.status === "Pending").length;
      const overdue = empTasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled" && t.dueDate < now).length;

      const completedTasks = empTasks.filter((t) => t.completedAt);
      const avgCompletionTime = completedTasks.length > 0
        ? Math.round(completedTasks.reduce((sum, t) => sum + ((t.completedAt || t.updatedAt) - t.createdAt), 0) / completedTasks.length)
        : 0;

      workloads.push({
        employeeId: empId,
        name: user.name || "Unknown",
        email: user.email || "",
        avatarUrl: user.avatarUrl,
        assigned,
        completed,
        pending,
        overdue,
        completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        avgCompletionTime,
        currentWorkload: pending + (empTasks.filter((t) => t.status === "In Progress").length),
      });
    }

    return workloads;
  },
});

// ─── GET EXPORT DATA ──────────────────────────────────────────────────────────

export const getExportData = query({
  args: {
    taskIds: v.optional(v.array(v.id("tasks"))),
    status: v.optional(v.string()),
    statuses: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
    search: v.optional(v.string()),
    overdue: v.optional(v.boolean()),
    unassigned: v.optional(v.boolean()),
    datePreset: v.optional(v.string()),
    dateField: v.optional(v.string()),
    dateStart: v.optional(v.number()),
    dateEnd: v.optional(v.number()),
    format: v.optional(v.string()), // "csv" | "xlsx"
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return [];

    let tasks: Doc<"tasks">[];

    if (args.taskIds && args.taskIds.length > 0) {
      tasks = [];
      for (const id of args.taskIds) {
        const t = await ctx.db.get(id);
        if (t && t.workspaceId === workspaceId) tasks.push(t);
      }
    } else {
      const allTasks = await ctx.db
        .query("tasks")
        .withIndex("by_workspaceId_deletedAt", (q) => q.eq("workspaceId", workspaceId))
        .collect();

      tasks = allTasks.filter((t) => !t.deletedAt);

      // Apply filters
      if (args.status) tasks = tasks.filter((t) => t.status === args.status);
      if (args.statuses && args.statuses.length > 0) tasks = tasks.filter((t) => args.statuses!.includes(t.status));
      if (args.assignedTo) tasks = tasks.filter((t) => t.assignedTo === args.assignedTo);
      if (args.createdBy) tasks = tasks.filter((t) => t.createdBy === args.createdBy);
      if (args.teamId) tasks = tasks.filter((t) => t.teamId === args.teamId || t.assignedTeamId === args.teamId);
      if (args.unassigned) tasks = tasks.filter((t) => !t.assignedTo);
      if (args.overdue) {
        const now = Date.now();
        tasks = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled" && t.dueDate < now);
      }
      if (args.search) {
        const q = args.search.toLowerCase();
        tasks = tasks.filter((t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
      }
      if (args.datePreset || (args.dateStart !== undefined && args.dateEnd !== undefined)) {
        const range = getDateRange(args.datePreset, args.dateStart, args.dateEnd);
        const field = args.dateField || "dueDate";
        if (range) {
          tasks = tasks.filter((t) => {
            const val = (t as any)[field];
            return val !== undefined && val >= range.start && val <= range.end;
          });
        }
      }
    }

    // Enrich with user names
    const enriched = await Promise.all(
      tasks.map(async (t) => {
        const assignee = t.assignedTo ? await ctx.db.get(t.assignedTo) : null;
        const creator = t.createdBy ? await ctx.db.get(t.createdBy) : null;
        const completer = t.completedBy ? await ctx.db.get(t.completedBy) : null;
        return {
          _id: t._id,
          title: t.title,
          description: t.description || "",
          status: t.status,
          priority: t.priority,
          assignedTo: assignee?.name || "",
          assignedToEmail: assignee?.email || "",
          createdBy: creator?.name || "",
          completedBy: completer?.name || "",
          createdAt: t.createdAt,
          dueDate: t.dueDate,
          completedAt: t.completedAt || 0,
          tags: (t.tags || []).join(", "),
          workspaceId: t.workspaceId || "",
        };
      })
    );

    return enriched;
  },
});
