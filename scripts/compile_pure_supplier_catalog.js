const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BASE_PACKAGE_DIR = 'D:/temp_2369_package';
const CATALOG_DIR = path.join(__dirname, '..', 'public', 'assets', 'products', 'catalog_2026');

// Load inventory
const inventory = JSON.parse(fs.readFileSync('scripts/supplier_inventory_complete.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

// Load all 383 catalog products
const rawCatalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const regex = /\{\s*\"id\":\s*\"([^\"]+)\"[\s\S]*?\"name\":\s*\"([^\"]+)\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"categoryId\":\s*\"([^\"]+)\"[\s\S]*?\"brandName\":\s*\"([^\"]+)\"/g;

const catalogProducts = [];
let match;
while ((match = regex.exec(rawCatalogContent)) !== null) {
  catalogProducts.push({
    id: match[1],
    name: match[2],
    sku: match[3],
    categoryId: match[4],
    brand: match[5]
  });
}

// Build verified supplier mappings (primary source must exist in D:/temp_2369_package)
// Combine previous verified list and newly detected verified matches
const pureDecisions = JSON.parse(fs.readFileSync('scripts/pure_supplier_catalog_decision.json', 'utf8'));
const deepMatched = JSON.parse(fs.readFileSync('scripts/pure_supplier_matched.json', 'utf8'));

const skuToSource = new Map();

// 1. From pureDecisions
for (const d of pureDecisions) {
  if (d.status === 'VERIFIED_SUPPLIER_IMAGE' && d.supplierSource) {
    skuToSource.set(d.sku, {
      sku: d.sku,
      name: d.name,
      category: d.category,
      brand: d.brand,
      supplierSource: d.supplierSource
    });
  }
}

// 2. From deepMatched (high confidence score >= 8)
for (const m of deepMatched) {
  if (!skuToSource.has(m.product.sku)) {
    // verify file exists
    const fullP = path.join(BASE_PACKAGE_DIR, m.supplierImage);
    if (fs.existsSync(fullP)) {
      skuToSource.set(m.product.sku, {
        sku: m.product.sku,
        name: m.product.name,
        category: m.product.categoryId,
        brand: m.product.brand,
        supplierSource: m.supplierImage
      });
    }
  }
}

console.log(`Total verified supplier mapped products: ${skuToSource.size}`);

// Verify all source files exist in BASE_PACKAGE_DIR
const finalVerifiedList = [];
for (const [sku, item] of skuToSource.entries()) {
  const full = path.join(BASE_PACKAGE_DIR, item.supplierSource);
  if (fs.existsSync(full)) {
    finalVerifiedList.push(item);
  } else {
    console.warn(`File missing for ${sku}: ${full}`);
  }
}

console.log(`Confirmed existing supplier master files: ${finalVerifiedList.length}`);
fs.writeFileSync('scripts/final_verified_supplier_products.json', JSON.stringify(finalVerifiedList, null, 2), 'utf8');

