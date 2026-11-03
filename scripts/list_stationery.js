const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8'));

const statFiles = inv.filter(i => i.relPath.includes('Stationery'));
console.log(`Total Stationery files: ${statFiles.length}`);
statFiles.forEach(f => console.log(f.fileName));

