import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { hasPermission } from "./rbac";
import { internal } from "./_generated/api";

export const list = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    eventType: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return [];

    let events = await ctx.db
      .query("events")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    events = events.filter((e) => e.start >= args.startDate && e.start <= args.endDate);

    if (args.eventType) events = events.filter((e) => e.eventType === args.eventType);
    if (args.ownerId) events = events.filter((e) => e.ownerId === args.ownerId || e.assignedTo === args.ownerId);
    if (args.priority) events = events.filter((e) => e.priority === args.priority);
    if (args.status) events = events.filter((e) => e.status === args.status);

    if (args.search) {
      const term = args.search.toLowerCase();
      events = events.filter((e) =>
        e.title.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.notes?.toLowerCase().includes(term)
      );
    }

    const canViewAll = hasPermission(currentUser, "canViewAllData");
    if (!canViewAll) {
      events = events.filter((e) =>
        e.ownerId === currentUser._id ||
        e.assignedTo === currentUser._id ||
        e.createdBy === currentUser._id
      );
    }

    return events.sort((a, b) => a.start - b.start);
  },
});

export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return null;
    const event = await ctx.db.get(args.id);
    if (!event || event.deletedAt) return null;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (event.workspaceId !== workspaceId) return null;
    return event;
  },
});

export const getUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return [];

    const now = Date.now();
    let events = await ctx.db
      .query("events")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    events = events.filter((e) => e.start >= now && e.status !== "Cancelled");
    events.sort((a, b) => a.start - b.start);
    return events.slice(0, args.limit || 10);
  },
});

export const search = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return [];

    const term = args.query.toLowerCase();
    let events = await ctx.db
      .query("events")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    events = events.filter((e) =>
      e.title.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term) ||
      e.notes?.toLowerCase().includes(term)
    );

    return events.slice(0, args.limit || 20);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    relatedType: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    start: v.number(),
    end: v.number(),
    allDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    locationType: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    meetingProvider: v.optional(v.string()),
    priority: v.optional(v.string()),
    reminder: v.optional(v.string()),
    repeat: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(v.string()),
    guests: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    if (args.end <= args.start) throw new Error("End time must be after start time");
    if (!args.title.trim()) throw new Error("Title is required");

    const now = Date.now();
    const eventId = await ctx.db.insert("events", {
      ...args,
      ownerId: currentUser._id,
      workspaceId,
      createdBy: currentUser._id,
      updatedBy: currentUser._id,
      status: args.status || "Scheduled",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "event_created",
      description: `created event "${args.title}"`,
      userId: currentUser._id,
      userName: currentUser.name || "System",
      entityType: "event",
      entityId: eventId,
    });

    if (args.assignedTo && args.assignedTo !== currentUser._id) {
      await ctx.scheduler.runAfter(0, internal.events.notifyEventAssigned, {
        eventId,
        title: args.title,
        assignedTo: args.assignedTo,
        createdBy: currentUser._id,
        workspaceId,
      });
    }

    return eventId;
  },
});

export const update = mutation({
  args: {
    id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    eventType: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    locationType: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    meetingProvider: v.optional(v.string()),
    priority: v.optional(v.string()),
    reminder: v.optional(v.string()),
    repeat: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(v.string()),
    guests: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing || existing.deletedAt) throw new Error("Event not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const canEditAll = hasPermission(currentUser, "canViewAllData") || currentUser.role === "super_admin" || currentUser.role === "admin";
    if (!canEditAll && existing.ownerId !== currentUser._id && existing.createdBy !== currentUser._id) {
      throw new Error("You can only edit your own events");
    }

    const start = fields.start ?? existing.start;
    const end = fields.end ?? existing.end;
    if (end <= start) throw new Error("End time must be after start time");
    if (fields.title !== undefined && !fields.title.trim()) throw new Error("Title is required");

    await ctx.db.patch(id, {
      ...fields,
      updatedBy: currentUser._id,
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "event_updated",
      description: `updated event "${existing.title}"`,
      userId: currentUser._id,
      userName: currentUser.name || "System",
      entityType: "event",
      entityId: id,
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.deletedAt) throw new Error("Event not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const canEditAll = hasPermission(currentUser, "canViewAllData") || currentUser.role === "super_admin" || currentUser.role === "admin";
    if (!canEditAll && existing.ownerId !== currentUser._id && existing.createdBy !== currentUser._id) {
      throw new Error("You can only delete your own events");
    }

    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
      updatedBy: currentUser._id,
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "event_deleted",
      description: `deleted event "${existing.title}"`,
      userId: currentUser._id,
      userName: currentUser.name || "System",
      entityType: "event",
      entityId: args.id,
    });

    return args.id;
  },
});

export const updateStatus = mutation({
  args: { id: v.id("events"), status: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.deletedAt) throw new Error("Event not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedBy: currentUser._id,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const move = mutation({
  args: { id: v.id("events"), start: v.number(), end: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.deletedAt) throw new Error("Event not found");

    await ctx.db.patch(args.id, {
      start: args.start,
      end: args.end ?? args.start + (existing.end - existing.start),
      updatedBy: currentUser._id,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const notifyEventAssigned = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    assignedTo: v.id("users"),
    createdBy: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.createdBy);
    const name = creator?.name || "A user";
    await ctx.db.insert("notifications", {
      userId: args.assignedTo,
      title: "Event Assigned",
      message: `${name} assigned you to event "${args.title}"`,
      type: "event_assigned",
      entityType: "event",
      entityId: args.eventId,
      priority: "medium",
      read: false,
      actionUrl: `/calendar`,
      createdBy: args.createdBy,
      workspaceId: args.workspaceId,
      createdAt: Date.now(),
    });
  },
});
