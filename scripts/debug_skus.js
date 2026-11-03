const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const lines = cat.split('\n');

const skuLines = [];
lines.forEach((l, idx) => {
  const m = l.match(/"sku":\s*"([^"]+)"/);
  if (m) skuLines.push({ line: idx + 1, sku: m[1] });
});

console.log('Total sku lines found in catalog.ts:', skuLines.length);
console.log('First 5 SKUs:', skuLines.slice(0, 5));
console.log('Last 5 SKUs:', skuLines.slice(-5));
if (skuLines.length > 215) {
  console.log('Around 220th SKU:', skuLines.slice(215, 225));
}
