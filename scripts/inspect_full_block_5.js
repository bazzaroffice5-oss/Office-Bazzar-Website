const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const skus = ['OB-102', 'OB-104', 'OB-COV-05', 'OB-078', 'OB-027'];
skus.forEach(sku => {
  const idx = cat.indexOf(`"sku": "${sku}"`);
  console.log(`\n================= ${sku} =================`);
  console.log(cat.slice(idx, idx + 800));
});
