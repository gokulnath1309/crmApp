const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'convex/users.ts');
let content = fs.readFileSync(usersPath, 'utf8');

const replacements = [
  { from: /companyId/g, to: 'workspaceId' },
  { from: /activeCompanyId/g, to: 'activeWorkspaceId' },
  { from: /by_companyId/g, to: 'by_workspaceId' },
  { from: /by_user_company/g, to: 'by_user_workspace' },
  { from: /api\.companies/g, to: 'api.workspaces' },
  { from: /internal\.companies/g, to: 'internal.workspaces' },
  { from: /callerCompanyId/g, to: 'callerWorkspaceId' },
  { from: /callerCompanyName/g, to: 'callerWorkspaceName' },
  { from: /memberships/g, to: 'workspaceMembers' },
  { from: /invitations/g, to: 'workspaceInvitations' },
];

for (const { from, to } of replacements) {
  content = content.replace(from, to);
}

fs.writeFileSync(usersPath, content, 'utf8');
console.log('Refactored convex/users.ts');
