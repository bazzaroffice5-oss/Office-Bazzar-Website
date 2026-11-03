const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8'));

const chemFiles = inv.filter(i => i.relPath.includes('Chemical Product'));
console.log(`Total Chemical Product files: ${chemFiles.length}`);
chemFiles.slice(0, 40).forEach(f => console.log(f.fileName));

