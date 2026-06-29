import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    read: v.optional(v.boolean()),
    filter: v.optional(v.string()), // "all" | "unread" | "deals" | "leads" | "tasks" | "system" | "mentions" | "calendar" | "employees" | "teams" | "reports" | "pinned" | "archived"
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await resolveUserReadOnly(ctx);
    if (!user) return [];

    const limit = args.limit ?? 100;

    let queryBuilder = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    let notifications = await queryBuilder.collect();

    // Filter out soft-deleted notifications (if any deletedAt is set)
    notifications = notifications.filter(n => !n.deletedAt);

    // Apply main feed vs archived/pinned scoping:
    // By default, archived notifications are hidden unless filter === "archived"
    if (args.filter === "archived") {
      notifications = notifications.filter(n => n.archived === true);
    } else {
      notifications = notifications.filter(n => n.archived !== true);
    }

    if (args.filter === "pinned") {
      notifications = notifications.filter(n => n.pinned === true);
    }

    // Apply read/unread state filtering
    if (args.read !== undefined) {
      notifications = notifications.filter(n => n.read === args.read);
    }
    if (args.filter === "unread") {
      notifications = notifications.filter(n => !n.read);
    }

    // Apply Category Tab Filters
    if (args.filter && !["all", "unread", "pinned", "archived"].includes(args.filter)) {
      notifications = notifications.filter(n => {
        const type = n.type || "";
        const entityType = n.entityType || "";
        const f = args.filter;

        if (f === "deals") return entityType === "deal" || type.includes("deal");
        if (f === "leads") return entityType === "lead" || type.includes("lead");
        if (f === "tasks") return entityType === "task" || type.includes("task");
        if (f === "mentions") return type.includes("mention") || type.includes("comment");
        if (f === "calendar") return entityType === "meeting" || type.includes("meeting") || type.includes("calendar");
        if (f === "employees") return type.includes("employee") || type.includes("invited") || type.includes("joined") || type === "user_invited";
        if (f === "teams") return type.includes("team");
        if (f === "reports") return type.includes("report");
        if (f === "system") {
          const isCategory = entityType === "deal" || type.includes("deal") ||
                             entityType === "lead" || type.includes("lead") ||
                             entityType === "task" || type.includes("task") ||
                             type.includes("mention") || type.includes("comment") ||
                             entityType === "meeting" || type.includes("meeting") || type.includes("calendar") ||
                             type.includes("employee") || type.includes("invited") || type.includes("joined") || type === "user_invited" ||
                             type.includes("team") || type.includes("report");
          return !isCategory;
        }
        return true;
      });
    }

    // Apply Search Filter
    if (args.search) {
      const s = args.search.toLowerCase();
      notifications = notifications.filter(n => {
        return (n.title || "").toLowerCase().includes(s) ||
               (n.message || "").toLowerCase().includes(s) ||
               (n.entityType || "").toLowerCase().includes(s) ||
               (n.type || "").toLowerCase().includes(s);
      });
    }

    // Sort: Pinned first, then by createdAt desc
    notifications.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return b.createdAt - a.createdAt;
    });

    return notifications.slice(0, limit);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUserReadOnly(ctx);
    if (!user) return 0;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();
    // Exclude archived notifications from active unread counts
    return notifications.filter(n => !n.archived).length;
  },
});

export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await resolveUserReadOnly(ctx);
    if (!user) return [];

    const limit = args.limit ?? 10;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return notifications.filter(n => !n.archived).slice(0, limit);
  },
});

export const getCategoryCounts = query({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUserReadOnly(ctx);
    if (!user) return {
      all: 0,
      unread: 0,
      deals: 0,
      leads: 0,
      tasks: 0,
      system: 0,
      mentions: 0,
      calendar: 0,
      employees: 0,
      teams: 0,
      reports: 0,
    };

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Only count active non-archived ones
    const active = notifications.filter(n => !n.archived);

    const counts = {
      all: active.length,
      unread: active.filter(n => !n.read).length,
      deals: 0,
      leads: 0,
      tasks: 0,
      system: 0,
      mentions: 0,
      calendar: 0,
      employees: 0,
      teams: 0,
      reports: 0,
    };

    for (const n of active) {
      const type = n.type || "";
      const entityType = n.entityType || "";

      if (entityType === "deal" || type.includes("deal")) counts.deals++;
      else if (entityType === "lead" || type.includes("lead")) counts.leads++;
      else if (entityType === "task" || type.includes("task")) counts.tasks++;
      else if (type.includes("mention") || type.includes("comment")) counts.mentions++;
      else if (entityType === "meeting" || type.includes("meeting") || type.includes("calendar")) counts.calendar++;
      else if (type.includes("employee") || type.includes("invited") || type.includes("joined") || type === "user_invited") counts.employees++;
      else if (type.includes("team")) counts.teams++;
      else if (type.includes("report")) counts.reports++;
      else counts.system++;
    }

    return counts;
  }
});

export const markAsRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");
    if (existing.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { read: true, readAt: Date.now() });
    return args.id;
  },
});

export const markAsUnread = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");
    if (existing.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { read: false, readAt: undefined });
    return args.id;
  },
});

export const pinNotification = mutation({
  args: {
    id: v.id("notifications"),
    pinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");
    if (existing.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { pinned: args.pinned, updatedAt: Date.now() });
    return args.id;
  },
});

export const archiveNotification = mutation({
  args: {
    id: v.id("notifications"),
    archived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");
    if (existing.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { archived: args.archived, updatedAt: Date.now() });
    return args.id;
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    // Only patch active non-archived ones
    const activeUnread = unread.filter(n => !n.archived);

    for (const n of activeUnread) {
      await ctx.db.patch(n._id, { read: true, readAt: Date.now() });
    }
    return activeUnread.length;
  },
});

export const dismiss = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");
    if (existing.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const updateSettings = mutation({
  args: {
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await ctx.db.patch(user._id, { notificationSettings: args.settings });
    return user._id;
  },
});

export const bulkUpdate = mutation({
  args: {
    ids: v.array(v.id("notifications")),
    action: v.string(), // "read" | "unread" | "archive" | "unarchive" | "pin" | "unpin" | "delete"
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    for (const id of args.ids) {
      const n = await ctx.db.get(id);
      if (n && n.userId === user._id) {
        if (args.action === "read") {
          await ctx.db.patch(id, { read: true, readAt: Date.now() });
        } else if (args.action === "unread") {
          await ctx.db.patch(id, { read: false, readAt: undefined });
        } else if (args.action === "archive") {
          await ctx.db.patch(id, { archived: true, updatedAt: Date.now() });
        } else if (args.action === "unarchive") {
          await ctx.db.patch(id, { archived: false, updatedAt: Date.now() });
        } else if (args.action === "pin") {
          await ctx.db.patch(id, { pinned: true, updatedAt: Date.now() });
        } else if (args.action === "unpin") {
          await ctx.db.patch(id, { pinned: false, updatedAt: Date.now() });
        } else if (args.action === "delete") {
          await ctx.db.delete(id);
        }
      }
    }
    return args.ids;
  },
});
