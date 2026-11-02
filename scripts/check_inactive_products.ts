import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

const p1 = INITIAL_PRODUCTS.find(p => p.sku === 'OB-HOU-1018');
const p2 = INITIAL_PRODUCTS.find(p => p.sku === 'OB-TIS-1096');

console.log('OB-HOU-1018:', JSON.stringify(p1, null, 2));
console.log('OB-TIS-1096:', JSON.stringify(p2, null, 2));

