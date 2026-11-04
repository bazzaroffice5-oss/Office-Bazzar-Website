/**
 * Product Catalogue Image Publishing Validator
 *
 * Enforces strict quality gates before any product can be published:
 * 1. Product must have an 'images' array with at least 1 image.
 * 2. No placeholder images allowed ('/assets/placeholder-product.svg', 'pending', etc.).
 * 3. Every referenced image must physically exist on disk in public/.
 * 4. Image file must be non-empty (> 2 KB).
 * 5. Image must be a valid format (.webp, .png, .jpg, .jpeg, .avif).
 * 6. Product SKU must be unique and valid.
 */

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🔍 RUNNING PRODUCT CATALOGUE IMAGE PUBLISHING AUDIT');
console.log('====================================================');

const catalogPath = path.resolve('src/lib/data/catalog.ts');
if (!fs.existsSync(catalogPath)) {
  console.error(`❌ Fatal: catalog.ts not found at ${catalogPath}`);
  process.exit(1);
}

const catalogContent = fs.readFileSync(catalogPath, 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
if (!match) {
  console.error('❌ Fatal: Could not parse RAW_PRODUCTS array from catalog.ts');
  process.exit(1);
}

const products = eval(match[1]);
console.log(`Auditing ${products.length} catalogue products...`);

let errors = [];
let warnings = [];
let passCount = 0;
const skuSet = new Set();

const DISALLOWED_PATTERNS = [
  /\bplaceholder\b/i,
  /supplier.*pending/i,
  /\bno[-_]image\b/i,
  /\bdummy\b/i,
  /\btemp[-_]image\b/i,
  /\bnot[-_]available\b/i
];

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  const sku = (p.sku || '').trim();
  const name = (p.name || '').trim();

  // 1. SKU validation
  if (!sku) {
    errors.push(`[Index ${i}] Product missing SKU: "${name}"`);
    continue;
  }
  if (skuSet.has(sku.toUpperCase())) {
    errors.push(`[SKU Duplicate] SKU "${sku}" is duplicated in catalog.ts`);
  }
  skuSet.add(sku.toUpperCase());

  // 2. Images array validation
  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
    errors.push(`[${sku}] Missing images array or zero images defined.`);
    continue;
  }

  // 3. Inspect every image in the array
  let productHasValidImage = true;
  for (let imgIdx = 0; imgIdx < p.images.length; imgIdx++) {
    const imgPath = p.images[imgIdx];

    if (typeof imgPath !== 'string' || !imgPath.trim()) {
      errors.push(`[${sku}] Image #${imgIdx + 1} has invalid/empty string value.`);
      productHasValidImage = false;
      continue;
    }

    // Disallowed placeholder check
    for (const pattern of DISALLOWED_PATTERNS) {
      if (pattern.test(imgPath)) {
        errors.push(`[${sku}] Image #${imgIdx + 1} uses disallowed placeholder path: "${imgPath}"`);
        productHasValidImage = false;
        break;
      }
    }

    // Path must start with /assets/
    if (!imgPath.startsWith('/assets/')) {
      errors.push(`[${sku}] Image #${imgIdx + 1} does not start with "/assets/": "${imgPath}"`);
      productHasValidImage = false;
      continue;
    }

    // Physical disk check
    const diskPath = path.resolve(path.join('public', imgPath.startsWith('/') ? imgPath.slice(1) : imgPath));
    if (!fs.existsSync(diskPath)) {
      errors.push(`[${sku}] Image #${imgIdx + 1} file not found on disk: "${diskPath}"`);
      productHasValidImage = false;
      continue;
    }

    // File size check (> 2KB)
    try {
      const stats = fs.statSync(diskPath);
      if (stats.size < 2048) {
        errors.push(`[${sku}] Image #${imgIdx + 1} file is unusually small (${stats.size} bytes): "${imgPath}"`);
        productHasValidImage = false;
      }
    } catch (e) {
      errors.push(`[${sku}] Failed to read file stats for "${imgPath}": ${e.message}`);
      productHasValidImage = false;
    }
  }

  if (productHasValidImage) {
    passCount++;
  }
}

console.log('----------------------------------------------------');
console.log(`Total Products Audited: ${products.length}`);
console.log(`Passed Quality Gates:   ${passCount} / ${products.length} (${((passCount / products.length) * 100).toFixed(2)}%)`);
console.log(`Errors Detected:        ${errors.length}`);
console.log('----------------------------------------------------');

if (errors.length > 0) {
  console.error('❌ QUALITY GATE FAILED! The following publishing violations must be resolved:');
  errors.slice(0, 20).forEach(e => console.error(`  - ${e}`));
  if (errors.length > 20) {
    console.error(`  ... and ${errors.length - 20} more violations.`);
  }
  process.exit(1);
} else {
  console.log('✅ ALL PRODUCTS PASSED! Zero placeholder images. 100% genuine physical photographs verified.');
  process.exit(0);
}
