const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

function findProductBySlug(slug) {
  const idx = cat.indexOf(`"slug": "${slug}"`);
  if (idx === -1) return null;
  const startObj = cat.lastIndexOf('{\n    "id":', idx);
  const endObj = cat.indexOf('\n  },', idx);
  return cat.slice(startObj, endObj + 4);
}

console.log('=== PRODUCT 1: kangaro-staplers-hd-10d-1 ===');
console.log(findProductBySlug('kangaro-staplers-hd-10d-1'));

console.log('\n=== PRODUCT 2: tissue-paper-napkin-1 ===');
console.log(findProductBySlug('tissue-paper-napkin-1'));
