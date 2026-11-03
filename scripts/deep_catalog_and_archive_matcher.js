const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/supplier_inventory_complete.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);
const catalogMapping = JSON.parse(fs.readFileSync('scripts/generation_results.json', 'utf8'));

// Tokenizer & normalization helpers
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getTokens(str) {
  return normalize(str).split(/\s+/).filter(t => t.length > 2);
}

// Map existing catalogue products
const catalogProducts = catalogMapping.map(p => ({
  sku: p.sku,
  name: p.name,
  brand: p.brand,
  category: p.category,
  currentPrimarySource: p.sourceFile,
  newImageRelative: p.newImageRelative,
  migrationSource: p.migrationSource,
  galleryImages: []
}));

// Build lookup for primary sources
const primarySourcesSet = new Set(
  catalogMapping
    .map(p => p.sourceFile)
    .filter(Boolean)
    .map(p => p.replace(/\\/g, '/'))
);

// Group valid supplier images by base subject/product to detect multiple angles
// Angle indicators:
const angleKeywords = [
  'front', 'back', 'side', 'top', 'rear', 'angle', 'angled', 'perspective', 
  'close-up', 'closeup', 'inside', 'open', 'closed', 'infographic', 
  'stacked', 'pair', 'trio', 'row', 'bottom', 'display', 'view'
];

// Let's analyze how supplier filenames group together
// E.g.: "Equal Foldable Platform Trolley 200kg Blue Front View.jpg"
//       "Equal Foldable Platform Trolley 200kg Blue Back View.jpg"
//       "Equal Foldable Platform Trolley 200kg Blue Side View.jpg"
//       "Equal Foldable Platform Trolley 200kg Blue Underside Base And Castor Wheels.jpg"

const assignedSupplierImages = new Map(); // relPath -> { sku, role: 'PRIMARY' | 'ALTERNATE_ANGLE' }

// First: Mark existing primary assignments from the 2,369 package
for (const p of catalogProducts) {
  if (p.migrationSource === 'Supplier_Package_2369') {
    const rel = p.currentPrimarySource.replace(/\\/g, '/');
    const matched = validImages.find(img => img.relPath.toLowerCase() === rel.toLowerCase() || rel.toLowerCase().endsWith(img.relPath.toLowerCase()));
    if (matched) {
      assignedSupplierImages.set(matched.relPath, {
        sku: p.sku,
        productName: p.name,
        role: 'PRIMARY_IMAGE'
      });
      p.matchedInventoryPath = matched.relPath;
    }
  }
}

console.log(`Initial primary supplier images assigned: ${assignedSupplierImages.size}`);

// Now find alternate angles for each product in the catalogue
const multipleAnglesList = [];

for (const p of catalogProducts) {
  const primaryRel = p.matchedInventoryPath;
  if (!primaryRel) continue;

  const primaryBase = path.basename(primaryRel, path.extname(primaryRel));
  const primaryDir = path.dirname(primaryRel);

  // Extract core product subject by stripping angle keywords and numbers
  let coreName = primaryBase;
  for (const kw of angleKeywords) {
    const re = new RegExp(`\\b${kw}\\b`, 'gi');
    coreName = coreName.replace(re, '');
  }
  coreName = coreName.replace(/\(\d+\)/g, '').replace(/\b\d+\b/g, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  const coreTokens = getTokens(coreName);
  if (coreTokens.length < 2) continue;

  // Search candidate images in the same folder or nearby
  const candidates = validImages.filter(img => {
    if (assignedSupplierImages.has(img.relPath)) return false; // already assigned
    const imgDir = path.dirname(img.relPath);
    if (imgDir !== primaryDir && !imgDir.startsWith(primaryDir) && !primaryDir.startsWith(imgDir)) return false;

    const imgBase = path.basename(img.relPath, path.extname(img.relPath));
    const imgTokens = getTokens(imgBase);

    // Check if it shares major tokens
    const common = coreTokens.filter(t => imgTokens.includes(t));
    const overlapRatio = common.length / coreTokens.length;

    return overlapRatio >= 0.75;
  });

  if (candidates.length > 0) {
    // Add up to 3 best alternate angles
    const selectedAlts = candidates.slice(0, 3);
    for (let idx = 0; idx < selectedAlts.length; idx++) {
      const alt = selectedAlts[idx];
      assignedSupplierImages.set(alt.relPath, {
        sku: p.sku,
        productName: p.name,
        role: `ALTERNATE_ANGLE_${idx + 1}`
      });

      p.galleryImages.push({
        angleIndex: idx + 1,
        relPath: alt.relPath,
        fileName: alt.fileName,
        sizeKb: alt.sizeKb,
        width: alt.width,
        height: alt.height
      });

      multipleAnglesList.push({
        sku: p.sku,
        productName: p.name,
        category: p.category,
        primaryImage: primaryRel,
        alternateImage: alt.relPath,
        alternateFileName: alt.fileName,
        detectedAngle: alt.fileName.replace(primaryBase, '').trim() || `Angle ${idx + 1}`
      });
    }
  }
}

console.log(`Total alternate angle images matched to existing catalogue: ${multipleAnglesList.length}`);

// Identify Unassigned Supplier Images -> Proposed New Products & Catalog Extension Candidates
const proposedNewProducts = [];
const nonProductOrSpecialAssets = [];

for (const img of validImages) {
  if (assignedSupplierImages.has(img.relPath)) continue;

  const fn = img.fileName.toLowerCase();
  const folder = img.folder;

  // Check if non-product/collages/infographics
  if (folder.toLowerCase() === 'collage' || fn.includes('collage') || fn.includes('infographic') || fn.includes('specifications')) {
    nonProductOrSpecialAssets.push({
      relPath: img.relPath,
      folder: img.folder,
      fileName: img.fileName,
      sizeKb: img.sizeKb,
      type: 'COLLAGE_OR_INFOGRAPHIC'
    });
    continue;
  }

  // Otherwise, it is a genuine supplier product photo available for future catalog expansion!
  proposedNewProducts.push({
    relPath: img.relPath,
    folder: img.folder,
    fileName: img.fileName,
    suggestedCategory: folder,
    dimensions: `${img.width}x${img.height}`,
    sizeKb: img.sizeKb,
    status: 'PROPOSED_NEW_SUPPLIER_PRODUCT'
  });
}

console.log(`Proposed new supplier products: ${proposedNewProducts.length}`);
console.log(`Collage / infographic assets: ${nonProductOrSpecialAssets.length}`);

fs.writeFileSync('scripts/catalog_with_gallery_images.json', JSON.stringify(catalogProducts, null, 2), 'utf8');
fs.writeFileSync('scripts/multiple_angles_found.json', JSON.stringify(multipleAnglesList, null, 2), 'utf8');
fs.writeFileSync('scripts/proposed_new_products.json', JSON.stringify(proposedNewProducts, null, 2), 'utf8');
fs.writeFileSync('scripts/non_product_or_special_assets.json', JSON.stringify(nonProductOrSpecialAssets, null, 2), 'utf8');

console.log('Deep catalog matching complete!');

