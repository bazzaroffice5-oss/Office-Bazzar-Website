const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const existingProducts = eval(match[1]);

// Already mapped images in catalog.ts
const existingWebPaths = new Set();
existingProducts.forEach(p => {
  (p.images || []).forEach(img => existingWebPaths.add(img));
});

// Also check manifest mapped status
const unmappedImages = webpManifest.filter(m => {
  return m.sku === 'N/A' || m.status === 'APPROVED_UNUSED_IMAGE' || m.status === 'PENDING_MANUAL_MATCHING';
});

console.log(`Total unmapped images to process: ${unmappedImages.length}`);

// Folder breakdown of unmapped images
const unmappedByFolder = {};
unmappedImages.forEach(img => {
  unmappedByFolder[img.originalFolder] = (unmappedByFolder[img.originalFolder] || 0) + 1;
});
console.log('Unmapped by folder:', unmappedByFolder);

