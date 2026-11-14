const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const replacements = [
  {
    idx: 1,
    name: 'Pin-Up Notice Board',
    sku: 'OB-BOA-1046',
    slug: 'pin-up-notice-board',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794486455757_2547d2b0.jpg',
    dest: 'public/assets/products/catalog_2026/OB-BOA-1046.webp'
  },
  {
    idx: 2,
    name: 'White Board for School',
    sku: 'OB-BOA-1042',
    slug: 'white-board-for-school',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794486697661_f9034412.png',
    dest: 'public/assets/products/catalog_2026/OB-BOA-1042.webp'
  },
  {
    idx: 3,
    name: 'Golden Letter for Welcome Board',
    sku: 'OB-BOA-1043',
    slug: 'golden-letter-for-welcome-board',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794487076194_754455da.jpg',
    dest: 'public/assets/products/catalog_2026/OB-BOA-1043.webp'
  },
  {
    idx: 4,
    name: 'Canon EP-303 Toner Cartridge',
    sku: 'OB-PRI-1076',
    slug: 'canon-ep-303-toner-cartridge',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794487163657_8ccbf66a.jpg',
    dest: 'public/assets/products/catalog_2026/OB-PRI-1076.webp'
  },
  {
    idx: 5,
    name: 'Samsung MLT-D116S Black Toner Cartridge (Packaging Type: Box)',
    sku: 'OB-PRI-1081',
    slug: 'samsung-mlt-d116s-black-toner-cartridge-packaging-type-box',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794487296872_ab90f2b2.jpg',
    dest: 'public/assets/products/catalog_2026/OB-PRI-1081.webp'
  },
  {
    idx: 6,
    name: 'HP 678 Tri-Color Ink Cartridge (CZ108AA)',
    sku: 'OB-PRI-1086',
    slug: 'hp-678-tri-color-ink-cartridge-cz108aa',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794487721872_43ba5bdb.jpg',
    dest: 'public/assets/products/catalog_2026/OB-PRI-1086.webp'
  },
  {
    idx: 7,
    name: 'Alkosign Horizontal Sliding Board',
    sku: 'OB-BOA-1045',
    slug: 'alkosign-horizontal-sliding-board',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794487941957_b41749cd.jpg',
    dest: 'public/assets/products/catalog_2026/OB-BOA-1045.webp'
  },
  {
    idx: 8,
    name: 'Alkosign Pegboard',
    sku: 'OB-BOA-1047',
    slug: 'alkosign-pegboard',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794488004781_3523740f.jpg',
    dest: 'public/assets/products/catalog_2026/OB-BOA-1047.webp'
  },
  {
    idx: 9,
    name: 'Humic Acid Liquid',
    sku: 'OB-CLE-1090',
    slug: 'humic-acid-liquid',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794488096197_9c80ddcf.jpg',
    dest: 'public/assets/products/catalog_2026/OB-CLE-1090.webp'
  },
  {
    idx: 10,
    name: 'External Hard Disk',
    sku: 'OB-COM-1034',
    slug: 'external-hard-disk',
    src: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794488226544_ca93789f.jpg',
    dest: 'public/assets/products/catalog_2026/OB-COM-1034.webp'
  }
];

async function replaceAll() {
  const oldReport = JSON.parse(fs.readFileSync('scratch/old_images_report.json', 'utf8'));
  const results = [];

  for (const item of replacements) {
    if (!fs.existsSync(item.src)) {
      throw new Error(`Source file missing: ${item.src}`);
    }

    const oldItem = oldReport.find(o => o.sku === item.sku);

    // Backup old file
    const backupDir = 'scratch/backup_old_images';
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

    console.log(`✓ [${item.idx}/10] [${item.sku}] ${item.name}`);
    console.log(`   Old Hash: ${oldItem.oldHash} -> New Hash: ${newHash} (${isDifferent ? 'UPDATED' : 'IDENTICAL'})`);
  }

  fs.writeFileSync('scratch/replacement_verification.json', JSON.stringify(results, null, 2));
  console.log('\nAll 10 replacement images processed successfully!');
}

replaceAll().catch(err => {
  console.error('Fatal error during image replacement:', err);
  process.exit(1);
});

