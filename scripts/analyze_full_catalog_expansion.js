const fs = require('fs');
const path = require('path');

// Load manifest
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

// Load existing products
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const existingProducts = eval(match[1]);

console.log(`Existing products: ${existingProducts.length}`);
console.log(`Total supplier WebP images: ${webpManifest.length}`);

// Get all images currently mapped in existing products
const existingMappedImages = new Set();
existingProducts.forEach(p => {
  (p.images || []).forEach(img => {
    existingMappedImages.add(img);
  });
});

console.log(`Existing products image references: ${existingMappedImages.size}`);

