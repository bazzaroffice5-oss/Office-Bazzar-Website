const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim().replace(/;\s*$/, '');
const products = JSON.parse(block);

console.log('Manifest entries:', manifest.length);
console.log('Catalog products:', products.length);

// Let's find products that can gain alternate angle images from the supplier library
const enrichedProducts = [];

for (const p of products) {
  if (!p.images || p.images.length === 0) continue;

  const pName = p.name.toLowerCase();
  const sku = p.sku.toLowerCase();

  // Find images in manifest matching this product name or SKU
  const matchedAssets = manifest.filter(item => {
    if (item.webPath === 'N/A' || !item.webPath.endsWith('.webp')) return false;
    const fn = item.originalFilename.toLowerCase();
    return fn.includes(sku) || (pName.length > 5 && fn.includes(pName));
  });

  const currentImages = new Set(p.images);
  const newGalleries = [];
  matchedAssets.forEach(m => {
    if (!currentImages.has(m.webPath)) {
      newGalleries.push(m.webPath);
    }
  });

  if (newGalleries.length > 0) {
    enrichedProducts.push({
      sku: p.sku,
      name: p.name,
      currentCount: p.images.length,
      addedImages: newGalleries
    });
  }
}

console.log(`Products with potential gallery additions from supplier library: ${enrichedProducts.length}`);
enrichedProducts.slice(0, 10).forEach(e => {
  console.log(`[${e.sku}] ${e.name}: +${e.addedImages.length} images -> ${e.addedImages[0]}`);
});

