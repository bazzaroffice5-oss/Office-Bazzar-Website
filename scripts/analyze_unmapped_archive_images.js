const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));

const mappedSources = new Set();
for (const m of manifest) {
  mappedSources.add(m.primarySource.replace(/\\/g, '/'));
  for (const alt of m.altSources) {
    mappedSources.add(alt.replace(/\\/g, '/'));
  }
}

const unmapped = inventory.filter(f => f.isImage && !mappedSources.has(f.rel.replace(/\\/g, '/')));
console.log(`Total valid images: ${inventory.filter(f => f.isImage).length}`);
console.log(`Currently mapped sources: ${mappedSources.size}`);
console.log(`Unmapped valid images: ${unmapped.length}`);

const byFolder = {};
for (const f of unmapped) {
  const folder = f.rel.split(path.sep)[0];
  byFolder[folder] = (byFolder[folder] || 0) + 1;
}

console.log('\n--- Unmapped Images by Folder ---');
for (const [k, v] of Object.entries(byFolder).sort((a,b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(30)}: ${v}`);
}
