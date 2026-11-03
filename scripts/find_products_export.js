const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const lines = cat.split('\n');
lines.forEach((l, idx) => {
  if (l.startsWith('export const') && (l.includes('Product') || l.includes('PRODUCTS'))) {
    console.log(`Line ${idx + 1}: ${l}`);
  }
});
