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

const placeholders = catalogProducts.filter(p => p.images.length === 0);
console.log(`Analyzing ${placeholders.length} placeholder products...`);

// Let's inspect folders in Office Bazzar New Images
// Find all files in each folder to see if any can match
const potentialMatches = [];

for (const p of placeholders) {
  const nameLower = p.name.toLowerCase();
  const brandLower = (p.brand || '').toLowerCase();
  
  // Clean tokens
  const tokens = nameLower
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !['pack', 'piece', 'with', 'and', 'for', 'the', 'box', 'set'].includes(t));

  for (const img of validImages) {
    const fnLower = img.name.toLowerCase();
    const relLower = img.rel.toLowerCase();

    // Check high precision match
    let matchScore = 0;
    for (const t of tokens) {
      if (fnLower.includes(t)) matchScore++;
    }

    if (matchScore >= 3 || (matchScore >= 2 && brandLower && fnLower.includes(brandLower))) {
      potentialMatches.push({
        sku: p.sku,
        name: p.name,
        category: p.categoryId,
        brand: p.brand,
        imageRel: img.rel,
        score: matchScore
      });
    }
  }
}

console.log(`Found ${potentialMatches.length} raw matches.`);

// Group by SKU
const bySku = {};
for (const m of potentialMatches) {
  if (!bySku[m.sku]) bySku[m.sku] = [];
  bySku[m.sku].push(m);
}

for (const [sku, matches] of Object.entries(bySku)) {
  console.log(`\nSKU: ${sku} | ${matches[0].name} (${matches[0].brand})`);
  matches.sort((a,b) => b.score - a.score).slice(0, 3).forEach(m => {
    console.log(`   score ${m.score}: ${m.imageRel}`);
  });
}

