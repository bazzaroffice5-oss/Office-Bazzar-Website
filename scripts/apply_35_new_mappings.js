const fs = require('fs');

const applied = JSON.parse(fs.readFileSync('scripts/applied_new_mappings.json', 'utf8'));
const mappingMap = new Map();
applied.forEach(item => mappingMap.set(item.sku, item.imagePath));

const catFile = 'src/lib/data/catalog.ts';
let catContent = fs.readFileSync(catFile, 'utf8');

const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const prefix = catContent.substring(0, startIdx + 'const RAW_PRODUCTS: Product[] = '.length);
const suffix = catContent.substring(endIdx);
const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim().replace(/;\s*$/, '');

const products = JSON.parse(block);

let updatedCount = 0;
for (const p of products) {
  if (mappingMap.has(p.sku)) {
    const newImg = mappingMap.get(p.sku);
    p.images = [newImg];
    updatedCount++;
  }
}

console.log(`Updated ${updatedCount} products in RAW_PRODUCTS!`);

const formattedProducts = JSON.stringify(products, null, 2);
const newCatContent = prefix + formattedProducts + ';\n\n' + suffix;

fs.writeFileSync(catFile, newCatContent, 'utf8');
console.log('Successfully wrote updated catalog.ts');
