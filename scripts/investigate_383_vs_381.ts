import { INITIAL_PRODUCTS, CATEGORIES } from '../src/lib/data/catalog';

console.log('=== COUNT AUDIT ===');
console.log('INITIAL_PRODUCTS length:', INITIAL_PRODUCTS.length);

const categoryCounts: Record<string, number> = {};
for (const p of INITIAL_PRODUCTS) {
  categoryCounts[p.categoryId] = (categoryCounts[p.categoryId] || 0) + 1;
}
console.log('Category breakdown in INITIAL_PRODUCTS:', categoryCounts);

for (const cat of CATEGORIES) {
  console.log(`Category [${cat.id}] (${cat.name}): configured itemCount = ${cat.itemCount}, actual products = ${categoryCounts[cat.id] || 0}`);
}

const activeProducts = INITIAL_PRODUCTS.filter(p => p.isActive !== false);
console.log('Active products (isActive !== false):', activeProducts.length);
const inactiveProducts = INITIAL_PRODUCTS.filter(p => p.isActive === false);
console.log('Inactive products (isActive === false):', inactiveProducts.length, inactiveProducts.map(p => ({ sku: p.sku, name: p.name })));

// Check unique IDs and SKUs
const uniqueIds = new Set(INITIAL_PRODUCTS.map(p => p.id));
const uniqueSkus = new Set(INITIAL_PRODUCTS.map(p => p.sku));
console.log('Unique IDs:', uniqueIds.size);
console.log('Unique SKUs:', uniqueSkus.size);

