import { INITIAL_PRODUCTS, CATEGORIES } from '../src/lib/data/catalog';
import fs from 'fs';

console.log('Total INITIAL_PRODUCTS:', INITIAL_PRODUCTS.length);
console.log('Total CATEGORIES:', CATEGORIES.length);

const active = INITIAL_PRODUCTS.filter(p => p.isActive !== false);
console.log('Active products:', active.length);
const inactive = INITIAL_PRODUCTS.filter(p => p.isActive === false);
console.log('Inactive products:', inactive.length, inactive.map(p => p.sku));

fs.writeFileSync('catalog_products_dump.json', JSON.stringify(INITIAL_PRODUCTS, null, 2), 'utf8');
console.log('Dumped to catalog_products_dump.json');

