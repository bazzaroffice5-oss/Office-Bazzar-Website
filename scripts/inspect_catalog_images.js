const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const lines = cat.split('\n');

let currentSku = '';
let currentName = '';
let currentImages = [];
let inImages = false;

const products = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const skuMatch = line.match(/"sku":\s*"([^"]+)"/);
  if (skuMatch) currentSku = skuMatch[1];

  const nameMatch = line.match(/"name":\s*"([^"]+)"/);
  if (nameMatch && !currentName) currentName = nameMatch[1];

  if (line.includes('"images": [')) {
    inImages = true;
    currentImages = [];
    continue;
  }
  if (inImages) {
    if (line.includes(']')) {
      inImages = false;
      products.push({ sku: currentSku, name: currentName, images: currentImages });
      currentSku = '';
      currentName = '';
      currentImages = [];
    } else {
      const imgMatch = line.match(/"([^"]+)"/);
      if (imgMatch) {
        currentImages.push(imgMatch[1]);
      }
    }
  }
}

console.log('Total parsed products:', products.length);

const placeholderProds = products.filter(p => p.images.some(img => img.includes('placeholder-product.svg')));
const catalog2026Prods = products.filter(p => p.images.some(img => img.includes('catalog_2026')));
const otherProds = products.filter(p => !p.images.some(img => img.includes('placeholder-product.svg')) && !p.images.some(img => img.includes('catalog_2026')));

console.log('Using placeholder:', placeholderProds.length);
console.log('Using catalog_2026:', catalog2026Prods.length);
console.log('Other:', otherProds.length);

console.log('\n--- First 30 Placeholder Products ---');
placeholderProds.slice(0, 30).forEach((p, idx) => {
  console.log(`${(idx + 1).toString().padStart(3, ' ')}. [${p.sku}] ${p.name}`);
});
