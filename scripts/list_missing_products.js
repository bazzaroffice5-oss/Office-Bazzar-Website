const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

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

const missing = catalogProducts.filter(p => p.images.length === 0);

console.log('--- ALL 212 MISSING PRODUCTS ---');
missing.forEach(p => {
  console.log(`${p.sku.padEnd(14)} | ${p.categoryId.padEnd(25)} | ${p.brand.padEnd(18)} | ${p.name}`);
});

