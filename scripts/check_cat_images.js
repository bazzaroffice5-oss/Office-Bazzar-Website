const fs = require('fs');
const path = require('path');

const c = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const verifiedList = JSON.parse(fs.readFileSync('scripts/final_verified_supplier_products.json', 'utf8'));
const verifiedSkuSet = new Set(verifiedList.map(x => x.sku));

const catSection = c.slice(0, c.indexOf('const RAW_PRODUCTS'));
const matches = [...catSection.matchAll(/imageUrl:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
console.log('Category section imageUrls:');

for (const m of matches) {
  const sku = path.basename(m, '.webp');
  const verified = verifiedSkuSet.has(sku);
  const exists = fs.existsSync(path.join('public', m));
  console.log(`${sku}: verified=${verified}, onDisk=${exists} (${m})`);
}

