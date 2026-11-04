const fs = require('fs');
const path = require('path');

function searchJsonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (['node_modules', '.next', '.git', 'Office Bazzar New Images'].includes(entry.name)) continue;
    if (entry.isDirectory()) {
      searchJsonFiles(full);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('/assets/products/') && !content.includes('/assets/products/catalog_2026/')) {
        console.log('Found old /assets/products/ in JSON:', full);
      } else if (content.includes('/images/products')) {
        console.log('Found /images/products in JSON:', full);
      }
    }
  }
}

searchJsonFiles('d:/Office Bazzar Website');

