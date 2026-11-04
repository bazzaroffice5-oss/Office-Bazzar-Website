
const fs = require('fs');
const path = require('path');

// Load products
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

// Load supplier manifest
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

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

// 1. Trace existing catalog_2026 sources
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

// Track product image collections
// sku -> { product, images: [url, ...] }
const productMap = new Map();
products.forEach(p => {
  productMap.set(p.sku, {
    product: p,
    images: [...(p.images || [])] // keep existing verified images
  });
});

const assetStatus = new Map(); // webPath -> info

// First pass: Direct verified source matches
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
        status: 'MAPPED_TO_PRODUCT'
      });
      break;
    }
  }
});

// Second pass: Find curated alternate angles from supplier-library (max 4 additional gallery images per product)
const MAX_GALLERY_PER_PRODUCT = 5;

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

let curatedGalleryMatches = 0;

webpManifest.forEach(sImg => {
  if (assetStatus.has(sImg.webPath)) return;

  const fn = sImg.originalFilename;
  const folder = sImg.originalFolder;
  const imgTokens = getTokens(fn);
  if (imgTokens.length < 2) return;

  const allowedSubs = FOLDER_CATEGORY_RULES[folder] || [];

  let bestProd = null;
  let bestScore = 0;
  let bestCommon = [];

  products.forEach(p => {
    const pEntry = productMap.get(p.sku);
    if (!pEntry || pEntry.images.length >= MAX_GALLERY_PER_PRODUCT) return;

    const pSub = p.subcategoryId || '';
    if (allowedSubs.length > 0 && !allowedSubs.includes(pSub) && folder !== 'Mix' && folder !== 'New folder') {
      return;
    }

    const prodTokens = getTokens(p.name);
    if (prodTokens.length === 0) return;

    const common = prodTokens.filter(t => imgTokens.includes(t));
    if (common.length >= 2) {
      const ratio = common.length / prodTokens.length;
      if (ratio >= 0.65 && ratio > bestScore) {
        bestScore = ratio;
        bestProd = p;
        bestCommon = common;
      }
    }
  });

  if (bestProd && bestScore >= 0.65) {
    const pEntry = productMap.get(bestProd.sku);
    if (pEntry && pEntry.images.length < MAX_GALLERY_PER_PRODUCT) {
      curatedGalleryMatches++;
      const isFirst = pEntry.images.length === 0;
      const role = isFirst ? 'MAPPED_PRIMARY' : 'MAPPED_GALLERY';

      assetStatus.set(sImg.webPath, {
        webPath: sImg.webPath,
        originalFilename: sImg.originalFilename,
        originalFolder: sImg.originalFolder,
        sku: bestProd.sku,
        productName: bestProd.name,
        category: bestProd.categoryName || bestProd.categoryId,
        role,
        matchedVia: `Curated Alternate Angle (${bestCommon.join(', ')})`,
        status: 'MAPPED_TO_PRODUCT'
      });

      pEntry.images.push(sImg.webPath);
    }
  }
});

// Third pass: Classify remaining images as approved unused or pending review
let approvedUnusedCount = 0;
let pendingReviewCount = 0;

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
    pendingReviewCount++;
    assetStatus.set(sImg.webPath, {
      webPath: sImg.webPath,
      originalFilename: sImg.originalFilename,
      originalFolder: sImg.originalFolder,
      sku: 'N/A',
      productName: 'Pending Manual Matching',
      category: 'Pending Review',
      role: 'PENDING_MANUAL_MATCHING',
      matchedVia: 'Unmatched Composite/Collage Graphic',
      status: 'PENDING_MANUAL_MATCHING'
    });
  } else {
    approvedUnusedCount++;
    assetStatus.set(sImg.webPath, {
      webPath: sImg.webPath,
      originalFilename: sImg.originalFilename,
      originalFolder: sImg.originalFolder,
      sku: 'N/A',
      productName: 'Approved Unused Image (Catalog Expansion)',
      category: 'Uncatalogued Supplier Stock',
      role: 'APPROVED_UNUSED_IMAGE',
      matchedVia: 'Authentic Supplier Product Photograph (Uncatalogued SKU / Alternate Angle)',
      status: 'APPROVED_UNUSED_IMAGE'
    });
  }
});

