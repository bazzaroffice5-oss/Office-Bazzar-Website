const fs = require('fs');

let cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const updates = [
  { sku: 'OB-102', img: '/assets/products/catalog_2026/OB-102.webp' },
  { sku: 'OB-104', img: '/assets/products/catalog_2026/OB-104.webp' },
  { sku: 'OB-COV-05', img: '/assets/products/catalog_2026/OB-COV-05.webp' },
  { sku: 'OB-078', img: '/assets/products/catalog_2026/OB-078.webp' },
  { sku: 'OB-027', img: '/assets/products/catalog_2026/OB-027.webp' }
];

for (const u of updates) {
  const skuIdx = cat.indexOf(`"sku": "${u.sku}"`);
  if (skuIdx === -1) {
    console.error(`SKU not found: ${u.sku}`);
    continue;
  }
  const afterSku = cat.slice(skuIdx, skuIdx + 1000);
  const imagesIdx = afterSku.indexOf('"images": []');
  if (imagesIdx === -1) {
    console.error(`images [] not found after SKU ${u.sku}`);
    continue;
  }
  const absIdx = skuIdx + imagesIdx;
  cat = cat.slice(0, absIdx) + `"images": [\n      "${u.img}"\n    ]` + cat.slice(absIdx + '"images": []'.length);
  console.log(`Updated images for ${u.sku} -> ${u.img}`);
}

fs.writeFileSync('src/lib/data/catalog.ts', cat, 'utf8');
console.log('Successfully saved src/lib/data/catalog.ts');

