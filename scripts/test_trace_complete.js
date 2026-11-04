const fs = require('fs');
const path = require('path');

const catDir = 'public/assets/products/catalog_2026';
const catFiles = fs.readdirSync(catDir).filter(f => f.endsWith('.webp'));

const catToSource = new Map();

// 1. activeManifest
if (fs.existsSync('scripts/office_bazzar_active_catalog_manifest.json')) {
  const am = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));
  am.forEach(item => {
    const pName = path.basename(item.primaryRelative);
    if (item.primarySource) catToSource.set(pName, item.primarySource);
    if (item.altRelatives && item.altSources) {
      item.altRelatives.forEach((ar, idx) => {
        const aName = path.basename(ar);
        if (item.altSources[idx]) catToSource.set(aName, item.altSources[idx]);
      });
    }
  });
}

// 2. appliedNew
if (fs.existsSync('scripts/applied_new_mappings.json')) {
  const an = JSON.parse(fs.readFileSync('scripts/applied_new_mappings.json', 'utf8'));
  an.forEach(item => catToSource.set(item.webpFilename, item.sourceFile));
}

// 3. batch 16
if (fs.existsSync('scripts/process_and_map_batch_16.js')) {
  const b1 = fs.readFileSync('scripts/process_and_map_batch_16.js', 'utf8');
  const m1 = b1.match(/const MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m1) {
    eval(m1[1]).forEach(x => {
      x.images.forEach(i => catToSource.set(i.out, i.file));
    });
  }
}

// 4. batch safety
if (fs.existsSync('scripts/process_and_map_batch_safety.js')) {
  const b2 = fs.readFileSync('scripts/process_and_map_batch_safety.js', 'utf8');
  const m2 = b2.match(/const MAPPINGS = (\[[\s\S]*?\n\];)/);
  if (m2) {
    eval(m2[1]).forEach(x => {
      x.images.forEach(i => catToSource.set(i.out, i.file));
    });
  }
}

console.log('catFiles count:', catFiles.length);
console.log('Mapped catFiles to source count:', catToSource.size);

const unmappedCat = catFiles.filter(f => !catToSource.has(f));
console.log('Still unmapped in catFiles:', unmappedCat.length);
if (unmappedCat.length > 0) {
  console.log('Remaining:', unmappedCat);
}

