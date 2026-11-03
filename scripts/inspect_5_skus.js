const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const skus = ['OB-102', 'OB-104', 'OB-COV-05', 'OB-078', 'OB-027'];
skus.forEach(sku => {
  const idx = cat.indexOf(`"sku": "${sku}"`);
  if (idx !== -1) {
    console.log(`\n--- SKU: ${sku} ---`);
    console.log(cat.slice(idx - 100, idx + 300));
  } else {
    console.log(`SKU NOT FOUND: ${sku}`);
  }
});
