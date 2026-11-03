const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

function findProductBySku(sku) {
  const idx = cat.indexOf(`"sku": "${sku}"`);
  if (idx === -1) return null;
  const startObj = cat.lastIndexOf('{\n    "id":', idx);
  const endObj = cat.indexOf('\n  },', idx);
  return cat.slice(startObj, endObj + 4);
}

console.log('=== Kangaro Stapler: OB-STA-1009 ===');
console.log(findProductBySku('OB-STA-1009'));

console.log('\n=== Tissue Paper: OB-029 or other ===');
console.log(findProductBySku('OB-029'));
