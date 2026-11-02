const fs = require('fs');
const path = require('path');

console.log('--- STARTING COMPREHENSIVE CATALOG & IMAGE AUDIT ---\n');

// 1. Load manifest
const manifestPath = 'public/assets/products/extraction_manifest.json';
if (!fs.existsSync(manifestPath)) {
  console.error('Manifest file missing!');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log(`[Manifest] Loaded ${manifest.length} entries.`);

// 2. Load catalog
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catalogContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catalogContent.indexOf('export const INITIAL_PRODUCTS: Product[]');
const rawSlice = catalogContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim();
const rawProducts = eval(rawSlice.replace(/;\s*$/, ''));
console.log(`[Catalog] Loaded ${rawProducts.length} products from RAW_PRODUCTS.`);

// 3. Verify manifest assets on disk
let missingManifestFiles = 0;
let emptyManifestFiles = 0;
for (const m of manifest) {
  const diskPath = path.join(process.cwd(), 'public', m.imagePath);
  if (!fs.existsSync(diskPath)) {
    console.error(`[Missing Image] Manifest code ${m.code} path missing: ${diskPath}`);
    missingManifestFiles++;
  } else {
    const stat = fs.statSync(diskPath);
    if (stat.size === 0) {
      console.error(`[Empty Image] Manifest code ${m.code} file is 0 bytes: ${diskPath}`);
      emptyManifestFiles++;
    }
  }
}
console.log(`[Manifest Disk Check] Missing: ${missingManifestFiles}, Empty: ${emptyManifestFiles}`);

// 4. Check for duplicates in rawProducts
const idMap = new Map();
const skuMap = new Map();
const slugMap = new Map();
let duplicateIds = 0;
let duplicateSkus = 0;
let duplicateSlugs = 0;

rawProducts.forEach((p, idx) => {
  if (idMap.has(p.id)) {
    console.error(`[Duplicate ID] index ${idx}: ID "${p.id}" already used at index ${idMap.get(p.id)}`);
    duplicateIds++;
  } else {
    idMap.set(p.id, idx);
  }

  if (skuMap.has(p.sku)) {
    console.error(`[Duplicate SKU] index ${idx}: SKU "${p.sku}" already used at index ${skuMap.get(p.sku)}`);
    duplicateSkus++;
  } else {
    skuMap.set(p.sku, idx);
  }

  if (slugMap.has(p.slug)) {
    console.error(`[Duplicate Slug] index ${idx}: Slug "${p.slug}" already used at index ${slugMap.get(p.slug)}`);
    duplicateSlugs++;
  } else {
    slugMap.set(p.slug, idx);
  }
});

console.log(`[Duplicates Check] Duplicate IDs: ${duplicateIds}, Duplicate SKUs: ${duplicateSkus}, Duplicate Slugs: ${duplicateSlugs}`);

// 5. Check all product images in rawProducts
let localImagesChecked = 0;
let localImagesMissing = 0;
let remoteImagesChecked = 0;

rawProducts.forEach((p, idx) => {
  if (!p.images || p.images.length === 0 || !p.images[0]) {
    console.error(`[No Image] Product ${p.sku} "${p.name}" has no images.`);
    return;
  }
  const img = p.images[0];
  if (img.startsWith('/assets/')) {
    localImagesChecked++;
    const diskPath = path.join(process.cwd(), 'public', img);
    if (!fs.existsSync(diskPath)) {
      console.error(`[Catalog Broken Local Image] Product ${p.sku} "${p.name}": ${img}`);
      localImagesMissing++;
    }
  } else {
    remoteImagesChecked++;
  }
});

console.log(`[Catalog Images] Checked ${localImagesChecked} local images (Missing: ${localImagesMissing}), ${remoteImagesChecked} remote images.`);

// 6. Map manifest entries to catalog products
let manifestMatchedCount = 0;
let manifestMissingInCatalog = 0;

for (const m of manifest) {
  // Check if code is either product sku or catalogueCode in specs
  let found = rawProducts.find(p => p.sku === m.code || (p.specifications && p.specifications.catalogueCode === m.code));
  if (found) {
    manifestMatchedCount++;
    // Verify image matches
    if (found.images[0] !== m.imagePath) {
      console.error(`[Image Mismatch] For code ${m.code}: Catalog has ${found.images[0]}, manifest has ${m.imagePath}`);
    }
  } else {
    console.error(`[Manifest Code Missing in Catalog] Code ${m.code} not found in any product.`);
    manifestMissingInCatalog++;
  }
}

console.log(`[Manifest to Catalog Coverage] Matched: ${manifestMatchedCount}/${manifest.length}, Missing: ${manifestMissingInCatalog}`);

// 7. Stock status audit
let zeroStockCount = 0;
let positiveStockCount = 0;
rawProducts.forEach(p => {
  if (p.stockQuantity === 0) zeroStockCount++;
  else positiveStockCount++;
});
console.log(`[Stock Status] Products with stockQuantity === 0: ${zeroStockCount}, > 0: ${positiveStockCount}`);

