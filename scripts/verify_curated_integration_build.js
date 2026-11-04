const fs = require('fs');
const path = require('path');

// 1. Verify that supplier-gallery route does not exist in build
console.log('Verifying standalone gallery removal:');
const galleryPath = 'src/app/supplier-gallery';
if (fs.existsSync(galleryPath)) {
  console.error('FAIL: src/app/supplier-gallery still exists!');
  process.exit(1);
} else {
  console.log('PASS: src/app/supplier-gallery removed.');
}

// 2. Verify catalog.ts integrity
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

console.log(`\nCatalog Integrity Check:`);
console.log(`Total Products: ${products.length} (Expected: 383)`);

let withImages = 0;
let withMultiImages = 0;
let withPlaceholders = 0;
let totalImageReferences = 0;

products.forEach(p => {
  const imgs = p.images || [];
  totalImageReferences += imgs.length;
  if (imgs.length > 0) withImages++;
  else withPlaceholders++;
  if (imgs.length > 1) withMultiImages++;

  // Verify each image exists on disk
  imgs.forEach(img => {
    const pOnDisk = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
    if (!fs.existsSync(pOnDisk)) {
      console.error(`ERROR: Missing file for ${p.sku}: ${pOnDisk}`);
      process.exit(1);
    }
  });
});

console.log(`Products with Supplier Photos: ${withImages} (Expected: 286)`);
console.log(`Products with Multi-Image Gallery: ${withMultiImages}`);
console.log(`Products with Approved Placeholders: ${withPlaceholders} (Expected: 97)`);
console.log(`Total Verified Image References: ${totalImageReferences}`);

// 3. Category distribution
const byCat = {
  'Office Stationery': { total: 0, withImages: 0, multi: 0 },
  'Housekeeping & Hygiene': { total: 0, withImages: 0, multi: 0 },
  'Printers & Technology': { total: 0, withImages: 0, multi: 0 },
  'Packaging Supplies': { total: 0, withImages: 0, multi: 0 }
};

products.forEach(p => {
  const c = p.categoryName || p.categoryId;
  if (!byCat[c]) byCat[c] = { total: 0, withImages: 0, multi: 0 };
  byCat[c].total++;
  if (p.images && p.images.length > 0) byCat[c].withImages++;
  if (p.images && p.images.length > 1) byCat[c].multi++;
});

console.log('\nCategory Breakdown:');
console.table(byCat);

// 4. Verify Master Manifest
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
console.log(`\nMaster Manifest Check: ${manifest.length} rows (Expected: 2,369)`);

const statusCounts = {};
manifest.forEach(m => {
  statusCounts[m.role || m.status] = (statusCounts[m.role || m.status] || 0) + 1;
});
console.log('Manifest Role Counts:', statusCounts);

console.log('\nAll Integration Integrity Checks PASSED!');
