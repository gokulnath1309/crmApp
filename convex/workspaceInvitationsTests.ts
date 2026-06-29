import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const runTests = action({
  args: {},
  handler: async (ctx) => {
    console.log("=== STARTING AUTOMATED TESTS FOR WORKSPACE INVITATIONS ===");
    console.log("[TEST] Initializing test workspace and admin...");
    const { testUserId, testWorkspaceId } = await ctx.runMutation(internal.workspaceInvitations_test.createTestEnv);

    try {
      // Test Case 1: Create invitation
      console.log("[TEST] Case 1: Create invitation");
      const token = "test-token-12345-" + Math.random().toString(36).substring(2, 7);
      const { invitationId } = await ctx.runMutation(internal.users.createInvitationRecord, {
        callerUserId: testUserId,
        callerName: "Test Admin",
        callerWorkspaceId: testWorkspaceId,
        callerWorkspaceName: "Test Workspace",
        email: "invited-user@example.com",
        name: "Invited User",
        role: "employee",
        token,
      });

      // Verify invitation created
      let invitation = await ctx.runQuery(api.users.getInvitationByToken, { token });
      if (!invitation) throw new Error("Test failed: Invitation not created");
      console.log("[TEST] Case 1 passed: Invitation created successfully");

      // Test Case 2: Tracking status on email sent
      console.log("[TEST] Case 2: Update status on initial email sent");
      await ctx.runMutation(internal.users.updateInvitationEmailStatus, {
        invitationId,
        status: "email_sent",
        emailStatus: "sent",
        messageId: "mock-msg-id-1",
        smtpResponse: "250 OK",
      });

      invitation = await ctx.runQuery(api.users.getInvitationByToken, { token });
      if (!invitation || invitation.lastDeliveryStatus !== "sent" || invitation.messageId !== "mock-msg-id-1") {
        throw new Error("Test failed: Sent status and messageId not updated correctly on creation");
      }
      console.log("[TEST] Case 2 passed: Initial invitation email sent and tracked successfully");

      // Test Case 3: Resend invitation successfully
      console.log("[TEST] Case 3: Resend invitation successfully");
      const newToken = "test-token-resend-1-" + Math.random().toString(36).substring(2, 7);
      await ctx.runMutation(internal.workspaceInvitations.updateResendSuccess, {
        id: invitationId,
        token: newToken,
        messageId: "mock-msg-id-2",
        smtpResponse: "250 OK (Resent)",
      });

      const resentInvitation = await ctx.runQuery(api.users.getInvitationByToken, { token: newToken });
      if (!resentInvitation) throw new Error("Test failed: Resent invitation not found under new token");
      if (resentInvitation.messageId !== "mock-msg-id-2" || resentInvitation.lastDeliveryStatus !== "sent") {
        throw new Error("Test failed: Resent message ID or status not updated");
      }
      if (!resentInvitation.resentAt) throw new Error("Test failed: resentAt timestamp not stored");
      console.log("[TEST] Case 3 passed: Resend updates database correctly");

      // Test Case 4: Multiple resends
      console.log("[TEST] Case 4: Multiple resends tracking");
      const finalToken = "test-token-resend-2-" + Math.random().toString(36).substring(2, 7);
      await ctx.runMutation(internal.workspaceInvitations.updateResendSuccess, {
        id: invitationId,
        token: finalToken,
        messageId: "mock-msg-id-3",
        smtpResponse: "250 OK (Resent 2)",
      });
      const finalInvitation = await ctx.runQuery(api.users.getInvitationByToken, { token: finalToken });
      if (!finalInvitation || finalInvitation.messageId !== "mock-msg-id-3" || finalInvitation.lastDeliveryStatus !== "sent") {
        throw new Error("Test failed: Multiple resends message ID or status not updated");
      }
      console.log("[TEST] Case 4 passed: Multiple resends update database and generate fresh URLs correctly");

      // Test Case 5: Expired invitation -> resend blocked
      console.log("[TEST] Case 5: Expired invitation resend blocked");
      await ctx.runMutation(internal.workspaceInvitations_test.setInviteExpired, { id: invitationId });
      
      const resendRes = await ctx.runQuery(api.workspaceInvitations.getInvitationForResend, {
        id: invitationId,
        callerWorkspaceId: testWorkspaceId,
      });
      if (!resendRes.error || !resendRes.error.includes("resend blocked")) {
        throw new Error("Test failed: Expired invitation resend was not blocked");
      }
      console.log("[TEST] Case 5 passed: Resend blocked on expired invitations");

      // Test Case 6: Accepted invitation -> resend blocked
      console.log("[TEST] Case 6: Accepted invitation resend blocked");
      await ctx.runMutation(internal.workspaceInvitations_test.setInviteAccepted, { id: invitationId });

      const resendRes2 = await ctx.runQuery(api.workspaceInvitations.getInvitationForResend, {
        id: invitationId,
        callerWorkspaceId: testWorkspaceId,
      });
      if (!resendRes2.error || !resendRes2.error.includes("resend blocked")) {
        throw new Error("Test failed: Accepted invitation resend was not blocked");
      }
      console.log("[TEST] Case 6 passed: Resend blocked on accepted invitations");

      console.log("=== ALL AUTOMATED TESTS PASSED SUCCESSFULLY ===");
      return { success: true, message: "All test cases passed." };
    } finally {
      console.log("[TEST] Cleaning up test environment...");
      await ctx.runMutation(internal.workspaceInvitations_test.cleanupTestEnv, {
        userId: testUserId,
        workspaceId: testWorkspaceId,
      });
    }
  },
});
