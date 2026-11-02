const fs = require('fs');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const start = content.indexOf('const RAW_PRODUCTS: Product[] = [');
const end = content.indexOf('export const INITIAL_PRODUCTS: Product[]');
const rawProductsSlice = content.substring(start + 'const RAW_PRODUCTS: Product[] = '.length, end).trim();
const existing = eval(rawProductsSlice.replace(/;\s*$/, ''));
const manifest = JSON.parse(fs.readFileSync('public/assets/products/extraction_manifest.json'));

console.log('Existing count:', existing.length);
console.log('Manifest count:', manifest.length);

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

let matchesByCode = 0;
let matchesByName = 0;

const matchedManifest = new Map();
const matchedExisting = new Map();

for (let i = 0; i < existing.length; i++) {
  const ep = existing[i];
  const epNorm = normalize(ep.name);
  const epSku = (ep.sku || '').toUpperCase().trim();
  
  let match = null;
  // Match by exact SKU
  for (const m of manifest) {
    if (epSku && m.code && epSku === m.code.toUpperCase()) {
      match = m;
      matchesByCode++;
      break;
    }
  }
  // Match by normalized name
  if (!match) {
    for (const m of manifest) {
      const mNorm = normalize(m.name);
      if (epNorm === mNorm) {
        match = m;
        matchesByName++;
        break;
      }
    }
  }
  // Fuzzy partial match
  if (!match) {
    for (const m of manifest) {
      const mNorm = normalize(m.name);
      // e.g. "Cardboard Tag File" vs "Cardboard Tag File" or "Taski R1" vs "Taski R1 Super Bathroom Cleaner"
      if (epNorm.length >= 7 && mNorm.length >= 7) {
        if (epNorm === mNorm || (epNorm.startsWith(mNorm) && mNorm.length > 8) || (mNorm.startsWith(epNorm) && epNorm.length > 8)) {
          match = m;
          matchesByName++;
          break;
        }
      }
    }
  }
  
  if (match) {
    matchedManifest.set(match.code, { existing: ep, manifest: match });
    matchedExisting.set(ep.id, { existing: ep, manifest: match });
    console.log(`Matched: [${ep.sku || 'NO-SKU'}] "${ep.name}" <---> [${match.code}] "${match.name}"`);
  }
}

console.log('\nTotal existing matched:', matchedExisting.size, 'Unique manifest items matched:', matchedManifest.size);
console.log('Unmatched existing products count:', existing.length - matchedExisting.size);
console.log('Unmatched manifest products (new additions):', manifest.length - matchedManifest.size);

