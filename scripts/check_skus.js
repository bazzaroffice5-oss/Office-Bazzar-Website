const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const rawStart = cat.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = cat.indexOf('export const INITIAL_PRODUCTS: Product[] =');
const rawStr = cat.slice(rawStart, rawEnd);

const blocks = rawStr.split(/\n\s*\{\s*\n\s*"id":/);
const prods = [];
for (let i = 1; i < blocks.length; i++) {
  const b = '{\n    "id":' + blocks[i];
  const idM = b.match(/"id":\s*"([^"]+)"/);
  const skuM = b.match(/"sku":\s*"([^"]+)"/);
  const nameM = b.match(/"name":\s*"([^"]+)"/);
  const activeM = b.match(/"isActive":\s*(\w+)/);
  prods.push({
    id: idM ? idM[1] : '',
    sku: skuM ? skuM[1] : '',
    name: nameM ? nameM[1] : '',
    isActive: activeM ? activeM[1] === 'true' : true
  });
}

console.log('Total products parsed:', prods.length);
const skuCounts = {};
for (const p of prods) {
  skuCounts[p.sku] = (skuCounts[p.sku] || 0) + 1;
}
const dups = Object.entries(skuCounts).filter(([s, c]) => c > 1);
console.log('Duplicate SKUs:', dups);

// Also check ID uniqueness
const idCounts = {};
for (const p of prods) {
  idCounts[p.id] = (idCounts[p.id] || 0) + 1;
}
const idDups = Object.entries(idCounts).filter(([id, c]) => c > 1);
console.log('Duplicate IDs:', idDups);

