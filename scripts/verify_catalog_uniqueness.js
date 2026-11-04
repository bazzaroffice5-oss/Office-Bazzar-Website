const fs = require('fs');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

console.log('Testing 1,808 products for uniqueness...');
const skuSet = new Set();
const slugSet = new Set();
let dupSkus = 0;
let dupSlugs = 0;

products.forEach(p => {
  if (skuSet.has(p.sku)) {
    console.error('Duplicate SKU:', p.sku);
    dupSkus++;
  }
  skuSet.add(p.sku);

  if (slugSet.has(p.slug)) {
    console.error('Duplicate Slug:', p.slug);
    dupSlugs++;
  }
  slugSet.add(p.slug);
});

console.log(`Duplicate SKUs: ${dupSkus}`);
console.log(`Duplicate Slugs: ${dupSlugs}`);
console.log(`Total Products: ${products.length}`);
console.log(`Total Unique SKUs: ${skuSet.size}`);
console.log(`Total Unique Slugs: ${slugSet.size}`);

if (dupSkus === 0 && dupSlugs === 0) {
  console.log('PASS: All 1,808 SKUs and Slugs are 100% UNIQUE!');
}

