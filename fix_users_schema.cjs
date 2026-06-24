const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'convex/users.ts');
let content = fs.readFileSync(usersPath, 'utf8');

// fix schema insertions
content = content.replace(
  /const invitationId = await ctx.db.insert\("workspaceInvitations", \{\s+workspaceId: args.callerWorkspaceId,\s+email,\s+fullName: args.name.trim\(\),\s+role: args.role,\s+department: args.department,\s+jobTitle: args.jobTitle,\s+managerId: args.managerId,\s+invitedBy: args.callerUserId,\s+token: args.token,\s+permissions: args.permissions,\s+status: "pending",\s+emailStatus: "queued",\s+invitedAt: now,\s+expiresAt: now \+ 7 \* 24 \* 60 \* 60 \* 1000, \/\/ 7 days\s+createdAt: now,\s+\}\);/s,
  `const invitationId = await ctx.db.insert("workspaceInvitations", {
      workspaceId: args.callerWorkspaceId,
      email,
      role: args.role,
      department: args.department,
      invitedBy: args.callerUserId,
      inviteToken: args.token,
      status: "pending",
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: now,
    });`
);

content = content.replace(
  /const existingInvitation = await ctx.db\s+\.query\("workspaceInvitations"\)\s+\.withIndex\("by_company_email", \(q\) =>\s+q.eq\("workspaceId", args.callerWorkspaceId\).eq\("email", email\)\s+\)/s,
  `const existingInvitation = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_workspace_email", (q) =>
        q.eq("workspaceId", args.callerWorkspaceId).eq("email", email)
      )`
);

content = content.replace(
  /await ctx.db.insert\("workspaceMembers", \{\s+userId: currentUser._id,\s+workspaceId: invitation.workspaceId,\s+role: invitation.role,\s+department: invitation.department,\s+jobTitle: invitation.jobTitle,\s+managerId: invitation.managerId,\s+permissions: invitation.permissions,\s+isActive: true,\s+joinedAt: Date.now\(\),\s+createdAt: Date.now\(\),\s+\}\);/s,
  `await ctx.db.insert("workspaceMembers", {
        workspaceId: invitation.workspaceId,
        clerkUserId: currentUser.clerkId,
        userId: currentUser._id,
        role: invitation.role,
        department: invitation.department,
        status: "active",
        joinedAt: Date.now(),
      });`
);

content = content.replace(
  /await ctx.db.patch\(existingMembership._id, \{\s+role: invitation.role,\s+department: invitation.department,\s+jobTitle: invitation.jobTitle,\s+managerId: invitation.managerId,\s+permissions: invitation.permissions,\s+isActive: true,\s+joinedAt: Date.now\(\),\s+\}\);/s,
  `await ctx.db.patch(existingMembership._id, {
          role: invitation.role,
          department: invitation.department,
          status: "active",
          joinedAt: Date.now(),
        });`
);

content = content.replace(
  /if \(existingMembership.isActive === false\)/g,
  `if (existingMembership.status !== "active")`
);

content = content.replace(
  /acceptedByClerkId: currentUser.clerkId \|\| undefined,/g,
  ``
);

content = content.replace(
  /acceptedAt: Date.now\(\),/g,
  ``
);

fs.writeFileSync(usersPath, content, 'utf8');
console.log('Fixed users schema usages');