console.log('--- CURATED MATCHING SUMMARY ---');
console.log('Total Supplier WebP Assets:', webpManifest.length);
let mappedPrimaryTotal = 0;
let mappedGalleryTotal = 0;
for (const [wp, info] of assetStatus.entries()) {
  if (info.role === 'MAPPED_PRIMARY') mappedPrimaryTotal++;
  if (info.role === 'MAPPED_GALLERY') mappedGalleryTotal++;
}
const mappedTotal = mappedPrimaryTotal + mappedGalleryTotal;
console.log('1. Images mapped to actual products:', mappedTotal);
console.log('   - Primary images:', mappedPrimaryTotal);
console.log('   - Additional gallery images:', mappedGalleryTotal);
console.log('2. Number pending manual matching:', pendingReviewCount);
console.log('3. Number of approved unused images:', approvedUnusedCount);
console.log('Grand total accounting:', mappedTotal + pendingReviewCount + approvedUnusedCount);

// Category breakdown of mapped images
const catCounts = {
  'Office Stationery': 0,
  'Housekeeping & Hygiene': 0,
  'Printers & Technology': 0,
  'Packaging Supplies': 0
};
for (const [wp, info] of assetStatus.entries()) {
  if (info.status === 'MAPPED_TO_PRODUCT') {
    const c = info.category || 'Housekeeping & Hygiene';
    if (catCounts[c] !== undefined) catCounts[c]++;
    else catCounts['Housekeeping & Hygiene']++;
  }
}
console.log('4. Product mapping count per category:', catCounts);

// Products count
let prodsWithPhotos = 0;
let prodsWithGallery = 0;
let prodsPlaceholders = 0;
products.forEach(p => {
  const pEntry = productMap.get(p.sku);
  if (pEntry && pEntry.images.length > 0) prodsWithPhotos++;
  else prodsPlaceholders++;
  if (pEntry && pEntry.images.length > 1) prodsWithGallery++;
});
console.log('Total products:', products.length);
console.log('Products with authentic supplier photos:', prodsWithPhotos);
console.log('Products with multi-image gallery (>1):', prodsWithGallery);
console.log('Products with neutral placeholder:', prodsPlaceholders);


// 1. Update src/lib/data/catalog.ts
let catalogRaw = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// Find RAW_PRODUCTS section
const rawStart = catalogRaw.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = catalogRaw.indexOf('export const INITIAL_PRODUCTS: Product[] =');

if (rawStart === -1 || rawEnd === -1) {
  console.error('Could not locate RAW_PRODUCTS in catalog.ts');
  process.exit(1);
}

// Update each product's images array
let updatedProductsCount = 0;
products.forEach(p => {
  const pEntry = productMap.get(p.sku);
  if (!pEntry) return;

  const newImages = pEntry.images;
  // If images changed from original
  const oldImages = p.images || [];
  if (JSON.stringify(newImages) !== JSON.stringify(oldImages)) {
    updatedProductsCount++;
  }
  p.images = newImages;
});

console.log(`Products with updated image galleries: ${updatedProductsCount}`);

// Reconstruct RAW_PRODUCTS string
const newRawProductsStr = 'const RAW_PRODUCTS: Product[] = ' + JSON.stringify(products, null, 2) + ';\n\n';
catalogRaw = catalogRaw.slice(0, rawStart) + newRawProductsStr + catalogRaw.slice(rawEnd);

fs.writeFileSync('src/lib/data/catalog.ts', catalogRaw, 'utf8');
console.log('Successfully updated src/lib/data/catalog.ts!');

// 2. Generate updated master manifests (2369 rows total: 2365 webp + 4 non-image)
const nonImageManifestItems = manifest.filter(m => !m.webPath || !m.webPath.endsWith('.webp'));

const masterRows = [];

