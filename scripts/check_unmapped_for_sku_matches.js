const fs = require('fs');
const path = require('path');

const catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim().replace(/;\s*$/, '');
const products = JSON.parse(block);

const placeholders = products.filter(p => !p.images || p.images.length === 0);
console.log('Placeholders count:', placeholders.length);

// Get all files in Office Bazzar New Images
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else {
      results.push({ name: file, full });
    }
  });
  return results;
}

const allSupplierFiles = getFiles('Office Bazzar New Images');
console.log('Total supplier files:', allSupplierFiles.length);

const matchedBySku = [];
for (const p of placeholders) {
  const sku = p.sku.toLowerCase();
  for (const f of allSupplierFiles) {
    if (f.name.toLowerCase().includes(sku)) {
      matchedBySku.push({ sku: p.sku, name: p.name, file: f.name });
    }
  }
}

console.log('Unmapped products with SKU matching supplier filename:', matchedBySku.length);
if (matchedBySku.length > 0) {
  console.log(matchedBySku);
}

