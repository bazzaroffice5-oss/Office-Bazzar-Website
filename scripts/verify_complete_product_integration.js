const fs = require('fs');
const path = require('path');

console.log('=====================================================');
console.log('   OFFICE BAZZAR - COMPLETE INTEGRATION AUDIT       ');
console.log('=====================================================\n');

// 1. Audit public/assets/product directory
const productFiles = [];
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else productFiles.push(full.replace(/\\/g, '/').replace(/^public/, ''));
  });
}
walk('public/assets/product');
console.log(`1. Total WebP Image Files in public/assets/product: ${productFiles.length}`);

// 2. Audit catalog.ts
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

console.log(`2. Total Products in Catalog: ${products.length}`);

let productsWithPhotos = 0;
let productsWithPlaceholders = 0;
let productsWithMultiGallery = 0;
const usedProductFiles = new Set();
let missingOnDisk = 0;
const missingSamples = [];

const categoryStats = {
  'Office Stationery': { total: 0, withImages: 0, placeholders: 0, multiGallery: 0, totalImageRefs: 0 },
  'Housekeeping & Hygiene': { total: 0, withImages: 0, placeholders: 0, multiGallery: 0, totalImageRefs: 0 },
  'Printers & Technology': { total: 0, withImages: 0, placeholders: 0, multiGallery: 0, totalImageRefs: 0 },
  'Packaging Supplies': { total: 0, withImages: 0, placeholders: 0, multiGallery: 0, totalImageRefs: 0 }
};

const skus = new Set();
const slugs = new Set();
let duplicateSkus = 0;
let duplicateSlugs = 0;

products.forEach(p => {
  if (skus.has(p.sku)) duplicateSkus++;
  skus.add(p.sku);

  if (slugs.has(p.slug)) duplicateSlugs++;
  slugs.add(p.slug);

  const cat = p.categoryName || 'Housekeeping & Hygiene';
  if (!categoryStats[cat]) {
    categoryStats[cat] = { total: 0, withImages: 0, placeholders: 0, multiGallery: 0, totalImageRefs: 0 };
  }
  categoryStats[cat].total++;

  const imgs = p.images || [];
  if (imgs.length > 0) {
    productsWithPhotos++;
    categoryStats[cat].withImages++;
    if (imgs.length > 1) {
      productsWithMultiGallery++;
      categoryStats[cat].multiGallery++;
    }
  } else {
    productsWithPlaceholders++;
    categoryStats[cat].placeholders++;
  }

  categoryStats[cat].totalImageRefs += imgs.length;

  imgs.forEach(img => {
    if (img.startsWith('/assets/product/')) {
      usedProductFiles.add(img);
    }
    const fullPath = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      missingOnDisk++;
      if (missingSamples.length < 5) missingSamples.push({ sku: p.sku, img });
    }
  });
});

console.log(`\n3. Product Image Status:`);
console.log(`   - Products with Genuine Supplier Photos: ${productsWithPhotos}`);
console.log(`   - Products with Approved Placeholders: ${productsWithPlaceholders}`);
console.log(`   - Products with Multi-Image Galleries: ${productsWithMultiGallery}`);
console.log(`   - Duplicate SKUs: ${duplicateSkus}`);
console.log(`   - Duplicate Slugs: ${duplicateSlugs}`);

console.log(`\n4. public/assets/product Integration:`);
console.log(`   - Total Files in Folder: ${productFiles.length}`);
console.log(`   - Total Files Referenced in Catalog: ${usedProductFiles.size}`);
console.log(`   - Unmatched Images: ${productFiles.length - usedProductFiles.size}`);
console.log(`   - Coverage Rate: ${((usedProductFiles.size / productFiles.length) * 100).toFixed(2)}%`);
console.log(`   - Missing on Disk: ${missingOnDisk}`);

console.log(`\n5. Category-Wise Integration Breakdown:`);
console.table(categoryStats);

console.log('=====================================================');

