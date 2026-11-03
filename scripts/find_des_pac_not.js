const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const regex = /\{\s*\"id\":\s*\"([^\"]+)\"[\s\S]*?\"name\":\s*\"([^\"]+)\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"/g;
let m;
while ((m = regex.exec(cat)) !== null) {
  const [_, id, name, sku] = m;
  if (sku.startsWith('OB-DES') || sku.startsWith('OB-PAC') || sku.startsWith('OB-NOT')) {
    console.log(`${sku.padEnd(16)} | ${name}`);
  }
}
