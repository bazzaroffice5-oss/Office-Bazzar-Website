const fs = require('fs');
const path = require('path');

// Load products
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

// Load supplier manifest
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

console.log(`Loaded ${products.length} products and ${webpManifest.length} supplier webp assets.`);

function clean(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\.webp$|\.jpg$|\.jpeg$|\.png$/i, '')
    .replace(/\(\d+\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'and', 'with', 'the', 'for', 'box', 'set', 'view', 'front', 'back', 'side',
  'top', 'angle', 'pcs', 'pack', 'pair', 'trio', 'row', 'models', 'item',
  'items', 'high', 'quality', 'office', 'bazzar', 'officebazzar', 'product',
  'products', 'closed', 'open', 'inside', 'closeup', 'close', 'stacked'
]);

function getTokens(str) {
  return clean(str).split(/\s+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

// Track images for each product: { primary: string, gallery: Set<string>, sources: [] }
const productMap = new Map();

products.forEach(p => {
  productMap.set(p.sku, {
    product: p,
    primary: (p.images && p.images[0]) || null,
    images: new Set(p.images || []),
    matchedAssets: []
  });
});

// Track status of each supplier asset
const assetStatus = new Map(); // webPath -> { role, sku, productName, category, matchedVia, status }

// 1. First, trace existing 399 catalog_2026 images to their exact supplier library asset
const catToSource = new Map();
function reg(catWebp, origSource, sku) {
  if (!catWebp || !origSource) return;
  const pName = path.basename(catWebp);
  const norm = origSource.replace(/\\/g, '/').replace(/^Office Bazzar New Images\//i, '').replace(/^Product Photo \(4-3-26\)\//i, '');
  catToSource.set(pName, { norm, sku });
}

if (fs.existsSync('scripts/office_bazzar_active_catalog_manifest.json')) {
  JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8')).forEach(item => {
    reg(item.primaryRelative, item.primarySource, item.sku);
    (item.altRelatives || []).forEach((ar, idx) => reg(ar, item.altSources[idx], item.sku));
  });
}
if (fs.existsSync('scripts/applied_new_mappings.json')) {
  JSON.parse(fs.readFileSync('scripts/applied_new_mappings.json', 'utf8')).forEach(item => reg(item.webpFilename, item.sourceFile, item.sku));
}
if (fs.existsSync('scripts/process_and_map_batch_16.js')) {
  const m1 = fs.readFileSync('scripts/process_and_map_batch_16.js', 'utf8').match(/const MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m1) eval(m1[1]).forEach(x => x.images.forEach(i => reg(i.out, i.file, x.sku)));
}
if (fs.existsSync('scripts/process_and_map_batch_safety.js')) {
  const m2 = fs.readFileSync('scripts/process_and_map_batch_safety.js', 'utf8').match(/const MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m2) eval(m2[1]).forEach(x => x.images.forEach(i => reg(i.out, i.file, x.sku)));
}
if (fs.existsSync('scripts/apply_permanent_live_fix.js')) {
  const m3 = fs.readFileSync('scripts/apply_permanent_live_fix.js', 'utf8').match(/const NEW_MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m3) eval(m3[1]).forEach(x => x.images.forEach(i => reg(i.out, i.file, x.sku)));
}
if (fs.existsSync('scripts/process_5_new_images.js')) {
  const m4 = fs.readFileSync('scripts/process_5_new_images.js', 'utf8').match(/const MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m4) eval(m4[1]).forEach(x => reg(x.out, x.src, x.sku));
}

// Mark direct source matches
webpManifest.forEach(sImg => {
  const sRel = `${sImg.originalFolder}/${sImg.originalFilename}`.toLowerCase();
  const sBase = sImg.originalFilename.toLowerCase();

  for (const [catWebp, info] of catToSource.entries()) {
    const infoRel = info.norm.toLowerCase();
    const infoBase = path.basename(info.norm).toLowerCase();

    if (infoRel === sRel || infoBase === sBase) {
      const prod = products.find(p => p.sku === info.sku);
      if (!prod) continue;

      const isPrimary = !catWebp.includes('_alt') && !catWebp.includes('-alt');
      const role = isPrimary ? 'MAPPED_PRIMARY' : 'MAPPED_GALLERY';

      assetStatus.set(sImg.webPath, {
        webPath: sImg.webPath,
        originalFilename: sImg.originalFilename,
        originalFolder: sImg.originalFolder,
        sku: info.sku,
        productName: prod.name,
        category: prod.categoryName || prod.categoryId,
        role,
        matchedVia: 'Verified Catalog Master Source',
        status: 'MAPPED'
      });

      const pEntry = productMap.get(info.sku);
      if (pEntry) {
        pEntry.matchedAssets.push(sImg.webPath);
      }
      break;
    }
  }
});

console.log(`Direct verified source matches: ${assetStatus.size}`);

// Fix known anomalies (e.g. OB-069 Stainless Steel Pedal Dustbin was pointing to Aluminium Stick)
// Let's find genuine Stainless Steel Pedal Dustbin images in Dustbin folder
const pedalDustbinAssets = webpManifest.filter(m => m.originalFolder === 'Dustbin' && m.originalFilename.toLowerCase().includes('stainless steel pedal dustbin'));
if (pedalDustbinAssets.length > 0) {
  const ob069 = productMap.get('OB-069');
  if (ob069) {
    // assign genuine pedal dustbin as primary and gallery
    console.log(`Found ${pedalDustbinAssets.length} authentic photos for OB-069 Stainless Steel Pedal Dustbin!`);
    pedalDustbinAssets.forEach((pda, idx) => {
      assetStatus.set(pda.webPath, {
        webPath: pda.webPath,
        originalFilename: pda.originalFilename,
        originalFolder: pda.originalFolder,
        sku: 'OB-069',
        productName: ob069.product.name,
        category: ob069.product.categoryName || ob069.product.categoryId,
        role: idx === 0 ? 'MAPPED_PRIMARY' : 'MAPPED_GALLERY',
        matchedVia: 'Authentic Specification & Product Type Match (SS Pedal Dustbin)',
        status: 'MAPPED'
      });
      ob069.images.add(pda.webPath);
    });
  }
}

// 2. High-precision semantic & folder matcher for alternate angles & gallery expansions
const FOLDER_CATEGORY_RULES = {
  'Dustbin': ['dustbins-waste-handling'],
  'Dustbin JPG': ['dustbins-waste-handling'],
  'Garbage Bag': ['dustbins-waste-handling'],
  'Brooms And Sticks': ['mops-floor-wipers', 'cleaning-tools'],
  'Wiper': ['mops-floor-wipers'],
  'Mop': ['mops-floor-wipers'],
  'Cleaning Brush': ['cloths-scrubbers-brushes'],
  'Cloth': ['cloths-scrubbers-brushes'],
  'Scotch Bright and Scrubber': ['cloths-scrubbers-brushes'],
  'Dispenser': ['washroom-dispensers'],
  'Tissue Product': ['tissue-papers-rolls'],
  'Chemical Product': ['cleaning-chemicals'],
  'Room Spray': ['air-fresheners-care'],
  'Hit and Disinfectant Spray': ['air-fresheners-care', 'cleaning-chemicals'],
  'Sani Cubes': ['air-fresheners-care'],
  'Urinal Screen': ['air-fresheners-care'],
  'Hygenic Tools and Trolly': ['cleaning-equipment-trolleys'],
  'Packing Product': ['bopp-packaging-tapes', 'protective-packaging-cushioning', 'box-strapping-banding', 'adhesives-packaging-tools'],
  'Stationery': ['files-office-organization', 'desk-stationery', 'paper-products', 'boards-visual-display', 'writing-instruments', 'currency-counting-machines']
};

let additionalGalleryMatches = 0;

webpManifest.forEach(sImg => {
  if (assetStatus.has(sImg.webPath)) return; // already mapped

  const fn = sImg.originalFilename;
  const folder = sImg.originalFolder;
  const imgTokens = getTokens(fn);
  if (imgTokens.length < 2) return;

  // Candidate products must match folder rules
  const allowedSubs = FOLDER_CATEGORY_RULES[folder] || [];

  let bestProd = null;
  let bestScore = 0;
  let bestCommon = [];

  products.forEach(p => {
    // Check if subcategory matches folder rule
    const pSub = p.subcategoryId || '';
    if (allowedSubs.length > 0 && !allowedSubs.includes(pSub) && folder !== 'Mix' && folder !== 'New folder') {
      return;
    }

    const prodTokens = getTokens(p.name);
    if (prodTokens.length === 0) return;

    // Check shared tokens
    const common = prodTokens.filter(t => imgTokens.includes(t));
    if (common.length >= 2) {
      // Overlap ratio relative to product tokens
      const ratio = common.length / prodTokens.length;
      if (ratio >= 0.6 && ratio > bestScore) {
        bestScore = ratio;
        bestProd = p;
        bestCommon = common;
      }
    }
  });

  if (bestProd && bestScore >= 0.6) {
    additionalGalleryMatches++;
    const pEntry = productMap.get(bestProd.sku);

    const isFirstImage = !pEntry.primary && pEntry.images.size === 0;
    const role = isFirstImage ? 'MAPPED_PRIMARY' : 'MAPPED_GALLERY';

    assetStatus.set(sImg.webPath, {
      webPath: sImg.webPath,
      originalFilename: sImg.originalFilename,
      originalFolder: sImg.originalFolder,
      sku: bestProd.sku,
      productName: bestProd.name,
      category: bestProd.categoryName || bestProd.categoryId,
      role,
      matchedVia: `High-Precision Keyword & Category Match (${bestCommon.join(', ')})`,
      status: 'MAPPED',
      score: bestScore
    });

    pEntry.images.add(sImg.webPath);
  }
});

console.log(`Additional gallery matches: ${additionalGalleryMatches}`);
console.log(`Total mapped supplier images to products: ${assetStatus.size}`);

// 3. Classify all remaining images
let approvedUnused = 0;
let pendingReview = 0;

webpManifest.forEach(sImg => {
  if (assetStatus.has(sImg.webPath)) return;

  const fn = sImg.originalFilename.toLowerCase();
  const folder = sImg.originalFolder.toLowerCase();

  const isCollageOrComposite = folder === 'collage' || 
    fn.includes('collage') || 
    fn.includes('infographic') || 
    fn.includes('whatsapp') || 
    fn.includes('unnamed') ||
    fn.includes('chart') ||
    fn.includes('spec');

  if (isCollageOrComposite) {
    pendingReview++;
    assetStatus.set(sImg.webPath, {
      webPath: sImg.webPath,
      originalFilename: sImg.originalFilename,
      originalFolder: sImg.originalFolder,
      sku: null,
      productName: null,
      category: null,
      role: 'PENDING_INTERNAL_REVIEW',
      matchedVia: 'Unmatched Composite/Collage Graphic',
      status: 'PENDING_REVIEW'
    });
  } else {
    approvedUnused++;
    assetStatus.set(sImg.webPath, {
      webPath: sImg.webPath,
      originalFilename: sImg.originalFilename,
      originalFolder: sImg.originalFolder,
      sku: null,
      productName: null,
      category: null,
      role: 'APPROVED_UNUSED_SUPPLIER_PHOTO',
      matchedVia: 'Authentic Supplier Product Photograph (Uncatalogued SKU / Future Catalogue Expansion)',
      status: 'APPROVED_UNUSED'
    });
  }
});

console.log(`Approved Unused Supplier Photos: ${approvedUnused}`);
console.log(`Pending Internal Review: ${pendingReview}`);
console.log(`Grand Total Accounting: ${assetStatus.size} / ${webpManifest.length}`);

console.log('\n========================================');
console.log('--- BREAKDOWN BY CATEGORY (MAPPED ASSETS) ---');
const catAssets = {};
for (const [wp, info] of assetStatus.entries()) {
  if (info.status === 'MAPPED') {
    const c = info.category || 'Uncategorized';
    catAssets[c] = (catAssets[c] || 0) + 1;
  }
}
console.log(catAssets);

console.log('\n--- BREAKDOWN BY ROLE ---');
let primaryCount = 0;
let galleryCount = 0;
for (const [wp, info] of assetStatus.entries()) {
  if (info.role === 'MAPPED_PRIMARY') primaryCount++;
  else if (info.role === 'MAPPED_GALLERY') galleryCount++;
}
console.log('Primary images mapped:', primaryCount);
console.log('Gallery images mapped:', galleryCount);
console.log('Approved unused supplier photos:', approvedUnused);
console.log('Pending internal review:', pendingReview);

console.log('\n--- PRODUCTS BREAKDOWN ---');
let prodsWithImages = 0;
let prodsMultiImage = 0;
let prodsPlaceholder = 0;

const galleryCounts = {};

products.forEach(p => {
  const pEntry = productMap.get(p.sku);
  const totalImgs = pEntry.images.size;
  galleryCounts[totalImgs] = (galleryCounts[totalImgs] || 0) + 1;
  if (totalImgs > 0) prodsWithImages++;
  else prodsPlaceholder++;
  if (totalImgs > 1) prodsMultiImage++;
});

console.log('Products with at least 1 image:', prodsWithImages);
console.log('Products with multi-image gallery (>1):', prodsMultiImage);
console.log('Products with placeholder (0 images):', prodsPlaceholder);
console.log('Image distribution across 383 products:', galleryCounts);