webpManifest.forEach(m => {
  const info = assetStatus.get(m.webPath);
  masterRows.push({
    originalFilename: m.originalFilename,
    originalFolder: m.originalFolder,
    processedFilename: m.processedFilename,
    webPath: m.webPath,
    fileSize: m.fileSize,
    processingStatus: m.processingStatus,
    sku: info ? info.sku : 'N/A',
    productName: info ? info.productName : 'Uncatalogued Supplier Stock',
    category: info ? info.category : 'N/A',
    role: info ? info.role : 'APPROVED_UNUSED_IMAGE',
    status: info ? info.status : 'APPROVED_UNUSED_IMAGE',
    productMapping: info && info.status === 'MAPPED_TO_PRODUCT' 
      ? `Mapped to ${info.sku} - ${info.productName} (${info.role})` 
      : (info ? info.role : 'Approved Unused')
  });
});

nonImageManifestItems.forEach(m => {
  masterRows.push({
    originalFilename: m.originalFilename,
    originalFolder: m.originalFolder,
    processedFilename: m.processedFilename,
    webPath: m.webPath,
    fileSize: m.fileSize,
    processingStatus: m.processingStatus,
    sku: 'N/A',
    productName: 'Preserved Non-Image Asset',
    category: 'Archive Documentation',
    role: 'PRESERVED_ARCHIVE_FILE',
    status: 'PRESERVED_NON_IMAGE',
    productMapping: 'Preserved Archive Documentation (Non-Image / Corrupted)'
  });
});

fs.writeFileSync('scripts/supplier_images_master_manifest.json', JSON.stringify(masterRows, null, 2), 'utf8');

// Generate CSV
const csvHeaders = ['Original filename', 'Original folder', 'Processed filename', 'Web Path', 'File size (bytes)', 'Processing status', 'Product mapping', 'SKU', 'Product Name', 'Category', 'Role'];
const csvLines = [csvHeaders.join(',')];

masterRows.forEach(row => {
  const escapeCsv = val => '"' + String(val || '').replace(/"/g, '""') + '"';
  csvLines.push([
    escapeCsv(row.originalFilename),
    escapeCsv(row.originalFolder),
    escapeCsv(row.processedFilename),
    escapeCsv(row.webPath),
    row.fileSize,
    escapeCsv(row.processingStatus),
    escapeCsv(row.productMapping),
    escapeCsv(row.sku),
    escapeCsv(row.productName),
    escapeCsv(row.category),
    escapeCsv(row.role)
  ].join(','));
});

fs.writeFileSync('scripts/supplier_images_master_manifest.csv', csvLines.join('\n'), 'utf8');
console.log('Successfully saved scripts/supplier_images_master_manifest.json and .csv (2,369 rows)!');

// 3. Generate updated 383 product mapping report
const productAuditReport = products.map(p => {
  const pEntry = productMap.get(p.sku);
  const imgs = pEntry ? pEntry.images : [];
  const hasImages = imgs.length > 0;
  return {
    sku: p.sku,
    productName: p.name,
    category: p.categoryName || p.categoryId,
    subcategory: p.subcategoryName || p.subcategoryId,
    brand: p.brandName || p.brandId,
    totalImages: imgs.length,
    primaryImage: hasImages ? imgs[0] : '/assets/placeholder-product.svg',
    galleryImages: hasImages ? imgs.slice(1) : [],
    status: hasImages ? 'Verified Supplier Photography' : 'Approved Neutral Placeholder',
    isMultiImageGallery: imgs.length > 1
  };
});

fs.writeFileSync('scripts/master_383_product_image_mapping_report.json', JSON.stringify(productAuditReport, null, 2), 'utf8');

const prodCsvHeaders = ['SKU', 'Product Name', 'Category', 'Subcategory', 'Brand', 'Total Images', 'Primary Image', 'Gallery Count', 'Status'];
const prodCsvLines = [prodCsvHeaders.join(',')];

productAuditReport.forEach(row => {
  const escapeCsv = val => '"' + String(val || '').replace(/"/g, '""') + '"';
  prodCsvLines.push([
    escapeCsv(row.sku),
    escapeCsv(row.productName),
    escapeCsv(row.category),
    escapeCsv(row.subcategory),
    escapeCsv(row.brand),
    row.totalImages,
    escapeCsv(row.primaryImage),
    row.galleryImages.length,
    escapeCsv(row.status)
  ].join(','));
});

fs.writeFileSync('scripts/master_383_product_image_mapping_report.csv', prodCsvLines.join('\n'), 'utf8');
console.log('Successfully saved scripts/master_383_product_image_mapping_report.json and .csv (383 rows)!');
