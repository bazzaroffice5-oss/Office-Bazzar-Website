const fs = require('fs');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const regex = /"images":\s*\[\s*"([^"]+)"/g;
let match;
const prefixes = {};
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  const p = match[1].split('/').slice(0, 4).join('/');
  prefixes[p] = (prefixes[p] || 0) + 1;
}
console.log('Total products with images:', count);
console.log('Prefixes:', JSON.stringify(prefixes, null, 2));
