const fs = require('fs');
const path = require('path');

// 1. Load manifest and existing catalog
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const existingProducts = eval(match[1]);

console.log(`Loaded ${existingProducts.length} existing products, ${webpManifest.length} supplier images.`);

// Normalize helpers
const VIEW_PHRASES = [
  'front and back view', 'front and back', 'front and rear view', 'front and rear',
  'closed and open views', 'closed and open', 'front view', 'back view', 'side view',
  'top view', 'rear view', 'angled view', 'isometric view', 'diagonal view',
  'standing view', 'full view', 'close-up view', 'closeup view', 'perspective view',
  'flat view', 'whatsapp view', 'inside view', 'outdoor view', 'display view',
  'with packaging box', 'with product box', 'with 100 pcs box', 'with 50 pcs box',
  'with 12 pcs box', 'with box', 'with pouch', 'with refill', 'with clips',
  'pack of 10 boxes shrink wrapped', 'shrink wrapped close-up', 'shrink wrapped',
  'on digital weighing scale', 'on adjustable floor tripod stand', 'mounted on wall',
  'set of 4 colors', 'set of 4 piece', 'set of 4', 'set of 3', 'set of 5',
  '4-piece set', '5-piece set', '3-piece set', '2-piece set',
  'front', 'back', 'side', 'top', 'rear', 'angled', 'angle', 'closed', 'open',
  'inside', 'closeup', 'close up', 'pair', 'trio', 'stack', 'row', 'collage'
];

function cleanTitle(filename) {
  let name = filename.replace(/\.webp$|\.jpg$|\.jpeg$|\.png$/i, '');
  name = name.replace(/\(\d+\)/g, '').trim();
  name = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

  for (const phrase of VIEW_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    name = name.replace(regex, ' ');
  }

  name = name.replace(/\b\d\b/g, ' ').replace(/\s+/g, ' ').trim();
  // Capitalize words
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// 2. Identify which images belong to existing products
// We already have 576 images mapped to existing products from previous step
const mappedToExisting = new Map(); // webPath -> info

webpManifest.forEach(img => {
  if (img.sku && img.sku !== 'N/A' && img.status === 'MAPPED_TO_PRODUCT') {
    mappedToExisting.set(img.webPath, {
      sku: img.sku,
      productName: img.productName,
      category: img.category,
      role: img.role === 'MAPPED_PRIMARY' ? 'Primary Image' : 'Gallery Image',
      type: 'Existing Product',
      status: 'Integrated with Existing Catalogue'
    });
  }
});

console.log(`Images mapped to existing products: ${mappedToExisting.size}`);

// 3. Process remaining images to form distinct new products
const unmappedImages = webpManifest.filter(img => !mappedToExisting.has(img.webPath));
console.log(`Images available for new product identification: ${unmappedImages.length}`);

// Group unmapped by Folder + Clean Title
const newProductGroups = new Map();

unmappedImages.forEach(img => {
  const title = cleanTitle(img.originalFilename);
  const key = `${img.originalFolder}:::${title}`;

  if (!newProductGroups.has(key)) {
    newProductGroups.set(key, {
      folder: img.originalFolder,
      title: title || `${img.originalFolder} Product`,
      images: []
    });
  }
  newProductGroups.get(key).images.push(img);
});

console.log(`Identified ${newProductGroups.size} distinct new product candidates.`);

