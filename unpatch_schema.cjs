const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'convex/schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

// Remove companyId: v.optional(v.any()),
content = content.replace(/\s+companyId: v\.optional\(v\.any\(\)\),/g, '');

// Remove activeCompanyId: v.optional(v.any()),
content = content.replace(/\s+activeCompanyId: v\.optional\(v\.any\(\)\),/g, '');

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Reverted schema.ts to remove legacy fields');
