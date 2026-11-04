const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCE_DIR = path.resolve('public/assets/products');
const BACKUP_ROOT = path.resolve('D:/office_bazzar_master_images_backup_2026');
const BACKUP_DIR = path.join(BACKUP_ROOT, 'product_images');
const MANIFEST_PATH = path.resolve('scripts/permanent_product_images_backup_manifest.json');
const ROOT_MANIFEST_PATH = path.join(BACKUP_ROOT, 'backup_manifest.json');

console.log('--- OFFICE BAZZAR PERMANENT PRODUCT IMAGE BACKUP ---');
console.log(`Source: ${SOURCE_DIR}`);
console.log(`Target: ${BACKUP_DIR}`);

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push({
        fullPath,
        relPath: path.relative(baseDir, fullPath).replace(/\\/g, '/')
      });
    }
  }
  return results;
}

const files = getAllFiles(SOURCE_DIR);
console.log(`Found ${files.length} total source image assets to back up.`);

const manifest = {
  timestamp: new Date().toISOString(),
  sourceDirectory: SOURCE_DIR,
  backupDirectory: BACKUP_DIR,
  totalFiles: files.length,
  totalSizeBytes: 0,
  files: []
};

let copied = 0;
let errors = 0;

for (const file of files) {
  const targetPath = path.join(BACKUP_DIR, file.relPath);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    const fileBuf = fs.readFileSync(file.fullPath);
    const hash = crypto.createHash('sha256').update(fileBuf).digest('hex');
    fs.writeFileSync(targetPath, fileBuf);

    manifest.totalSizeBytes += fileBuf.length;
    manifest.files.push({
      relativePath: file.relPath,
      sizeBytes: fileBuf.length,
      sha256: hash
    });
    copied++;
    if (copied % 500 === 0 || copied === files.length) {
      console.log(`Progress: ${copied} / ${files.length} files backed up...`);
    }
  } catch (err) {
    console.error(`Failed to copy ${file.fullPath}:`, err.message);
    errors++;
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
fs.writeFileSync(ROOT_MANIFEST_PATH, JSON.stringify(manifest, null, 2));

console.log('--- BACKUP COMPLETE ---');
console.log(`Total Files Backed Up: ${copied}`);
console.log(`Total Size: ${(manifest.totalSizeBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`);
console.log(`Errors: ${errors}`);
console.log(`Manifest saved to ${MANIFEST_PATH} and ${ROOT_MANIFEST_PATH}`);

