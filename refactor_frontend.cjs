const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

const replacements = [
  { from: /api\.companies/g, to: 'api.workspaces' },
  { from: /api\.memberships/g, to: 'api.workspaceMembers' },
  { from: /api\.invitations/g, to: 'api.workspaceInvitations' },
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const { from, to } of replacements) {
    if (content.match(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  // Handle activeCompanyId and companyId only if it relates to auth or workspace contexts
  // We'll cautiously replace `companyId` with `workspaceId` in variable names and JSX props
  if (content.includes('companyId')) {
    content = content.replace(/activeCompanyId/g, 'activeWorkspaceId');
    content = content.replace(/companyId/g, 'workspaceId');
    content = content.replace(/companyName/g, 'workspaceName');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
