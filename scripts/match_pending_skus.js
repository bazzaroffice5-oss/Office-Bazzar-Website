const fs = require('fs');

const pendingContent = fs.readFileSync('scripts/skus_requiring_manual_replacement.txt', 'utf8');
const inv = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8')).filter(i => i.isImage && !i.isCorrupted);

const lines = pendingContent.split('\n');
const pendingSkus = [];

lines.forEach(l => {
  const match = l.match(/\[PENDING\]\s+(OB-[A-Z0-9-]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)/);
  if (match) {
    pendingSkus.push({
      sku: match[1].trim(),
      name: match[2].trim(),
      category: match[3].trim()
    });
  }
});

console.log(`Auditing all ${pendingSkus.length} pending SKUs against 2,369 package...`);

function clean(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getWords(str) {
  return clean(str).split(' ').filter(w => w.length > 2 && !['and', 'the', 'with', 'for', 'all', 'set', 'pcs'].includes(w));
}

let foundCount = 0;
const results = [];

pendingSkus.forEach(p => {
  const pWords = getWords(p.name);
  const candidates = [];

  for (const img of inv) {
    const imgWords = getWords(img.fileName + ' ' + img.relPath);
    let overlap = 0;
    for (const w of pWords) {
      if (imgWords.includes(w)) overlap++;
    }

    if (overlap >= Math.min(2, pWords.length)) {
      candidates.push({
        img: img.relPath,
        overlap,
        fileName: img.fileName
      });
    }
  }

  candidates.sort((a, b) => b.overlap - a.overlap);
  if (candidates.length > 0) foundCount++;

  results.push({
    sku: p.sku,
    name: p.name,
    matched: candidates.length > 0,
    bestMatch: candidates[0] || null,
    totalCandidates: candidates.length
  });
});

console.log(`Found candidate images for ${foundCount}/${pendingSkus.length} pending SKUs!`);

fs.writeFileSync('pending_skus_matched_in_package.json', JSON.stringify(results, null, 2), 'utf8');

console.log('\nSample 15 matches for pending SKUs:');
results.filter(r => r.matched).slice(0, 15).forEach(r => {
  console.log(`[${r.sku}] ${r.name}`);
  console.log(`   -> Best: ${r.bestMatch.img} (${r.bestMatch.overlap} word matches)\n`);
});

const notFound = results.filter(r => !r.matched);
console.log(`\nPending SKUs without candidates (${notFound.length}):`);
notFound.forEach(r => console.log(`[${r.sku}] ${r.name}`));

