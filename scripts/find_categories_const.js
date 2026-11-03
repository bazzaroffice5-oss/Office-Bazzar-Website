const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const lines = cat.split('\n');
lines.forEach((l, idx) => {
  if (l.startsWith('export const CATEGORIES') || l.startsWith('const CATEGORIES')) {
    console.log(`Line ${idx + 1}: ${l}`);
  }
});
