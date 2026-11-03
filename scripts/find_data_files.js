const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git' || e.name === 'Office Bazzar New Images') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      searchFiles(full);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (['.csv', '.xlsx', '.json', '.txt', '.pdf'].includes(ext)) {
        console.log(full);
      }
    }
  }
}

searchFiles(process.cwd());

