const fs = require('fs');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// Test replacing images for each product
const regex = /(\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"images\":\s*\[)([\s\S]*?)(\])/g;

let count = 0;
const updated = content.replace(regex, (match, prefix, sku, inner, suffix) => {
  count++;
  return `${prefix}\n      "/assets/products/catalog_2026/${sku}.webp"\n    ${suffix}`;
});

console.log('Total matches replaced:', count);

