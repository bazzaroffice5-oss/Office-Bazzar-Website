const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8')).filter(i => i.isImage && !i.isCorrupted);

const targets = [
  { sku: 'OB-024', query: 'Cute Star' },
  { sku: 'OB-080', query: 'Flat Microfiber' },
  { sku: 'OB-084', query: 'Microfiber Strip' },
  { sku: 'OB-105', query: 'Holder' },
  { sku: 'OB-106', query: 'Lobby' },
  { sku: 'OB-141', query: 'Platform' },
  { sku: 'OB-142', query: 'Janitor' },
  { sku: 'OB-143', query: 'Double Bucket' },
  { sku: 'OB-COV-09', query: 'Latex' },
  { sku: 'OB-COV-26', query: 'Queue' }
];

targets.forEach(t => {
  const matches = inv.filter(i => (i.fileName + ' ' + i.relPath).toLowerCase().includes(t.query.toLowerCase()));
  console.log(`\nSKU ${t.sku} (Query: ${t.query}): ${matches.length} matches:`);
  matches.slice(0, 5).forEach(m => console.log('  ', m.relPath));
});

