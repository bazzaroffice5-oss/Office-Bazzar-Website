const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const src = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794550046549_9bbcfbab.jpg';
const dest = 'public/assets/products/catalog_2026/OB-NOT-73-alt-2.webp';

async function run() {
  if (!fs.existsSync(src)) {
    throw new Error(`Source file missing: ${src}`);
  }

  // Backup old file
  const backupDir = 'scratch/backup_calculator';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(dest, path.join(backupDir, 'OB-NOT-73-alt-2_old.webp'));

  const oldBuf = fs.readFileSync(dest);
  const oldHash = crypto.createHash('sha256').update(oldBuf).digest('hex').substring(0, 16);

  // Convert & optimize replacement image with Sharp onto pure white background
  const tempDest = `${dest}.tmp.webp`;
  await sharp(src)
    .resize(1200, 1200, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .webp({ quality: 90, effort: 4 })
    .toFile(tempDest);

  fs.renameSync(tempDest, dest);

  const newBuf = fs.readFileSync(dest);
  const newHash = crypto.createHash('sha256').update(newBuf).digest('hex').substring(0, 16);
  const newMeta = await sharp(dest).metadata();

  const isDifferent = newHash !== oldHash;

  const result = {
    productName: 'Casio Electronic Desk Calculator',
    sku: 'OB-NOT-73',
    slug: 'ob-not-73-casio-electronic-desk-calculator',
    position: '3rd gallery image',
    destPath: dest,
    oldHash: oldHash,
    newHash: newHash,
    isChanged: isDifferent,
    dimensions: `${newMeta.width}x${newMeta.height}`,
    newSize: (newBuf.length / 1024).toFixed(1) + ' KB'
  };

  fs.writeFileSync('scratch/replacement_calculator_verification.json', JSON.stringify(result, null, 2));
  console.log('✓ Successfully replaced third gallery image for [OB-NOT-73]');
  console.log(`   Old Hash: ${oldHash} -> New Hash: ${newHash} (${isDifferent ? 'CHANGED' : 'IDENTICAL'})`);
  console.log(`   Dimensions: ${result.dimensions}, Size: ${result.newSize}`);
}

run().catch(err => {
  console.error('Fatal error during calculator image replacement:', err);
  process.exit(1);
});

