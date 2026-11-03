const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const rawStart = cat.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = cat.indexOf('export const INITIAL_PRODUCTS: Product[] =');
const rawStr = cat.slice(rawStart, rawEnd);

const blocks = rawStr.split(/\n\s*\{\s*\n\s*"id":/);
const inactive = [];

for (let i = 1; i < blocks.length; i++) {
  const b = '{\n    "id":' + blocks[i];
  const skuM = b.match(/"sku":\s*"([^"]+)"/);
  const nameM = b.match(/"name":\s*"([^"]+)"/);
  const activeM = b.match(/"isActive":\s*(\w+)/);

  if (activeM && activeM[1] === 'false') {
    inactive.push({ sku: skuM ? skuM[1] : '', name: nameM ? nameM[1] : '' });
  }
}

console.log('Total inactive products:', inactive.length);
inactive.forEach(p => console.log(`   [${p.sku}] ${p.name}`));

