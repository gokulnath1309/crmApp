import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const runTest = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("=== STARTING INTEGRATION TESTS FOR LEAD DETAILS WORKSPACE ===");
    const now = Date.now();

    // 1. Get or create a test user
    let testUser = await ctx.db.query("users").first();
    if (!testUser) {
      const userId = await ctx.db.insert("users", {
        name: "Test Developer",
        email: "test.dev@example.com",
        isActive: true,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      });
      testUser = await ctx.db.get(userId);
    }
    const testUserId = testUser!._id;

    // 2. Get or create a test workspace
    let testWorkspace = await ctx.db.query("workspaces").first();
    if (!testWorkspace) {
      const workspaceId = await ctx.db.insert("workspaces", {
        name: "Test CRM Workspace",
        createdBy: testUserId,
        createdAt: now,
        status: "active",
      });
      testWorkspace = await ctx.db.get(workspaceId);
    }
    const testWorkspaceId = testWorkspace!._id;

    console.log("Using testUserId:", testUserId);
    console.log("Using testWorkspaceId:", testWorkspaceId);

    // 3. Create a test lead
    const leadId = await ctx.db.insert("leads", {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: "+15550199",
      company: "Innovate Ltd",
      status: "New",
      source: "LinkedIn",
      workspaceId: testWorkspaceId,
      createdBy: testUserId,
      createdAt: now,
      updatedAt: now,
    });
    console.log("Created test lead:", leadId);

    // 4. Test Notes and Note Versions
    console.log("[TEST] Step 1: Note and Note Versions");
    const noteId = await ctx.db.insert("notes", {
      body: "Initial notes about lead requirements.",
      entityType: "leads",
      entityId: leadId,
      createdBy: testUserId,
      createdAt: now,
    });

    // Simulate update to note (creates a version in noteVersions)
    const existingNote = await ctx.db.get(noteId);
    if (!existingNote) throw new Error("Note not found");

    // Insert version history
    await ctx.db.insert("noteVersions", {
      noteId: noteId,
      body: existingNote.body,
      updatedBy: existingNote.createdBy,
      updatedAt: existingNote.createdAt,
    });

    // Update the note
    await ctx.db.patch(noteId, {
      body: "Updated notes after follow-up call.",
      createdAt: now + 5000,
      createdBy: testUserId,
    });

    // Retrieve note and verify patch
    const updatedNote = await ctx.db.get(noteId);
    if (updatedNote?.body !== "Updated notes after follow-up call.") {
      throw new Error("Failed to update note body");
    }

    // Retrieve versions and verify
    const versions = await ctx.db
      .query("noteVersions")
      .withIndex("by_noteId", (q) => q.eq("noteId", noteId))
      .collect();

    if (versions.length !== 1) {
      throw new Error(`Expected exactly 1 note version, got ${versions.length}`);
    }
    if (versions[0].body !== "Initial notes about lead requirements.") {
      throw new Error("Stored note version body does not match original");
    }
    console.log("[TEST] Note and Note Versions passed successfully.");

    // 5. Test Tasks with leadId
    console.log("[TEST] Step 2: Tasks linked to lead");
    const taskId = await ctx.db.insert("tasks", {
      title: "Send pricing proposal",
      dueDate: now + 86400000, // tomorrow
      status: "Pending",
      priority: "High",
      createdBy: testUserId,
      assignedTo: testUserId,
      workspaceId: testWorkspaceId,
      leadId: leadId,
      createdAt: now,
      updatedAt: now,
    });

    const leadTasks = await ctx.db
      .query("tasks")
      .withIndex("by_leadId", (q) => q.eq("leadId", leadId))
      .collect();

    if (leadTasks.length !== 1) {
      throw new Error(`Expected exactly 1 task linked to lead, got ${leadTasks.length}`);
    }
    if (leadTasks[0]._id !== taskId) {
      throw new Error("Linked task ID mismatch");
    }
    console.log("[TEST] Tasks linked to lead passed successfully.");

    // 6. Test Emails Logging
    console.log("[TEST] Step 3: Emails logging");
    const emailId = await ctx.db.insert("emails", {
      leadId: leadId,
      from: "sales@innovate.com",
      to: ["jane.smith@example.com"],
      subject: "Welcome to Innovate Ltd",
      body: "Hi Jane, welcome!",
      sentAt: now,
      status: "sent",
      workspaceId: testWorkspaceId,
    });

    // Add activity timeline record for email
    const emailActivityId = await ctx.db.insert("leadActivities", {
      leadId: leadId,
      activityType: "Email",
      userId: testUserId,
      userName: "Test Developer",
      date: new Date(now).toLocaleDateString(),
      time: new Date(now).toTimeString().split(" ")[0].slice(0, 5),
      summary: "Email Sent: Welcome to Innovate Ltd",
      notes: "Hi Jane, welcome!",
      stageAtTime: "New",
      workspaceId: testWorkspaceId,
      createdAt: now,
      isPinned: false,
    });

    const leadEmails = await ctx.db
      .query("emails")
      .withIndex("by_leadId", (q) => q.eq("leadId", leadId))
      .collect();

    if (leadEmails.length !== 1) {
      throw new Error(`Expected exactly 1 email, got ${leadEmails.length}`);
    }
    console.log("[TEST] Emails logging passed successfully.");

    // 7. Test Meetings Logging
    console.log("[TEST] Step 4: Meetings logging");
    const meetingId = await ctx.db.insert("meetings", {
      leadId: leadId,
      title: "Discovery Call",
      description: "Initial discovery call",
      startTime: now + 3600000,
      endTime: now + 7200000,
      location: "Google Meet",
      workspaceId: testWorkspaceId,
      createdAt: now,
    });

    // Add activity timeline record for meeting
    const meetingActivityId = await ctx.db.insert("leadActivities", {
      leadId: leadId,
      activityType: "Meeting",
      userId: testUserId,
      userName: "Test Developer",
      date: new Date(now + 3600000).toLocaleDateString(),
      time: new Date(now + 3600000).toTimeString().split(" ")[0].slice(0, 5),
      summary: "Meeting Scheduled: Discovery Call",
      notes: "Initial discovery call",
      stageAtTime: "New",
      workspaceId: testWorkspaceId,
      createdAt: now + 1000,
      isPinned: false,
    });

    const leadMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_leadId", (q) => q.eq("leadId", leadId))
      .collect();

    if (leadMeetings.length !== 1) {
      throw new Error(`Expected exactly 1 meeting, got ${leadMeetings.length}`);
    }
    console.log("[TEST] Meetings logging passed successfully.");

    // 8. Test Activity Pinning and Sorting
    console.log("[TEST] Step 5: Activity Pinning and Sorting");
    // Pin the email activity
    await ctx.db.patch(emailActivityId, { isPinned: true });

    // Retrieve activities and sort (pinned first, then created desc)
    const activities = await ctx.db
      .query("leadActivities")
      .withIndex("by_leadId", (q) => q.eq("leadId", leadId))
      .collect();

    const sortedActivities = activities.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });

    if (sortedActivities[0]._id !== emailActivityId) {
      throw new Error("Expected pinned email activity to be first");
    }
    if (sortedActivities[1]._id !== meetingActivityId) {
      throw new Error("Expected unpinned meeting activity to be second");
    }
    console.log("[TEST] Activity Pinning and Sorting passed successfully.");

    // 9. Test Reminders
    console.log("[TEST] Step 6: Reminders");
    const reminderId = await ctx.db.insert("leadReminders", {
      leadId: leadId,
      userId: testUserId,
      userName: "Test Developer",
      title: "Follow up on proposal",
      dueDate: now + 172800000,
      isCompleted: false,
      workspaceId: testWorkspaceId,
      createdAt: now,
    });

    // Verify it is fetched
    const reminders = await ctx.db
      .query("leadReminders")
      .withIndex("by_leadId", (q) => q.eq("leadId", leadId))
      .collect();
    if (reminders.length !== 1) {
      throw new Error(`Expected exactly 1 reminder, got ${reminders.length}`);
    }

    // Complete the reminder
    await ctx.db.patch(reminderId, { isCompleted: true });
    const completedReminder = await ctx.db.get(reminderId);
    if (!completedReminder?.isCompleted) {
      throw new Error("Failed to complete reminder");
    }
    console.log("[TEST] Reminders passed successfully.");

    // 10. Clean up test records
    console.log("[TEST] Cleaning up test records...");
    await ctx.db.delete(leadId);
    await ctx.db.delete(noteId);
    for (const v of versions) {
      await ctx.db.delete(v._id);
    }
    await ctx.db.delete(taskId);
    await ctx.db.delete(emailId);
    await ctx.db.delete(emailActivityId);
    await ctx.db.delete(meetingId);
    await ctx.db.delete(meetingActivityId);
    await ctx.db.delete(reminderId);

    console.log("=== ALL LEAD DETAILS WORKSPACE TESTS PASSED SUCCESSFULLY ===");
    return { success: true };
  },
});
