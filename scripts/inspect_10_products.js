const fs = require('fs');

const targetSlugs = [
  'pin-up-notice-board',
  'white-board-for-school',
  'golden-letter-for-welcome-board',
  'canon-ep-303-toner-cartridge',
  'samsung-mlt-d116s-black-toner-cartridge-packaging-type-box',
  'hp-678-tri-color-ink-cartridge-cz108aa',
  'alkosign-horizontal-sliding-board',
  'alkosign-pegboard',
  'humic-acid-liquid',
  'external-hard-disk'
];

// Let's load INITIAL_PRODUCTS dynamically or parse it
// Since catalog.ts is typescript, let's see how products are exported or use ts-node / regex / ast / evaluation
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

targetSlugs.forEach((slug, idx) => {
  // Find where the slug is defined in INITIAL_PRODUCTS
  const slugIndex = catalogContent.indexOf(`"slug": "${slug}"`);
  if (slugIndex !== -1) {
    // Find the opening brace of this product object
    const startObj = catalogContent.lastIndexOf('{', slugIndex);
    // Find the closing brace of this product object (handling nested objects)
    let braceCount = 0;
    let endObj = -1;
    for (let i = startObj; i < catalogContent.length; i++) {
      if (catalogContent[i] === '{') braceCount++;
      else if (catalogContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endObj = i + 1;
          break;
        }
      }
    }
    const productStr = catalogContent.substring(startObj, endObj);
    try {
      // Evaluate or parse JSON
      const product = JSON.parse(productStr);
      console.log(`\n================== PRODUCT ${idx + 1} ==================`);
      console.log(`Title: ${product.name}`);
      console.log(`SKU: ${product.sku}`);
      console.log(`ID: ${product.id}`);
      console.log(`Slug: ${product.slug}`);
      console.log(`Primary Image: ${product.images?.[0]}`);
      console.log(`All Images: ${JSON.stringify(product.images)}`);
    } catch (e) {
      console.log(`Could not JSON parse product ${slug}:`, e.message);
      // print snippet
      console.log(productStr.substring(0, 300));
    }
  } else {
    console.log(`Slug not found: ${slug}`);
  }
});
