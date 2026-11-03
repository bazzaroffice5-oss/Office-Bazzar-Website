const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

for (const m of manifest) {
  if (!cat.includes(`"sku": "${m.sku}"`)) {
    console.log('Manifest SKU not in catalog:', m.sku);
  }
}
