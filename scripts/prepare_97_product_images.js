const fs = require('fs');
const path = require('path');

const affected = JSON.parse(fs.readFileSync('scripts/all_97_affected_products.json'));
const backupBase = 'D:/legacy_products_backup_2026';
const destDir = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push({ file, fullPath: filePath, size: fs.statSync(filePath).size });
    }
  });
  return fileList;
}

const allBackupFiles = getAllFiles(backupBase);
console.log('Total backup files available:', allBackupFiles.length);

const results = [];
let successCount = 0;

affected.forEach(p => {
  const sku = p.sku.toUpperCase();
  // Find all backup files matching this SKU
  let matches = allBackupFiles.filter(f => {
    const fn = f.file.toUpperCase();
    return fn.startsWith(sku + '_') || fn.startsWith(sku + '.') || fn.includes('_' + sku + '_') || fn.includes(sku);
  });

  if (matches.length === 0) {
    console.error(`NO MATCH FOUND FOR ${sku} (${p.name})`);
    results.push({ sku, name: p.name, status: 'NOT_FOUND', copiedImages: [] });
    return;
  }

  // Sort matches by size descending or preference to select best primary image
  matches.sort((a, b) => b.size - a.size);

  const copiedImages = [];

  matches.forEach((m, idx) => {
    const ext = path.extname(m.file).toLowerCase() || '.webp';
    const destFileName = idx === 0 ? `${sku}${ext}` : `${sku}-alt-${idx}${ext}`;
    const destPath = path.join(destDir, destFileName);
    const webPath = `/assets/products/catalog_2026/${destFileName}`;

    fs.copyFileSync(m.fullPath, destPath);
    copiedImages.push(webPath);
  });

  successCount++;
  results.push({
    sku,
    name: p.name,
    category: p.category,
    sourceFiles: matches.map(m => m.file),
    copiedImages,
    primaryImage: copiedImages[0],
    galleryCount: copiedImages.length
  });
});

console.log(`\nProcessed ${affected.length} products:`);
console.log(`Successfully mapped and copied: ${successCount} / ${affected.length}`);

fs.writeFileSync('scripts/97_products_copied_images_manifest.json', JSON.stringify(results, null, 2));
