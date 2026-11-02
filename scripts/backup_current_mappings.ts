import * as fs from 'fs';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

// Backup catalog.ts
fs.copyFileSync('src/lib/data/catalog.ts', 'src/lib/data/catalog.backup.ts');
console.log('Backed up src/lib/data/catalog.ts to src/lib/data/catalog.backup.ts');

// Create a complete backup mapping of existing SKU -> images
const mapping = INITIAL_PRODUCTS.map(p => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  category: p.categoryName,
  images: p.images
}));

fs.writeFileSync('scripts/catalog_image_mapping_backup.json', JSON.stringify(mapping, null, 2), 'utf8');
console.log(`Backed up ${mapping.length} product image mappings to scripts/catalog_image_mapping_backup.json`);
