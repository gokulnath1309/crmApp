import { v } from "convex/values";
import { query } from "./_generated/server";
import { resolveUserReadOnly } from "./lib/getCurrentUser";

export const getEvents = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) {
      return { meetings: [], tasks: [], events: [] };
    }

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      return { meetings: [], tasks: [], events: [] };
    }

    const allMeetings = await ctx.db
      .query("meetings")
      .collect();

    const workspaceMeetings = allMeetings.filter(
      (m) => m.workspaceId === workspaceId
    );

    const meetings = workspaceMeetings
      .filter(
        (m) => m.startTime >= args.startDate && m.startTime <= args.endDate
      )
      .map((m) => ({
        _id: m._id,
        title: m.title,
        description: m.description,
        startTime: m.startTime,
        endTime: m.endTime,
        location: m.location,
        leadId: m.leadId,
        type: "meeting" as const,
      }));

    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const tasks = allTasks
      .filter(
        (t) => t.dueDate >= args.startDate && t.dueDate <= args.endDate
      )
      .map((t) => ({
        _id: t._id,
        title: t.title,
        description: undefined as string | undefined,
        startTime: t.dueDate,
        endTime: t.dueDate,
        location: undefined as string | undefined,
        leadId: t.leadId,
        status: t.status,
        priority: t.priority,
        type: "task" as const,
      }));

    let events = await ctx.db
      .query("events")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    events = events.filter((e) => e.start >= args.startDate && e.start <= args.endDate);

    return { meetings, tasks, events: events.sort((a, b) => a.start - b.start) };
  },
});
