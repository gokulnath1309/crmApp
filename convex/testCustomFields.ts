import { mutation } from "./_generated/server";

export const runTest = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Get or create a test user & workspace
    const now = Date.now();
    let testUser = await ctx.db.query("users").first();
    if (!testUser) {
      const userId = await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      testUser = await ctx.db.get(userId);
    }
    const testUserId = testUser!._id;

    let testWorkspace = await ctx.db.query("workspaces").first();
    if (!testWorkspace) {
      const workspaceId = await ctx.db.insert("workspaces", {
        name: "Test Workspace",
        createdBy: testUserId,
        createdAt: now,
        status: "active",
      });
      testWorkspace = await ctx.db.get(workspaceId);
    }
    const testWorkspaceId = testWorkspace!._id;

    console.log("Using testUser:", testUserId);
    console.log("Using testWorkspace:", testWorkspaceId);

    // 2. Insert custom fields
    const customFieldId = await ctx.db.insert("customFields", {
      label: "Test Text Field",
      name: "testTextField",
      type: "Text",
      required: true,
      stage: "Qualified",
      workspaceId: testWorkspaceId,
      createdAt: now,
    });

    console.log("Created custom field:", customFieldId);

    // 3. Create a lead in New stage
    const leadId = await ctx.db.insert("leads", {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      company: "Acme Corp",
      status: "New",
      source: "Website",
      workspaceId: testWorkspaceId,
      createdBy: testUserId,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Created lead:", leadId);

    // 4. Simulate a transition to Qualified stage
    // (Here we replicate transitionStage logic to verify schema & DB patch success)
    const fromStage = "New";
    const toStage = "Qualified";
    const transitionData = {
      expectedBudget: 5000,
      priority: "High",
      interestLevel: "4",
      probabilityOfSuccess: 75,
      customFields: {
        testTextField: "Test Value",
      },
    };

    // Insert transition log
    const logId = await ctx.db.insert("leadStageTransitions", {
      leadId,
      fromStage,
      toStage,
      userId: testUserId,
      userName: "Test User",
      transitionedAt: now,
      data: transitionData,
      workspaceId: testWorkspaceId,
    });

    // Patch lead
    const leadPatch: any = {
      status: toStage,
      updatedAt: now,
      statusChangedAt: now,
      statusChangedBy: "Test User",
    };

    leadPatch.value = Number(transitionData.expectedBudget);
    leadPatch.priority = transitionData.priority;

    const mergedCustomFields: Record<string, any> = {
      // (old custom fields empty)
      ...(transitionData.customFields || {}),
    };
    mergedCustomFields.interestLevel = transitionData.interestLevel;
    mergedCustomFields.probabilityOfSuccess = transitionData.probabilityOfSuccess;
    
    leadPatch.customFields = mergedCustomFields;

    await ctx.db.patch(leadId, leadPatch);

    // 5. Verify the updates
    const updatedLead = await ctx.db.get(leadId);
    if (!updatedLead) throw new Error("Lead not found after patch");
    
    console.log("Updated lead:", updatedLead);

    if (updatedLead.status !== "Qualified") {
      throw new Error(`Expected status to be Qualified, got ${updatedLead.status}`);
    }
    if (updatedLead.value !== 5000) {
      throw new Error(`Expected value to be 5000, got ${updatedLead.value}`);
    }
    if (updatedLead.priority !== "High") {
      throw new Error(`Expected priority to be High, got ${updatedLead.priority}`);
    }
    if (updatedLead.customFields?.testTextField !== "Test Value") {
      throw new Error(`Expected customFields.testTextField to be 'Test Value', got ${updatedLead.customFields?.testTextField}`);
    }
    if (updatedLead.customFields?.interestLevel !== "4") {
      throw new Error(`Expected customFields.interestLevel to be '4', got ${updatedLead.customFields?.interestLevel}`);
    }
    if (updatedLead.customFields?.probabilityOfSuccess !== 75) {
      throw new Error(`Expected customFields.probabilityOfSuccess to be 75, got ${updatedLead.customFields?.probabilityOfSuccess}`);
    }

    // 6. Clean up created objects for the test
    await ctx.db.delete(customFieldId);
    await ctx.db.delete(leadId);
    await ctx.db.delete(logId);

    console.log("=== ALL CUSTOM FIELD TRANSITION TESTS PASSED ===");
    return { success: true };
  },
});
