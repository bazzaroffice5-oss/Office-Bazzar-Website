import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';
import * as fs from 'fs';

const skusText = fs.readFileSync('scripts/skus_requiring_manual_replacement.txt', 'utf8');
const lines = skusText.trim().split('\n');

const fullInfo: any[] = [];
for (const line of lines) {
  const [sku, name, cat, reason] = line.split(' | ');
  const prod = INITIAL_PRODUCTS.find(p => p.sku === sku);
  if (prod) {
    fullInfo.push({
      sku: prod.sku,
      name: prod.name,
      brand: prod.brandName,
      category: prod.categoryName,
      subcategory: prod.subcategoryName,
      packSize: prod.packSize,
      specs: prod.specifications,
      currentImg: prod.images[0],
      reason
    });
  }
}

console.log(`Analyzed ${fullInfo.length} SKUs.`);

// Group by brand
const byBrand: Record<string, any[]> = {};
for (const item of fullInfo) {
  if (!byBrand[item.brand]) byBrand[item.brand] = [];
  byBrand[item.brand].push(item);
}

for (const [brand, items] of Object.entries(byBrand)) {
  console.log(`Brand "${brand}": ${items.length} items`);
  items.forEach(it => console.log(`  - [${it.sku}] ${it.name}`));
}

fs.writeFileSync('scripts/replacement_detailed_manifest.json', JSON.stringify(fullInfo, null, 2), 'utf8');

