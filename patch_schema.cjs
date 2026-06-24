const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'convex/schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

// Insert companyId: v.optional(v.any()), right before workspaceId: v.optional(v.id("workspaces")),
content = content.replace(/workspaceId: v\.optional\(v\.id\("workspaces"\)\),/g, 'workspaceId: v.optional(v.id("workspaces")),\n    companyId: v.optional(v.any()),');

// For users table, insert activeCompanyId: v.optional(v.any()), right before activeWorkspaceId
content = content.replace(/activeWorkspaceId: v\.optional\(v\.id\("workspaces"\)\),/g, 'activeWorkspaceId: v.optional(v.id("workspaces")),\n    activeCompanyId: v.optional(v.any()),\n    companyId: v.optional(v.any()),');

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Patched schema.ts to include legacy fields temporarily');
