const fs = require('fs');

const catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');

const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim();
// Strip trailing semicolon if present
const cleanBlock = block.replace(/;\s*$/, '');

const products = JSON.parse(cleanBlock);
console.log('Total products loaded from catalog.ts:', products.length);

let mappedCount = 0;
let placeholderCount = 0;
let invalidPaths = [];

for (const p of products) {
  const imgs = p.images || [];
  if (imgs.length === 0) {
    placeholderCount++;
  } else {
    for (const img of imgs) {
      if (!img.startsWith('/assets/products/catalog_2026/')) {
        invalidPaths.push({ sku: p.sku, img, reason: 'Does not start with /assets/products/catalog_2026/' });
      } else {
        const localPath = 'public' + img;
        if (!fs.existsSync(localPath)) {
          invalidPaths.push({ sku: p.sku, img, reason: 'File does not exist on disk' });
        }
      }
    }
    mappedCount++;
  }
}

console.log('✅ Successfully Mapped Products:', mappedCount);
console.log('ℹ️ Awaiting Photography (Placeholder):', placeholderCount);
console.log('❌ Invalid or Non-existent Image Paths:', invalidPaths.length);
if (invalidPaths.length > 0) {
  console.log('Invalid details:', invalidPaths);
}
