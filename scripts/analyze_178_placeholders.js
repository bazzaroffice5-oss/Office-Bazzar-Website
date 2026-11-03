const fs = require('fs');
const path = require('path');

const rawCatalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const regex = /\{\s*\"id\":\s*\"([^\"]+)\"[\s\S]*?\"name\":\s*\"([^\"]+)\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"categoryId\":\s*\"([^\"]+)\"[\s\S]*?\"brandName\":\s*\"([^\"]+)\"[\s\S]*?\"images\":\s*\[([\s\S]*?)\]/g;

const catalogProducts = [];
let match;
while ((match = regex.exec(rawCatalogContent)) !== null) {
  const imgs = match[6].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  catalogProducts.push({
    id: match[1],
    name: match[2],
    sku: match[3],
    categoryId: match[4],
    brand: match[5],
    images: imgs
  });
}

const placeholders = catalogProducts.filter(p => p.images.length === 0);
console.log(`Total catalog products: ${catalogProducts.length}`);
console.log(`Placeholder products: ${placeholders.length}`);

// Group by categoryId
const byCategory = {};
for (const p of placeholders) {
  byCategory[p.categoryId] = (byCategory[p.categoryId] || 0) + 1;
}

console.log('\n--- Placeholder Products by Category ---');
for (const [cat, count] of Object.entries(byCategory).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(30)}: ${count}`);
}

fs.writeFileSync('scripts/placeholders_178.json', JSON.stringify(placeholders, null, 2), 'utf8');
