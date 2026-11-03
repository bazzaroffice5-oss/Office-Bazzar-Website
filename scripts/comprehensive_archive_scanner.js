const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const BASE_DIR = 'D:/temp_2369_package/Product Photo (4-3-26)';

async function scanRecursive(dir) {
  let fileList = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fileList = fileList.concat(await scanRecursive(full));
    } else if (entry.isFile()) {
      fileList.push(full);
    }
  }
  return fileList;
}

function getFileHash(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch (e) {
    return null;
  }
}

async function analyzeFile(filePath) {
  const relPath = path.relative(path.join(BASE_DIR, '..'), filePath).replace(/\\/g, '/');
  const folder = path.dirname(relPath).replace(/^Product Photo \(4-3-26\)\/?/, '') || 'Root';
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const stat = fs.statSync(filePath);
  const sizeBytes = stat.size;
  const sizeKb = (sizeBytes / 1024).toFixed(1);

  const imageExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.gif']);
  const isImageCandidate = imageExts.has(ext);

  if (sizeBytes === 0) {
    return {
      relPath,
      folder,
      fileName,
      ext,
      sizeBytes,
      sizeKb,
      isImage: false,
      isCorrupted: true,
      width: null,
      height: null,
      format: null,
      hash: null,
      notes: 'Corrupted: Zero bytes'
    };
  }

  if (!isImageCandidate) {
    return {
      relPath,
      folder,
      fileName,
      ext,
      sizeBytes,
      sizeKb,
      isImage: false,
      isCorrupted: false,
      width: null,
      height: null,
      format: null,
      hash: getFileHash(filePath),
      notes: 'Non-image asset'
    };
  }

  try {
    const meta = await sharp(filePath).metadata();
    const hash = getFileHash(filePath);
    return {
      relPath,
      folder,
      fileName,
      ext,
      sizeBytes,
      sizeKb,
      isImage: true,
      isCorrupted: false,
      width: meta.width,
      height: meta.height,
      format: meta.format,
      space: meta.space,
      channels: meta.channels,
      hash,
      notes: 'Valid image'
    };
  } catch (err) {
    return {
      relPath,
      folder,
      fileName,
      ext,
      sizeBytes,
      sizeKb,
      isImage: false,
      isCorrupted: true,
      width: null,
      height: null,
      format: null,
      hash: getFileHash(filePath),
      notes: `Image decode failure: ${err.message}`
    };
  }
}

async function main() {
  console.log(`Scanning supplier archive at: ${BASE_DIR}...`);
  const allFiles = await scanRecursive(BASE_DIR);
  console.log(`Total files found: ${allFiles.length}`);

  const inventory = [];
  const hashMap = new Map();

  for (let i = 0; i < allFiles.length; i++) {
    const f = allFiles[i];
    const data = await analyzeFile(f);
    inventory.push(data);

    if (data.hash) {
      if (!hashMap.has(data.hash)) {
        hashMap.set(data.hash, []);
      }
      hashMap.get(data.hash).push(data);
    }

    if ((i + 1) % 500 === 0 || i === allFiles.length - 1) {
      console.log(`Audited ${i + 1}/${allFiles.length} files...`);
    }
  }

  // Summary counts
  const totalFiles = inventory.length;
  const actualImages = inventory.filter(x => x.isImage).length;
  const corruptedFiles = inventory.filter(x => x.isCorrupted).length;
  const nonImages = inventory.filter(x => !x.isImage && !x.isCorrupted).length;

  const duplicatesList = [];
  for (const [hash, group] of hashMap.entries()) {
    if (group.length > 1) {
      duplicatesList.push({
        hash,
        count: group.length,
        files: group.map(g => ({ relPath: g.relPath, sizeKb: g.sizeKb }))
      });
    }
  }

  const uniqueImageHashes = new Set(inventory.filter(x => x.isImage).map(x => x.hash)).size;

  const summary = {
    totalFiles,
    actualImages,
    corruptedFiles,
    nonImages,
    uniqueImageHashes,
    duplicateGroupsCount: duplicatesList.length,
    duplicateFilesTotal: duplicatesList.reduce((acc, d) => acc + (d.count - 1), 0),
    folders: {}
  };

  for (const item of inventory) {
    summary.folders[item.folder] = (summary.folders[item.folder] || 0) + 1;
  }

  console.log('\n========================================');
  console.log('SCAN COMPLETE:');
  console.log(`Total Files: ${totalFiles}`);
  console.log(`Actual Images: ${actualImages}`);
  console.log(`Corrupted Files: ${corruptedFiles}`);
  console.log(`Non-Image Files: ${nonImages}`);
  console.log(`Unique Image Hashes: ${uniqueImageHashes}`);
  console.log(`Duplicate Groups: ${duplicatesList.length}`);
  console.log('Folders found:');
  console.log(summary.folders);
  console.log('========================================\n');

  fs.writeFileSync('scripts/supplier_inventory_complete.json', JSON.stringify(inventory, null, 2), 'utf8');
  fs.writeFileSync('scripts/supplier_duplicates.json', JSON.stringify(duplicatesList, null, 2), 'utf8');
  fs.writeFileSync('scripts/supplier_summary.json', JSON.stringify(summary, null, 2), 'utf8');
  console.log('Saved inventory and summary to scripts/');
}

main().catch(console.error);

