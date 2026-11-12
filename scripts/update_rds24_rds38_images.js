const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TASKS = [
  {
    sku: 'OB-RDS-24',
    name: 'Microprismatic Reflective Warning Tape (50mm x 50m)',
    source: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794460882116_fbf8bc79.jpg',
    targets: [
      'public/assets/products/catalog_2026/OB-RDS-24.webp',
      'public/assets/products/catalog_2026/OB-RDS-24-alt-1.webp'
    ]
  },
  {
    sku: 'OB-RDS-38',
    name: 'Heavy Duty Anti-Slip Traction Safety Tapes',
    source: 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1794460894182_c759f313.jpg',
    targets: [
      'public/assets/products/catalog_2026/OB-RDS-38.webp',
      'public/assets/products/catalog_2026/OB-RDS-38-alt-1.webp'
    ]
  }
];

async function run() {
  console.log('--- Processing New Product Images for OB-RDS-24 and OB-RDS-38 ---');

  for (const t of TASKS) {
    if (!fs.existsSync(t.source)) {
      throw new Error(`Source image missing for ${t.sku}: ${t.source}`);
    }

    const meta = await sharp(t.source).metadata();
    console.log(`\nSource for ${t.sku} (${t.name}): ${meta.width}x${meta.height} ${meta.format}`);

    // Generate 1200x1200 WebP with 1140x1140 contain on white background
    const buffer = await sharp(t.source)
      .resize(1140, 1140, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .extend({
        top: 30,
        bottom: 30,
        left: 30,
        right: 30,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: 90 })
      .toBuffer();

    for (const target of t.targets) {
      const fullTarget = path.join(process.cwd(), target);
      fs.writeFileSync(fullTarget, buffer);
      const outMeta = await sharp(fullTarget).metadata();
      const stats = fs.statSync(fullTarget);
      console.log(`✓ Wrote ${target}: ${outMeta.width}x${outMeta.height} ${outMeta.format} (${Math.round(stats.size / 1024)} KB)`);
    }
  }

  console.log('\n--- Image processing complete ---');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
