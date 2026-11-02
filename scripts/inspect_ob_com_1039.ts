import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

const p = INITIAL_PRODUCTS.find(x => x.sku === 'OB-COM-1039');
console.log('OB-COM-1039:', JSON.stringify(p, null, 2));
