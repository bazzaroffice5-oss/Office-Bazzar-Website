const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const lines = cat.split('\n');

let inLegacy = false;
let currentSlug = '';
let currentItemCount = 0;

for (let i = 0; i < 130; i++) {
  const line = lines[i];
  if (line.includes('export const LEGACY_CATEGORIES')) {
    inLegacy = true;
  }
  if (inLegacy) {
    const slugM = line.match(/"slug":\s*"([^"]+)"/);
    if (slugM) currentSlug = slugM[1];
    const countM = line.match(/"itemCount":\s*(\d+)/);
    if (countM) {
      console.log(`Legacy category: ${currentSlug} -> itemCount: ${countM[1]}`);
    }
  }
}
