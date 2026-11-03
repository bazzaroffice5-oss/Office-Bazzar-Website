const fs = require('fs');
const path = require('path');
const c = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const matches = [...c.matchAll(/\/assets\/products\/catalog_2026\/[^"'\n\s]+/g)].map(m => m[0]);
console.log('Total catalog_2026 image references in catalog.ts:', matches.length);

let missingDisk = 0;
const uniqueMatches = [...new Set(matches)];
for (const m of uniqueMatches) {
  const full = path.join('public', m);
  if (!fs.existsSync(full)) {
    console.error('Missing on disk:', m);
    missingDisk++;
  }
}
console.log('Unique image URLs referenced:', uniqueMatches.length);
console.log('Missing on disk:', missingDisk);

