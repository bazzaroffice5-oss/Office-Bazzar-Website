const fs = require('fs');
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const startIdx = content.indexOf('const RAW_PRODUCTS: any[] = [');
const endIdx = content.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const rawText = content.substring(startIdx + 'const RAW_PRODUCTS: any[] = '.length, endIdx).trim().replace(/;\s*$/, '');
const products = eval(rawText);

const jk = products.find(p => p.slug.includes('jk-copier'));
console.log('JK Copier Product:', {
  id: jk.id,
  name: jk.name,
  sku: jk.sku,
  price: jk.price,
  minPrice: jk.minPrice,
  maxPrice: jk.maxPrice,
  tierPricing: jk.tierPricing,
  inStock: jk.inStock
});

const withPrice = products.filter(p => typeof p.price === 'number' && p.price > 0);
console.log('Total products with price > 0:', withPrice.length);
if (withPrice.length > 0) {
  console.log('Sample product with price:', withPrice[0].name, withPrice[0].price);
}
