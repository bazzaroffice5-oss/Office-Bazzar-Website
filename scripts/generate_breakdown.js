const fs = require('fs');

// Run test_precision_matcher and print detailed breakdown
const script = fs.readFileSync('scripts/test_precision_matcher.js', 'utf8');

const extra = `
console.log('\\n========================================');
console.log('--- BREAKDOWN BY CATEGORY (MAPPED ASSETS) ---');
const catAssets = {};
for (const [wp, info] of assetStatus.entries()) {
  if (info.status === 'MAPPED') {
    const c = info.category || 'Uncategorized';
    catAssets[c] = (catAssets[c] || 0) + 1;
  }
}
console.log(catAssets);

console.log('\\n--- BREAKDOWN BY ROLE ---');
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

console.log('\\n--- PRODUCTS BREAKDOWN ---');
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
`;

fs.writeFileSync('scripts/run_breakdown.js', script + extra, 'utf8');

