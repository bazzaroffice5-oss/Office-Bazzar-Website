const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const uploadDir = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded';

const items = [
  {
    name: 'Best Print 12A Compatible Toner Cartridge',
    sku: 'OB-PRI-1075',
    slug: 'best-print-12a-compatible-toner-cartridge',
    src: path.join(uploadDir, 'media_1794548366628_b4190b8c.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1075.webp'
  },
  {
    name: 'Canon 308 Toner Cartridge',
    sku: 'OB-PRI-1077',
    slug: 'canon-308-toner-cartridge',
    src: path.join(uploadDir, 'media_1794548411180_cc014ef8.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1077.webp'
  },
  {
    name: 'Label Cartridges',
    sku: 'OB-PRI-1078',
    slug: 'label-cartridges',
    src: path.join(uploadDir, 'media_1794548466499_327f3ba1.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1078.webp'
  },
  {
    name: 'Canon Refilling Cartridge',
    sku: 'OB-PRI-1079',
    slug: 'canon-refilling-cartridge',
    src: path.join(uploadDir, 'media_1794548542071_16932a03.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1079.webp'
  },
  {
    name: 'HP 126A Laser Jet Toner Cartridge',
    sku: 'OB-PRI-1082',
    slug: 'hp-126a-laser-jet-toner-cartridge',
    src: path.join(uploadDir, 'media_1794548627394_25b7a584.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1082.webp'
  },
  {
    name: 'Compatible Toner Cartridge',
    sku: 'OB-PRI-1080',
    slug: 'compatible-toner-cartridge',
    src: path.join(uploadDir, 'media_1794548721891_143fbbe6.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1080.webp'
  },
  {
    name: 'Canon Npg 51 Toner Cartridge',
    sku: 'OB-PRI-1083',
    slug: 'canon-npg-51-toner-cartridge',
    src: path.join(uploadDir, 'media_1794548666556_c4670d79.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1083.webp'
  },
  {
    name: 'Best Print 88A Compatible Toner Cartridge',
    sku: 'OB-PRI-1084',
    slug: 'best-print-88a-compatible-toner-cartridge',
    src: path.join(uploadDir, 'media_1794548582892_653eb704.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1084.webp'
  },
  {
    name: 'HP 802 Small Black Ink Cartridge - CH561ZZ',
    sku: 'OB-PRI-1085',
    slug: 'hp-802-small-black-ink-cartridge-ch561zz',
    src: path.join(uploadDir, 'media_1794548779755_2917c385.jpg'),
    dest: 'public/assets/products/catalog_2026/OB-PRI-1085.webp'
  }
];

async function run() {
  const backupDir = 'scratch/backup_9_cartridges';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const oldReport = JSON.parse(fs.readFileSync('scratch/old_9_cartridges_report.json', 'utf8'));
  const oldHashMap = {};
  oldReport.forEach(r => { oldHashMap[r.sku] = r.hash; });

  const results = [];

  for (const item of items) {
    if (!fs.existsSync(item.src)) {
      throw new Error(`Source file missing: ${item.src}`);
    }

    // Backup
    if (fs.existsSync(item.dest)) {
      fs.copyFileSync(item.dest, path.join(backupDir, `${item.sku}_old.webp`));
    }

    // Temporary dest file first to avoid reading while writing
    const tempDest = `${item.dest}.tmp.webp`;
    await sharp(item.src)
      .resize(1200, 1200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: 90, effort: 4 })
      .toFile(tempDest);

    fs.renameSync(tempDest, item.dest);

    const newBuf = fs.readFileSync(item.dest);
    const newHash = crypto.createHash('sha256').update(newBuf).digest('hex').substring(0, 16);
    const newMeta = await sharp(item.dest).metadata();
    const oldHash = oldHashMap[item.sku];
    const isDifferent = newHash !== oldHash;

    const res = {
      name: item.name,
      sku: item.sku,
      slug: item.slug,
      path: item.dest,
      oldHash: oldHash,
      newHash: newHash,
      isChanged: isDifferent,
      dimensions: `${newMeta.width}x${newMeta.height}`,
      newSize: (newBuf.length / 1024).toFixed(1) + ' KB'
    };

    results.push(res);
    console.log(`✓ [${item.sku}] ${item.name}`);
    console.log(`   Old Hash: ${oldHash} -> New Hash: ${newHash} (${isDifferent ? 'CHANGED' : 'IDENTICAL'})`);
    console.log(`   Dimensions: ${res.dimensions}, Size: ${res.newSize}`);
  }

  fs.writeFileSync('scratch/replacement_9_cartridges_verification.json', JSON.stringify(results, null, 2));
  console.log(`\nSuccessfully processed all ${results.length} images!`);
}

run().catch(err => {
  console.error('Fatal error during batch replacement:', err);
  process.exit(1);
});

