const fs = require('fs');
const path = require('path');

// 1. Load placeholder products
const placeholderProducts = JSON.parse(fs.readFileSync('scripts/placeholder_products_audit.json', 'utf8'));
console.log('Total placeholder products to investigate:', placeholderProducts.length);

// 2. Scan all files in Office Bazzar New Images
const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      const ext = path.extname(dirent.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        results.push({
          fullPath: full,
          relPath: path.relative(SOURCE_DIR, full),
          name: dirent.name,
          base: path.basename(dirent.name, ext).toLowerCase()
        });
      }
    }
  }
  return results;
}

const archiveImages = walk(SOURCE_DIR);
console.log('Total image files in Office Bazzar New Images:', archiveImages.length);

// 3. For each placeholder product, search for keywords
const potentialMatches = [];

for (const prod of placeholderProducts) {
  const prodNameLower = prod.name.toLowerCase();
  const prodSkuLower = prod.sku.toLowerCase();
  
  // Clean tokens from product name
  const stopWords = new Set(['and', 'with', 'for', 'pack', 'nos', 'inch', 'size', 'mm', 'cm', 'set', 'box', 'roll', 'of', 'the', 'in', 'pkt', 'mtr']);
  const tokens = prodNameLower
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));

  const candidates = [];
  for (const img of archiveImages) {
    const imgBase = img.base.replace(/[^a-z0-9]/g, ' ');
    
    // Check SKU match
    if (imgBase.includes(prodSkuLower.replace(/[^a-z0-9]/g, ' '))) {
      candidates.push({ img: img.relPath, score: 100, reason: 'SKU match' });
      continue;
    }

    // Check token match
    let matchCount = 0;
    for (const t of tokens) {
      if (imgBase.includes(t)) matchCount++;
    }

    if (tokens.length > 0 && matchCount >= Math.min(tokens.length, 3) && matchCount >= 2) {
      candidates.push({
        img: img.relPath,
        score: Math.round((matchCount / tokens.length) * 100),
        reason: `${matchCount}/${tokens.length} tokens matched`
      });
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    potentialMatches.push({
      sku: prod.sku,
      name: prod.name,
      category: prod.categoryName || prod.categoryId,
      candidates: candidates.slice(0, 3)
    });
  }
}

console.log(`Found potential supplier matches for ${potentialMatches.length} / ${placeholderProducts.length} placeholder products.`);
fs.writeFileSync('scripts/deep_placeholder_matches.json', JSON.stringify(potentialMatches, null, 2));

// Print top candidates
for (const p of potentialMatches.slice(0, 25)) {
  console.log(`\n[${p.sku}] ${p.name} (${p.category})`);
  p.candidates.forEach(c => console.log(`  -> ${c.score}%: ${c.img} (${c.reason})`));
}

