const { PRODUCTS_DATA } = require('./scripts/extract_catalogue_products.js');

console.log('Total PRODUCTS_DATA:', PRODUCTS_DATA.length);

const pageMap = {};
for (const p of PRODUCTS_DATA) {
  if (!pageMap[p.page]) pageMap[p.page] = [];
  pageMap[p.page].push(p);
}

for (const [page, items] of Object.entries(pageMap)) {
  console.log(`Page ${page}: ${items.length} items (SKUs: ${items[0].code} to ${items[items.length - 1].code})`);
}

