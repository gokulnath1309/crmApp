const fs = require('fs');
const path = require('path');

const filesToRefactor = [
  'convex/leads.ts',
  'convex/contacts.ts',
  'convex/deals.ts',
  'convex/tasks.ts',
  'convex/notes.ts',
  'convex/notifications.ts',
  'convex/activities.ts',
  'convex/teams.ts',
  'convex/search.ts',
  'convex/analytics.ts',
];

const replacements = [
  { from: /companyId/g, to: 'workspaceId' },
  { from: /activeCompanyId/g, to: 'activeWorkspaceId' },
  { from: /by_companyId/g, to: 'by_workspaceId' },
  { from: /by_user_company/g, to: 'by_user_workspace' },
  { from: /api\.companies/g, to: 'api.workspaces' },
  { from: /internal\.companies/g, to: 'internal.workspaces' },
];

for (const relPath of filesToRefactor) {
  const fullPath = path.join(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const { from, to } of replacements) {
      content = content.replace(from, to);
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Refactored ${relPath}`);
  } else {
    console.warn(`File not found: ${relPath}`);
  }
}
