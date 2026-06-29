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
      .query("emails")
      .withIndex("by_leadId", (q) => q.eq("leadId", args.leadId))
      .collect();
  },
});

export const send = mutation({
  args: {
    leadId: v.id("leads"),
    to: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const now = Date.now();
    
    const emailId = await ctx.db.insert("emails", {
      leadId: args.leadId,
      from: currentUser.email || "system@example.com",
      to: args.to,
      subject: args.subject,
      body: args.body,
      sentAt: now,
      status: "sent",
      workspaceId,
    });

    // Retrieve lead to get its stage
    const lead = await ctx.db.get(args.leadId);
    const stageAtTime = lead?.status || "New";

    // Add activity timeline record
    await ctx.db.insert("leadActivities", {
      leadId: args.leadId,
      activityType: "Email",
      userId: currentUser._id,
      userName: currentUser.name || "System",
      date: new Date(now).toLocaleDateString(),
      time: new Date(now).toTimeString().split(" ")[0].slice(0, 5),
      summary: `Email Sent: ${args.subject}`,
      notes: args.body,
      stageAtTime,
      workspaceId,
      createdAt: now,
    });

    return emailId;
  },
});
