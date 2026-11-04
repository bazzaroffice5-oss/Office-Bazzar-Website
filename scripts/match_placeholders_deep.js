const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

// Read catalog
const catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim().replace(/;\s*$/, '');
const products = JSON.parse(block);

const placeholders = products.filter(p => !p.images || p.images.length === 0);
console.log('Placeholders count:', placeholders.length);

// Let's analyze potential matches across all folders for each placeholder!
const candidates = [];

for (const p of placeholders) {
  const pName = p.name.toLowerCase();
  const pSub = (p.subcategoryName || '').toLowerCase();
  const pCat = (p.categoryName || '').toLowerCase();

  // Search through all 2369 files
  const matches = [];
  for (const f of allFiles) {
    const fn = f.filename.toLowerCase();
    const rel = f.relativePath.toLowerCase();

    // Check relevant keywords
    let score = 0;
    const words = pName.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    for (const w of words) {
      if (fn.includes(w)) score += 2;
      else if (rel.includes(w)) score += 1;
    }

    if (score >= 4) {
      matches.push({ file: f.relativePath, filename: f.filename, folder: f.folder, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  if (matches.length > 0) {
    candidates.push({
      sku: p.sku,
      name: p.name,
      cat: p.categoryName,
      sub: p.subcategoryName,
      topMatches: matches.slice(0, 5)
    });
  }
}

console.log(`Placeholders with high-scoring candidate matches: ${candidates.length}`);
candidates.forEach(c => {
  console.log(`\n[${c.sku}] ${c.name} (${c.cat} > ${c.sub})`);
  c.topMatches.forEach(m => console.log(`   score ${m.score} | [${m.folder}] ${m.filename}`));
});

