const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const replacements = [
  {
    idx: 1,
    name: 'Epson EcoTank L6160 Wi-Fi Duplex Multi-Function Ink Tank Printer',
    sku: 'OB-COM-1035',
    slug: 'epson-ecotank-l6160-wi-fi-duplex-multi-function-ink-tank-printer',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794489792530_10d382a4.jpg',
    dest: 'public/assets/products/catalog_2026/OB-COM-1035.webp'
  },
  {
    idx: 2,
    name: 'SanDisk Pen Drive',
    sku: 'OB-COM-1038',
    slug: 'sandisk-pen-drive',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794489696603_a21481ab.jpg',
    dest: 'public/assets/products/catalog_2026/OB-COM-1038.webp'
  },
  {
    idx: 3,
    name: 'Name Plate Plain Innofitt',
    sku: 'OB-DIS-1063',
    slug: 'name-plate-plain-innofitt',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794489823424_b899c133.jpg',
    dest: 'public/assets/products/catalog_2026/OB-DIS-1063.webp'
  }
];

async function replaceAll() {
  const oldReport = JSON.parse(fs.readFileSync('scratch/old_3_images_report.json', 'utf8'));
  const results = [];

  for (const item of replacements) {
    if (!fs.existsSync(item.src)) {
      throw new Error(`Source file missing: ${item.src}`);
    }

    const oldItem = oldReport.find(o => o.sku === item.sku);

    // Backup old file
    const backupDir = 'scratch/backup_3_images';
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(item.dest, path.join(backupDir, `${item.sku}_old.webp`));

    // Convert & optimize replacement image with Sharp
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

    const isDifferent = newHash !== oldItem.oldHash;

    results.push({
      idx: item.idx,
      sku: item.sku,
      name: item.name,
      slug: item.slug,
      path: item.dest,
      oldHash: oldItem.oldHash,
      newHash: newHash,
      isChanged: isDifferent,
      dimensions: `${newMeta.width}x${newMeta.height}`,
      newSize: (newBuf.length / 1024).toFixed(1) + ' KB'
    });

    console.log(`✓ [${item.idx}/3] [${item.sku}] ${item.name}`);
    console.log(`   Old Hash: ${oldItem.oldHash} -> New Hash: ${newHash} (${isDifferent ? 'UPDATED' : 'IDENTICAL'})`);
  }

  fs.writeFileSync('scratch/replacement_3_verification.json', JSON.stringify(results, null, 2));
  console.log('\nAll 3 replacement images processed successfully!');
}

replaceAll().catch(err => {
  console.error('Fatal error during image replacement:', err);
  process.exit(1);
});

