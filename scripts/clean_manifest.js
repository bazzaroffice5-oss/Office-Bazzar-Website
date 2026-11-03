const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));
const cleanManifest = manifest.filter(m => m.sku !== 'OB-FIL-34');

console.log(`Original manifest: ${manifest.length}`);
console.log(`Cleaned manifest: ${cleanManifest.length}`);

fs.writeFileSync('scripts/office_bazzar_active_catalog_manifest.json', JSON.stringify(cleanManifest, null, 2), 'utf8');
