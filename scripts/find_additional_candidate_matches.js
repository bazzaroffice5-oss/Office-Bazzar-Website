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
console.log(`Checking ${missing.length} missing products...`);

let possibleCandidates = [];

for (const p of missing) {
  // Extract keywords (words > 4 chars, not common words)
  const words = p.name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'black', 'white', 'pack', 'piece', 'size', 'inch', 'chennai', 'super', 'heavy', 'duty'].includes(w));
  
  const matches = validImages.filter(img => {
    const fn = img.name.toLowerCase();
    const rel = img.rel.toLowerCase();
    // match brand or model
    const pBrand = p.brand ? p.brand.toLowerCase() : '';
    if (pBrand && pBrand.length > 3 && (fn.includes(pBrand) || rel.includes(pBrand))) {
      // check if any key word matches
      const matchWords = words.filter(w => fn.includes(w) || rel.includes(w));
      return matchWords.length >= 2;
    }
    const matchWords = words.filter(w => fn.includes(w));
    return matchWords.length >= 3;
  });

  if (matches.length > 0) {
    possibleCandidates.push({
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      candidates: matches.map(m => m.rel)
    });
  }
}

console.log(`Found ${possibleCandidates.length} products with potential candidate matches in Office Bazzar New Images:`);
possibleCandidates.forEach(c => {
  console.log(`\nSKU: ${c.sku} | Brand: ${c.brand} | Name: ${c.name}`);
  c.candidates.slice(0, 5).forEach(img => console.log(`   -> ${img}`));
});

