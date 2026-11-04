const fs = require('fs');

const catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim().replace(/;\s*$/, '');
const products = JSON.parse(block);

const placeholders = products.filter(p => !p.images || p.images.length === 0);
console.log('Total placeholders count:', placeholders.length);

const byCat = {};
placeholders.forEach(p => {
  const cat = p.categoryName || 'Unknown';
  if (!byCat[cat]) byCat[cat] = [];
  byCat[cat].push({ sku: p.sku, name: p.name, sub: p.subcategoryName });
});

for (const [cat, prods] of Object.entries(byCat)) {
  console.log(`\n=== Category: ${cat} (${prods.length}) ===`);
  prods.forEach(p => console.log(`  [${p.sku}] ${p.name} | ${p.sub}`));
}

