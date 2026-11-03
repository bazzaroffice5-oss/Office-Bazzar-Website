const fs = require('fs');
const store = fs.readFileSync('src/lib/db/store.ts', 'utf8');

const matches = [];
const lines = store.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('getCategories') || l.includes('itemCount') || l.includes('getProducts')) {
    matches.push(`Line ${idx + 1}: ${l}`);
  }
});

console.log(matches.slice(0, 30).join('\n'));
