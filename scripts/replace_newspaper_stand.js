const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const item = {
  name: 'Double Sided Newspaper Stand',
  sku: 'OB-DIS-1060',
  slug: 'double-sided-newspaper-stand',
  src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794545417672_ab2c60c8.png',
  dest: 'public/assets/products/catalog_2026/OB-DIS-1060.webp'
};

async function run() {
  if (!fs.existsSync(item.src)) {
    throw new Error(`Source file missing: ${item.src}`);
  }

  const oldReport = JSON.parse(fs.readFileSync('scratch/old_newspaper_stand_report.json', 'utf8'));

  // Backup old file
  const backupDir = 'scratch/backup_newspaper_stand';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(item.dest, path.join(backupDir, `${item.sku}_old.webp`));

  // Convert & optimize replacement image with Sharp onto pure white background
  await sharp(item.src)
    .resize(1200, 1200, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .webp({ quality: 90, effort: 4 })
    .toFile(item.dest);

  // Verify new file
  const newBuf = fs.readFileSync(item.dest);
  const newHash = crypto.createHash('sha256').update(newBuf).digest('hex').substring(0, 16);
  const newMeta = await sharp(item.dest).metadata();

  const isDifferent = newHash !== oldReport.oldHash;

  const result = {
    name: item.name,
    sku: item.sku,
    slug: item.slug,
    path: item.dest,
    oldHash: oldReport.oldHash,
    newHash: newHash,
    isChanged: isDifferent,
    dimensions: `${newMeta.width}x${newMeta.height}`,
    newSize: (newBuf.length / 1024).toFixed(1) + ' KB'
  };

  fs.writeFileSync('scratch/replacement_newspaper_stand_verification.json', JSON.stringify(result, null, 2));
  console.log(`✓ [${item.sku}] ${item.name}`);
  console.log(`   Old Hash: ${oldReport.oldHash} -> New Hash: ${newHash} (${isDifferent ? 'UPDATED' : 'IDENTICAL'})`);
  console.log(`   Dimensions: ${result.dimensions}, Size: ${result.newSize}`);
}

run().catch(err => {
  console.error('Fatal error during image replacement:', err);
  process.exit(1);
});

