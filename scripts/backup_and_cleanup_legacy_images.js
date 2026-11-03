const fs = require('fs');
const path = require('path');

const BACKUP_DIR = 'D:/legacy_products_backup_2026';
const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'products');

const legacyDirs = [
  'copier-papers',
  'covid-products',
  'housekeeping',
  'packaging-supplies',
  'prepared_1200',
  'printers-technology',
  'road-safety',
  'stationery'
];

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log(`Starting backup and cleanup of legacy product directories to: ${BACKUP_DIR}...`);

const cleanedRecords = [];

for (const ld of legacyDirs) {
  const srcSubdir = path.join(PRODUCTS_DIR, ld);
  if (!fs.existsSync(srcSubdir)) continue;

  const backupSubdir = path.join(BACKUP_DIR, ld);
  if (!fs.existsSync(backupSubdir)) {
    fs.mkdirSync(backupSubdir, { recursive: true });
  }

  const files = fs.readdirSync(srcSubdir);
  for (const f of files) {
    const srcFile = path.join(srcSubdir, f);
    const destFile = path.join(backupSubdir, f);
    const stat = fs.statSync(srcFile);

    if (stat.isFile()) {
      fs.copyFileSync(srcFile, destFile);
      cleanedRecords.push({
        relativePath: `public/assets/products/${ld}/${f}`,
        directory: ld,
        fileName: f,
        sizeBytes: stat.size,
        sizeKb: (stat.size / 1024).toFixed(1),
        backupPath: destFile.replace(/\\/g, '/'),
        status: 'BACKED_UP_AND_REMOVED'
      });
      // Delete old file
      fs.unlinkSync(srcFile);
    }
  }

  // Remove empty directory
  try {
    fs.rmdirSync(srcSubdir);
    console.log(`Cleaned directory: ${ld} (${files.length} files backed up)`);
  } catch (e) {
    console.log(`Could not rmdir ${ld}: ${e.message}`);
  }
}

console.log(`\nBackup & Cleanup Complete!`);
console.log(`Total legacy files backed up and removed: ${cleanedRecords.length}`);
fs.writeFileSync('scripts/cleaned_legacy_files.json', JSON.stringify(cleanedRecords, null, 2), 'utf8');

// Verify public/assets/products contains only catalog_2026
const remainingSubdirs = fs.readdirSync(PRODUCTS_DIR);
console.log('Remaining directories in public/assets/products:', remainingSubdirs);

