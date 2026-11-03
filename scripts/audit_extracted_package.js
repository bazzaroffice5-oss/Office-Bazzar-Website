const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const baseDir = 'D:/temp_2369_package';

function getFileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function run() {
  console.log('Starting comprehensive audit of extracted files in', baseDir);
  const allFiles = [];

  function walk(currentDir) {
    const list = fs.readdirSync(currentDir);
    for (const item of list) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        allFiles.push(fullPath);
      }
    }
  }

  walk(baseDir);
  console.log(`Discovered ${allFiles.length} total files.`);

  const inventory = [];
  const hashMap = new Map(); // hash -> list of file paths
  const formatCounts = {};
  let corruptedCount = 0;
  let nonImageCount = 0;
  let skuNamedCount = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const relPath = path.relative(baseDir, filePath).replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();
    const stat = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    formatCounts[ext || '(none)'] = (formatCounts[ext || '(none)'] || 0) + 1;

    // Check SKU pattern (OB-...)
    const skuMatch = fileName.match(/OB-[A-Z0-9_-]+/i) || relPath.match(/OB-[A-Z0-9_-]+/i);
    const sku = skuMatch ? skuMatch[0].toUpperCase() : null;
    if (sku) skuNamedCount++;

    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext);

    let width = null;
    let height = null;
    let format = null;
    let isCorrupted = false;

    if (isImage) {
      try {
        const metadata = await sharp(filePath).metadata();
        width = metadata.width;
        height = metadata.height;
        format = metadata.format;
      } catch (err) {
        isCorrupted = true;
        corruptedCount++;
      }
    } else {
      nonImageCount++;
    }

    const hash = getFileHash(filePath);
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash).push(relPath);

    inventory.push({
      relPath,
      fileName,
      ext,
      sizeBytes: stat.size,
      sizeKb: (stat.size / 1024).toFixed(1),
      isImage,
      isCorrupted,
      width,
      height,
      format,
      sku,
      hash
    });

    if ((i + 1) % 500 === 0 || i + 1 === allFiles.length) {
      console.log(`Audited ${i + 1}/${allFiles.length} files...`);
    }
  }

  // Count duplicates
  let duplicateFilesCount = 0;
  let duplicateGroups = 0;
  const duplicateReport = [];

  for (const [hash, fileList] of hashMap.entries()) {
    if (fileList.length > 1) {
      duplicateGroups++;
      duplicateFilesCount += fileList.length - 1;
      duplicateReport.push({
        hash,
        copiesCount: fileList.length,
        files: fileList
      });
    }
  }

  const summary = {
    totalFiles: allFiles.length,
    formatCounts,
    imageFiles: allFiles.length - nonImageCount,
    nonImageFiles: nonImageCount,
    corruptedFiles: corruptedCount,
    skuNamedFiles: skuNamedCount,
    uniqueImageHashes: hashMap.size,
    duplicateGroups,
    duplicateFilesCount
  };

  fs.writeFileSync('audit_2369_inventory.json', JSON.stringify(inventory, null, 2), 'utf8');
  fs.writeFileSync('audit_2369_summary.json', JSON.stringify(summary, null, 2), 'utf8');
  fs.writeFileSync('audit_2369_duplicates.json', JSON.stringify(duplicateReport, null, 2), 'utf8');

  console.log('\n=== AUDIT SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

run().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

