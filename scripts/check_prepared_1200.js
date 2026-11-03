const fs = require('fs');
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const matches = content.match(/prepared_1200[^"\n]*/g);
console.log('Matches in catalog.ts:', matches ? matches.length : 0);
if (matches) {
  for (const m of matches) {
    const idx = content.indexOf(m);
    console.log(content.slice(Math.max(0, idx - 100), idx + 100));
  }
}

