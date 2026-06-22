import { query } from "./_generated/server";

export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    // 1. Fetch leads count and recent leads
    const leads = await ctx.db.query("leads").collect();
    const totalLeads = leads.length;
    const recentLeads = [...leads]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    // 2. Fetch contacts count
    const contacts = await ctx.db.query("contacts").collect();
    const totalContacts = contacts.length;

    // 3. Fetch active deals pipeline value
    const deals = await ctx.db.query("deals").collect();
    const activeDealsValue = deals
      .filter((d) => d.status === "Pipeline" || d.stage !== "Closed Won" && d.stage !== "Closed Lost")
      .reduce((sum, d) => sum + d.value, 0);

    // 4. Fetch pending tasks count
    const tasks = await ctx.db.query("tasks").collect();
    const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
    const todaysTasks = tasks
      .filter((t) => t.status === "Pending")
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 4);

    // 5. Fetch recent activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(10);

    return {
      totalLeads,
      totalContacts,
      activeDealsValue,
      pendingTasks,
      recentLeads,
      todaysTasks,
      activities,
    };
  },
});
