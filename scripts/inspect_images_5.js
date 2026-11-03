const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const skus = ['OB-102', 'OB-104', 'OB-COV-05', 'OB-078', 'OB-027'];
skus.forEach(sku => {
  const idx = cat.indexOf(`"sku": "${sku}"`);
  const block = cat.slice(idx, idx + 600);
  const imgM = block.match(/"images":\s*\[([\s\S]*?)\]/);
  console.log(`${sku} images:`, imgM ? imgM[0] : 'not found');
});
