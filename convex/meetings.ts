import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";

export const list = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];
    
    return await ctx.db
      .query("meetings")
      .withIndex("by_leadId", (q) => q.eq("leadId", args.leadId))
      .collect();
  },
});

export const schedule = mutation({
  args: {
    leadId: v.id("leads"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const now = Date.now();
    
    const meetingId = await ctx.db.insert("meetings", {
      leadId: args.leadId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
      workspaceId,
      createdAt: now,
    });

    // Retrieve lead to get its stage
    const lead = await ctx.db.get(args.leadId);
    const stageAtTime = lead?.status || "New";

    // Add activity timeline record
    await ctx.db.insert("leadActivities", {
      leadId: args.leadId,
      activityType: "Meeting",
      userId: currentUser._id,
      userName: currentUser.name || "System",
      date: new Date(args.startTime).toLocaleDateString(),
      time: new Date(args.startTime).toTimeString().split(" ")[0].slice(0, 5),
      summary: `Meeting Scheduled: ${args.title}`,
      notes: args.description || `Meeting scheduled from ${new Date(args.startTime).toLocaleString()} to ${new Date(args.endTime).toLocaleString()}`,
      stageAtTime,
      workspaceId,
      createdAt: now,
    });

    return meetingId;
  },
});
