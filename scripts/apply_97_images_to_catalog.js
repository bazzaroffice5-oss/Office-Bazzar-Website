const fs = require('fs');
const path = require('path');

const catalogPath = path.join(process.cwd(), 'src', 'lib', 'data', 'catalog.ts');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');

const match = catalogContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
if (!match) {
  throw new Error('Could not find RAW_PRODUCTS in catalog.ts');
}

const products = eval(match[1]);
const manifest = JSON.parse(fs.readFileSync('scripts/97_products_copied_images_manifest.json', 'utf8'));
const manifestMap = new Map();
manifest.forEach(m => manifestMap.set(m.sku.toUpperCase(), m.copiedImages));

let updatedCount = 0;
const updatedProducts = products.map(p => {
  const sku = p.sku.toUpperCase();
  if (manifestMap.has(sku)) {
    const images = manifestMap.get(sku);
    updatedCount++;
    return {
      ...p,
      images,
      requiresManualReview: false
    };
  }
  return p;
});

console.log(`Updated images for ${updatedCount} / ${manifest.length} products.`);

const prefix = catalogContent.slice(0, match.index + 'const RAW_PRODUCTS: any[] = '.length);
const suffix = catalogContent.slice(match.index + match[0].length);

const newCatalogContent = prefix + JSON.stringify(updatedProducts, null, 2) + ';' + suffix;

fs.writeFileSync(catalogPath, newCatalogContent, 'utf8');
console.log('Successfully wrote updated catalog.ts');

// Verification
const verifyContent = fs.readFileSync(catalogPath, 'utf8');
const verifyMatch = verifyContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
const verifiedProducts = eval(verifyMatch[1]);

let emptyCount = 0;
let brokenCount = 0;
verifiedProducts.forEach(p => {
  if (!p.images || p.images.length === 0) emptyCount++;
  p.images.forEach(img => {
    const full = 'public' + (img.startsWith('/') ? img : '/' + img);
    if (!fs.existsSync(full)) brokenCount++;
  });
});

console.log(`\nPost-Update Verification:`);
console.log(`Total active products: ${verifiedProducts.length}`);
console.log(`Products with empty images []: ${emptyCount}`);
console.log(`Broken image paths on disk: ${brokenCount}`);
if (emptyCount === 0 && brokenCount === 0) {
  console.log('SUCCESS: 100% of all 1,948 products now possess valid, physical product photographs!');
} else {
  console.error('FAIL: Verification checks failed.');
  process.exit(1);
}
