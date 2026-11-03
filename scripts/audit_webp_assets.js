const fs = require('fs');
const path = require('path');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const referenced = new Set();
const matches = cat.match(/\/assets\/products\/catalog_2026\/[^"'`\s]+/g) || [];
matches.forEach(f => referenced.add(path.basename(f)));

const dir = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));

console.log('Total WebP files in public/assets/products/catalog_2026:', files.length);
console.log('Unique WebP files referenced in catalog.ts:', referenced.size);

const unreferenced = files.filter(f => !referenced.has(f));
console.log('Unreferenced count:', unreferenced.length);
if (unreferenced.length > 0) {
  console.log('Unreferenced files:', unreferenced);
}

// Categorize primary vs alternate angle assets
let primaryCount = 0;
let alternateCount = 0;
for (const file of referenced) {
  if (file.includes('-angle-') || file.includes('-extra-') || file.includes('-2.webp') || file.includes('-3.webp') || file.includes('-4.webp') || file.includes('-5.webp')) {
    alternateCount++;
  } else {
    primaryCount++;
  }
}

console.log('Primary image assets:', primaryCount);
console.log('Alternate angle/gallery assets:', alternateCount);
