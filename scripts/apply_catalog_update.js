const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const regex = /(\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"images\":\s*\[)([\s\S]*?)(\])/g;

let count = 0;
const skusChecked = [];
const updated = content.replace(regex, (match, prefix, sku, inner, suffix) => {
  count++;
  skusChecked.push(sku);
  return `${prefix}\n      "/assets/products/catalog_2026/${sku}.webp"\n    ${suffix}`;
});

console.log(`Replaced ${count} product images.`);

// Verify each generated file exists on disk
let missingDisk = 0;
for (const sku of skusChecked) {
  const p = path.join('public', 'assets', 'products', 'catalog_2026', `${sku}.webp`);
  if (!fs.existsSync(p)) {
    console.error(`Missing on disk: ${p}`);
    missingDisk++;
  }
}
console.log(`Missing on disk: ${missingDisk} / ${skusChecked.length}`);

// Write updated catalog.ts
fs.writeFileSync('src/lib/data/catalog.ts', updated, 'utf8');
console.log('Successfully wrote updated catalog.ts!');

