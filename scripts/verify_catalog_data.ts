import { CATEGORIES, INITIAL_PRODUCTS } from '../src/lib/data/catalog';

console.log('--- OFFICEBAZZAR CATALOG VERIFICATION ---');
console.log(`Total INITIAL_PRODUCTS: ${INITIAL_PRODUCTS.length}`);

// Unique IDs and SKUs check
const ids = new Set<string>();
const duplicateIds: string[] = [];
const skus = new Set<string>();
const duplicateSkus: string[] = [];

for (const p of INITIAL_PRODUCTS) {
  if (ids.has(p.id)) duplicateIds.push(p.id);
  ids.add(p.id);
  if (skus.has(p.sku)) duplicateSkus.push(p.sku);
  skus.add(p.sku);
}

console.log(`Unique Product IDs: ${ids.size} (Duplicates: ${duplicateIds.length})`);
console.log(`Unique SKUs: ${skus.size} (Duplicates: ${duplicateSkus.length})`);

// Category counts
let categorySum = 0;
console.log('\n--- MAIN CATEGORY BREAKDOWN ---');
for (const cat of CATEGORIES) {
  const actualProducts = INITIAL_PRODUCTS.filter((p) => p.categoryId === cat.id);
  categorySum += actualProducts.length;
  console.log(`\nCategory: "${cat.name}" (ID: ${cat.id})`);
  console.log(`  - Declared itemCount in CATEGORIES: ${cat.itemCount}`);
  console.log(`  - Actual Matching Products: ${actualProducts.length}`);
  const match = cat.itemCount === actualProducts.length ? 'MATCH ✅' : 'MISMATCH ❌';
  console.log(`  - Status: ${match}`);

  let subcategorySum = 0;
  console.log(`  - Subcategories (${cat.subcategories?.length || 0}):`);
  for (const sub of cat.subcategories || []) {
    const subProducts = actualProducts.filter((p) => p.subcategoryId === sub.id);
    subcategorySum += subProducts.length;
    const subMatch = sub.itemCount === subProducts.length ? 'MATCH ✅' : 'MISMATCH ❌';
    console.log(`     * ${sub.name.padEnd(38, ' ')} (id: ${sub.id}): declared ${sub.itemCount}, actual ${subProducts.length} [${subMatch}]`);
  }
  console.log(`  - Total across subcategories: ${subcategorySum} (Matches Category: ${subcategorySum === actualProducts.length ? 'YES ✅' : 'NO ❌'})`);
}

console.log(`\nTotal Products Across 4 Main Categories: ${categorySum} / ${INITIAL_PRODUCTS.length} (Sum Match: ${categorySum === INITIAL_PRODUCTS.length ? 'PERFECT 100% ✅' : 'MISMATCH ❌'})`);

// Check unassigned or invalid categories
const invalidCat = INITIAL_PRODUCTS.filter((p) => !CATEGORIES.some((c) => c.id === p.categoryId));
console.log(`Invalid Category Products: ${invalidCat.length}`);

// Check unassigned or invalid subcategories
const allSubcategoryIds = new Set(CATEGORIES.flatMap((c) => (c.subcategories || []).map((s) => s.id)));
const invalidSubcat = INITIAL_PRODUCTS.filter((p) => !allSubcategoryIds.has(p.subcategoryId || ''));
console.log(`Invalid Subcategory Products: ${invalidSubcat.length}`);
if (invalidSubcat.length > 0) {
  console.log('Invalid Subcategory samples:', invalidSubcat.slice(0, 5).map(p => ({ id: p.id, sub: p.subcategoryId })));
}

// Remote vs Local Images
let remoteImages = 0;
let localImages = 0;
let missingImages = 0;

for (const p of INITIAL_PRODUCTS) {
  const img = p.images?.[0] || '';
  if (img.startsWith('http')) {
    remoteImages++;
  } else if (img.startsWith('/')) {
    localImages++;
  } else {
    missingImages++;
  }
}

console.log('\n--- IMAGE STORAGE BREAKDOWN ---');
console.log(`Local WebP images: ${localImages}`);
console.log(`Remote CDN images: ${remoteImages}`);
console.log(`Missing/Other: ${missingImages}`);
console.log(`Total Images: ${localImages + remoteImages + missingImages}`);
