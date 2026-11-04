const fs = require('fs');
const path = require('path');

const catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim().replace(/;\s*$/, '');
const products = JSON.parse(block);

const referencedImages = new Set();
products.forEach(p => {
  (p.images || []).forEach(img => referencedImages.add(img));
});

// Also check category images in catalog.ts
const catImgs = catContent.match(/\/assets\/products\/catalog_2026\/[^\s"',]+/g) || [];
catImgs.forEach(img => referencedImages.add(img));

console.log('Total referenced WebP images in catalog.ts:', referencedImages.size);

const diskFiles = fs.readdirSync('public/assets/products/catalog_2026');
console.log('Total WebP files on disk in catalog_2026:', diskFiles.length);

const unreferenced = [];
for (const f of diskFiles) {
  const webPath = '/assets/products/catalog_2026/' + f;
  if (!referencedImages.has(webPath)) {
    unreferenced.push(f);
  }
}

console.log('Unreferenced WebP files:', unreferenced.length);
if (unreferenced.length > 0) {
  console.log('Sample unreferenced:', unreferenced.slice(0, 10));
}

