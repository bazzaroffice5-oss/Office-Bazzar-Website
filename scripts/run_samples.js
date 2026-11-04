
const fs = require('fs');
const path = require('path');

// 1. Load catalog products
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

// 2. Load supplier manifest
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

// 3. Load catalog sources mapping
const catToSource = new Map();
function reg(catWebp, origSource, sku) {
  if (!catWebp || !origSource) return;
  const pName = path.basename(catWebp);
  const normSource = origSource.replace(/\\/g, '/').replace(/^Office Bazzar New Images\//i, '').replace(/^Product Photo \(4-3-26\)\//i, '');
  catToSource.set(pName, { normSource, sku });
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

const mappedSupplierImages = new Map(); // webPath -> info

// First pass: Direct exact source match
webpManifest.forEach(sImg => {
  const sRel = `${sImg.originalFolder}/${sImg.originalFilename}`;
  const sBase = sImg.originalFilename.toLowerCase();

  for (const [catWebp, info] of catToSource.entries()) {
    const infoRel = info.normSource;
    const infoBase = path.basename(infoRel).toLowerCase();

    if (infoRel.toLowerCase() === sRel.toLowerCase() || infoBase === sBase) {
      const prod = products.find(p => p.sku === info.sku);
      const isAlt = catWebp.includes('_alt') || catWebp.includes('-alt');
      mappedSupplierImages.set(sImg.webPath, {
        sku: info.sku,
        productName: prod ? prod.name : info.sku,
        category: prod ? (prod.categoryName || prod.categoryId) : 'Unknown',
        role: isAlt ? 'GALLERY_IMAGE' : 'PRIMARY_IMAGE',
        matchedVia: 'Verified Primary/Alt Source Match',
        originalFolder: sImg.originalFolder,
        originalFilename: sImg.originalFilename
      });
      break;
    }
  }
});

console.log(`Direct source matches: ${mappedSupplierImages.size}`);

// Second pass: Find alternate angles for each product by token and stem similarity
const angleKeywords = [
  'front', 'back', 'side', 'top', 'rear', 'angle', 'angled', 'perspective', 
  'close-up', 'closeup', 'inside', 'open', 'closed', 'infographic', 
  'stacked', 'pair', 'trio', 'row', 'bottom', 'display', 'view', 'pack', 'set',
  'box', 'pouch', 'shrunk', 'unwrapped', 'lid', 'wheels', 'handle'
];

function cleanName(str) {
  let s = (str || '')
    .toLowerCase()
    .replace(/\.webp$|\.jpg$|\.jpeg$|\.png$/i, '')
    .replace(/\(\d+\)/g, '')
    .replace(/[-_]+/g, ' ');
  for (const kw of angleKeywords) {
    s = s.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '');
  }
  return s.replace(/\s+/g, ' ').trim();
}

function getTokens(str) {
  return cleanName(str).split(/\s+/).filter(t => t.length > 2);
}

// Build list of products and their primary source filename stems
const prodStems = [];
products.forEach(p => {
  const pMappings = Array.from(mappedSupplierImages.entries()).filter(([k, v]) => v.sku === p.sku);
  const primaryMapping = pMappings.find(([k, v]) => v.role === 'PRIMARY_IMAGE') || pMappings[0];

  const stems = [];
  if (primaryMapping) {
    stems.push({
      folder: primaryMapping[1].originalFolder,
      tokens: getTokens(primaryMapping[1].originalFilename),
      clean: cleanName(primaryMapping[1].originalFilename)
    });
  }
  stems.push({
    folder: null,
    tokens: getTokens(p.name),
    clean: cleanName(p.name)
  });

  prodStems.push({
    product: p,
    stems
  });
});

let altAnglesFound = 0;

webpManifest.forEach(sImg => {
  if (mappedSupplierImages.has(sImg.webPath)) return; // already mapped

  const fn = sImg.originalFilename;
  const folder = sImg.originalFolder;
  const imgTokens = getTokens(fn);
  if (imgTokens.length < 2) return;

  // Find candidate products
  let bestProd = null;
  let bestScore = 0;
  let bestMethod = '';

  for (const ps of prodStems) {
    for (const stem of ps.stems) {
      if (stem.folder && stem.folder.toLowerCase() !== folder.toLowerCase()) continue;

      const common = stem.tokens.filter(t => imgTokens.includes(t));
      if (common.length >= 2) {
        const score = (common.length * 2) / (stem.tokens.length + imgTokens.length);
        if (score > 0.65 && score > bestScore) {
          bestScore = score;
          bestProd = ps.product;
          bestMethod = `Alternate Angle / Variant (${common.join(' ')})`;
        }
      }
    }
  }

  if (bestProd && bestScore >= 0.65) {
    altAnglesFound++;
    mappedSupplierImages.set(sImg.webPath, {
      sku: bestProd.sku,
      productName: bestProd.name,
      category: bestProd.categoryName || bestProd.categoryId,
      role: 'GALLERY_IMAGE',
      matchedVia: bestMethod,
      originalFolder: sImg.originalFolder,
      originalFilename: sImg.originalFilename,
      score: bestScore
    });
  }
});

console.log(`Alternate angles / variants matched: ${altAnglesFound}`);
console.log(`Total mapped supplier images to products: ${mappedSupplierImages.size}`);

// Category breakdown of mapped images
const catMapped = {};
for (const [wp, info] of mappedSupplierImages.entries()) {
  catMapped[info.category] = (catMapped[info.category] || 0) + 1;
}
console.log('Mapped supplier images by category:', catMapped);

// Third pass: Unmatched images categorization
let approvedUnused = 0;
let pendingReview = 0;

const unmatchedAssets = [];

webpManifest.forEach(sImg => {
  if (mappedSupplierImages.has(sImg.webPath)) return;

  const fn = sImg.originalFilename.toLowerCase();
  const folder = sImg.originalFolder.toLowerCase();

  if (folder === 'collage' || fn.includes('collage') || fn.includes('infographic') || fn.includes('spec') || fn.includes('chart') || fn.includes('unnamed') || fn.includes('whatsapp')) {
    pendingReview++;
    unmatchedAssets.push({
      webPath: sImg.webPath,
      folder: sImg.originalFolder,
      filename: sImg.originalFilename,
      status: 'PENDING_INTERNAL_REVIEW'
    });
  } else {
    approvedUnused++;
    unmatchedAssets.push({
      webPath: sImg.webPath,
      folder: sImg.originalFolder,
      filename: sImg.originalFilename,
      status: 'APPROVED_UNUSED_SUPPLIER_PHOTO'
    });
  }
});

console.log(`Approved Unused Supplier Photos (Available for future catalogue expansion): ${approvedUnused}`);
console.log(`Pending Internal Review (Collage / Composite / Unclear): ${pendingReview}`);
console.log(`Total accounted: ${mappedSupplierImages.size + approvedUnused + pendingReview} / ${webpManifest.length}`);


console.log('\n--- 40 Sample Matched Supplier Images ---');
const entries = Array.from(mappedSupplierImages.entries());
// take 20 direct and 20 alternate
const directs = entries.filter(e => e[1].matchedVia.includes('Verified')).slice(0, 20);
const alts = entries.filter(e => e[1].role === 'GALLERY_IMAGE' && !e[1].matchedVia.includes('Verified')).slice(0, 20);

console.log('--- DIRECT SOURCE MAPPINGS ---');
directs.forEach(([wp, info], i) => {
  console.log(`[${i + 1}] ${info.sku} | ${info.productName} | ${info.originalFolder}/${info.originalFilename}`);
});

console.log('\n--- ALTERNATE ANGLE / GALLERY MAPPINGS ---');
alts.forEach(([wp, info], i) => {
  console.log(`[${i + 1}] ${info.sku} | ${info.productName} | ${info.originalFolder}/${info.originalFilename} (score: ${info.score?.toFixed(2)})`);
});
