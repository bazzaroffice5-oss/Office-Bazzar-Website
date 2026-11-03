const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const rawStart = cat.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = cat.indexOf('export const INITIAL_PRODUCTS: Product[] =');
const rawStr = cat.slice(rawStart, rawEnd);

const prods = [];
const blocks = rawStr.split(/\n\s*\{\s*\n\s*"id":/);

for (let i = 1; i < blocks.length; i++) {
  const b = '{\n    "id":' + blocks[i];
  const catIdM = b.match(/"categoryId":\s*"([^"]+)"/);
  const catNameM = b.match(/"categoryName":\s*"([^"]+)"/);
  const subIdM = b.match(/"subcategoryId":\s*"([^"]+)"/);
  const subNameM = b.match(/"subcategoryName":\s*"([^"]+)"/);

  prods.push({
    categoryId: catIdM ? catIdM[1] : '',
    categoryName: catNameM ? catNameM[1] : '',
    subcategoryId: subIdM ? subIdM[1] : '',
    subcategoryName: subNameM ? subNameM[1] : ''
  });
}

console.log('Total products:', prods.length);

const catCounts = {};
const subCounts = {};

prods.forEach(p => {
  catCounts[p.categoryId] = (catCounts[p.categoryId] || 0) + 1;
  if (p.subcategoryId) {
    subCounts[p.subcategoryId] = (subCounts[p.subcategoryId] || 0) + 1;
  }
});

console.log('\nCategory counts in catalog:');
console.table(catCounts);

console.log('\nSubcategory counts in catalog:');
console.table(subCounts);

