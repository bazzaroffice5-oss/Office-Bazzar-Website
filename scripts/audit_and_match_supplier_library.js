const fs = require('fs');
const path = require('path');

// 1. Load catalog products
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

// 2. Load supplier manifest
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

console.log(`Loaded ${products.length} products and ${webpManifest.length} supplier webp assets.`);

// 3. Build lookup for existing 399 catalog_2026 mappings to original supplier files
const catToSource = new Map();

// Helper to register mapping
function reg(catWebp, origSource, sku) {
  if (!catWebp || !origSource) return;
  const pName = path.basename(catWebp);
  const normSource = origSource.replace(/\\/g, '/').replace(/^Office Bazzar New Images\//i, '').replace(/^Product Photo \(4-3-26\)\//i, '');
  catToSource.set(pName, { normSource, sku });
}

// activeManifest
if (fs.existsSync('scripts/office_bazzar_active_catalog_manifest.json')) {
  const am = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));
  am.forEach(item => {
    reg(item.primaryRelative, item.primarySource, item.sku);
    (item.altRelatives || []).forEach((ar, idx) => {
      reg(ar, item.altSources[idx], item.sku);
    });
  });
}

// appliedNew
if (fs.existsSync('scripts/applied_new_mappings.json')) {
  const an = JSON.parse(fs.readFileSync('scripts/applied_new_mappings.json', 'utf8'));
  an.forEach(item => reg(item.webpFilename, item.sourceFile, item.sku));
}

// batch 16
if (fs.existsSync('scripts/process_and_map_batch_16.js')) {
  const b1 = fs.readFileSync('scripts/process_and_map_batch_16.js', 'utf8');
  const m1 = b1.match(/const MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m1) {
    eval(m1[1]).forEach(x => {
      x.images.forEach(i => reg(i.out, i.file, x.sku));
    });
  }
}

// batch safety
if (fs.existsSync('scripts/process_and_map_batch_safety.js')) {
  const b2 = fs.readFileSync('scripts/process_and_map_batch_safety.js', 'utf8');
  const m2 = b2.match(/const MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m2) {
    eval(m2[1]).forEach(x => {
      x.images.forEach(i => reg(i.out, i.file, x.sku));
    });
  }
}

// permanent live fix
if (fs.existsSync('scripts/apply_permanent_live_fix.js')) {
  const b3 = fs.readFileSync('scripts/apply_permanent_live_fix.js', 'utf8');
  const m3 = b3.match(/const NEW_MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m3) {
    eval(m3[1]).forEach(x => {
      x.images.forEach(i => reg(i.out, i.file, x.sku));
    });
  }
}

// process 5 new images
if (fs.existsSync('scripts/process_5_new_images.js')) {
  const b4 = fs.readFileSync('scripts/process_5_new_images.js', 'utf8');
  const m4 = b4.match(/const MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m4) {
    eval(m4[1]).forEach(x => reg(x.out, x.src, x.sku));
  }
}

console.log(`Indexed ${catToSource.size} catalog_2026 image sources.`);

// Now map supplier library entries that match these exact sources
const mappedSupplierImages = new Map(); // webPath -> { sku, role, productName, category }

webpManifest.forEach(sImg => {
  const sRel = `${sImg.originalFolder}/${sImg.originalFilename}`;
  const sBase = sImg.originalFilename.toLowerCase();

  // Check if this supplier file was the source of a catalog_2026 image
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
        matchedVia: 'Existing Verified Catalogue Source'
      });
      break;
    }
  }
});

console.log(`Directly matched supplier library assets: ${mappedSupplierImages.size}`);

