const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const regex = /"id":\s*"([^"]+)",[\s\S]*?"slug":\s*"([^"]+)",[\s\S]*?"sku":\s*"([^"]+)"/g;
let m;
while ((m = regex.exec(cat)) !== null) {
  if (m[2].includes('tissue') || m[2].includes('kangaro')) {
    console.log(`ID: ${m[1]} | SKU: ${m[3]} | SLUG: ${m[2]}`);
  }
}
