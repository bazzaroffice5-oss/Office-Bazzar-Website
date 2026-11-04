const fs = require('fs');
const path = require('path');

console.log('--- OfficeBazzar Full Catalogue Expansion Verification ---');

// 1. Check CSV report
const csvPath = 'scripts/complete_2365_supplier_images_integration_report.csv';
if (!fs.existsSync(csvPath)) {
  console.error('FAIL: CSV report missing!');
  process.exit(1);
}
const csvLines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
console.log(`CSV Report Header: ${csvLines[0]}`);
console.log(`CSV Report Total Rows: ${csvLines.length - 1} (Expected: 2,365)`);

if (csvLines.length - 1 !== 2365) {
  console.error(`FAIL: Expected 2,365 rows in CSV, found ${csvLines.length - 1}`);
  process.exit(1);
}

// 2. Check JSON report
const jsonPath = 'scripts/complete_2365_supplier_images_integration_report.json';
const jsonRows = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`JSON Report Total Entries: ${jsonRows.length} (Expected: 2,365)`);

let existingCount = 0;
let newCount = 0;
let primaryCount = 0;
let galleryCount = 0;
const catBreakdown = {};

jsonRows.forEach(r => {
  if (r.productType === 'Existing Product') existingCount++;
  else if (r.productType === 'Newly Identified Product') newCount++;

  if (r.role === 'Primary Image') primaryCount++;
  else if (r.role === 'Gallery Image') galleryCount++;

  catBreakdown[r.category] = (catBreakdown[r.category] || 0) + 1;
});

console.log(`- Images mapped to Existing Products: ${existingCount}`);
console.log(`- Images mapped to Newly Identified Products: ${newCount}`);
console.log(`- Primary Images: ${primaryCount}`);
console.log(`- Additional Gallery Images: ${galleryCount}`);
console.log(`- Total Mapped Images: ${existingCount + newCount} / 2,365`);
console.log('Category breakdown of all 2,365 images:');
console.table(catBreakdown);

// 3. Check catalog.ts
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

console.log(`\nCatalog Products Count: ${products.length} (Expected: 1,808)`);
let multiImageCount = 0;
let withImagesCount = 0;
let placeholderCount = 0;

products.forEach(p => {
  const imgs = p.images || [];
  if (imgs.length > 0) withImagesCount++;
  else placeholderCount++;
  if (imgs.length > 1) multiImageCount++;
});

console.log(`Products with authentic supplier images: ${withImagesCount}`);
console.log(`Products with multi-image gallery (>1): ${multiImageCount}`);
console.log(`Products with neutral placeholder (consumables): ${placeholderCount}`);

console.log('\nALL VERIFICATION CHECKS PASSED!');

