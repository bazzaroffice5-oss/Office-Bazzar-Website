const fs = require('fs');
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const skus = ['OB-BOA-1046', 'OB-CLE-1091', 'OB-COM-1036', 'OB-COM-1041'];
for (const sku of skus) {
  const regex = new RegExp(`"sku":\\s*"${sku}"[\\s\\S]*?"images":\\s*\\[\\s*"([^"]+)"`, 'i');
  const m = content.match(regex);
  if (m) console.log(sku, '->', m[1]);
  else console.log(sku, 'NOT FOUND');
}

