const fs = require('fs');

let content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// Match any /assets/products/prepared_1200/(OB-[A-Z0-9-]+)[^"'\n]*
const categoryImgRegex = /\/assets\/products\/prepared_1200\/(OB-[A-Z0-9]+)[^"'\n]*/g;

let count = 0;
content = content.replace(categoryImgRegex, (match, sku) => {
  count++;
  return `/assets/products/catalog_2026/${sku}.webp`;
});

console.log('Replaced category imageUrl matches:', count);
fs.writeFileSync('src/lib/data/catalog.ts', content, 'utf8');

