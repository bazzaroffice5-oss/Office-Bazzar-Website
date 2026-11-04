const fs = require('fs');
const path = require('path');

const catDir = 'public/assets/products/catalog_2026';
const catFiles = fs.readdirSync(catDir).filter(f => f.endsWith('.webp'));
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));

// Let's load all previous mapping files to see how catFiles were created
const activeManifest = fs.existsSync('scripts/office_bazzar_active_catalog_manifest.json')
  ? JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'))
  : [];

const appliedNew = fs.existsSync('scripts/applied_new_mappings.json')
  ? JSON.parse(fs.readFileSync('scripts/applied_new_mappings.json', 'utf8'))
  : [];

console.log('catFiles count:', catFiles.length);
console.log('activeManifest count:', activeManifest.length);
console.log('appliedNew count:', appliedNew.length);

const catToSource = new Map();

// From activeManifest
activeManifest.forEach(item => {
  const pName = path.basename(item.primaryRelative);
  if (item.primarySource) {
    catToSource.set(pName, item.primarySource);
  }
  if (item.altRelatives && item.altSources) {
    item.altRelatives.forEach((ar, idx) => {
      const aName = path.basename(ar);
      if (item.altSources[idx]) {
        catToSource.set(aName, item.altSources[idx]);
      }
    });
  }
});

// From appliedNew
appliedNew.forEach(item => {
  catToSource.set(item.webpFilename, item.sourceFile);
});

console.log('Mapped catFiles to original source:', catToSource.size);

// Check unmapped catFiles
const unmappedCatFiles = catFiles.filter(f => !catToSource.has(f));
console.log('Unmapped catFiles count:', unmappedCatFiles.length);
if (unmappedCatFiles.length > 0) {
  console.log('Sample unmapped catFiles:', unmappedCatFiles.slice(0, 10));
}

