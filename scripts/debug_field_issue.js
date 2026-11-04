const fs = require('fs');

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

// First 383 are existing, remaining 1425 are new
const existing = products.slice(0, 383);
const newlyCreated = products.slice(383);

console.log(`Existing slice count: ${existing.length}`);
console.log(`Newly created slice count: ${newlyCreated.length}`);

newlyCreated.forEach((p, i) => {
  if (!p.name || p.name.trim().length < 2) console.log(`Issue in new product #${i}: name "${p.name}"`);
  if (!p.categoryId || !['housekeeping-hygiene', 'office-stationery', 'packaging-supplies', 'printers-technology'].includes(p.categoryId)) console.log(`Issue in new product #${i} (${p.sku}): categoryId "${p.categoryId}"`);
  if (!p.subcategoryId) console.log(`Issue in new product #${i} (${p.sku}): subcategoryId missing`);
  if (!p.brandId || !p.brandName) console.log(`Issue in new product #${i} (${p.sku}): brand missing`);
  if (!p.description || p.description.trim().length < 10) console.log(`Issue in new product #${i} (${p.sku}): description short`);
  if (!p.images || p.images.length === 0) console.log(`Issue in new product #${i} (${p.sku}): no images`);
});

