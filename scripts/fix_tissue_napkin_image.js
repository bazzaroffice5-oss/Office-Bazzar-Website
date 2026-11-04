const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcFile = path.join(process.cwd(), 'Office Bazzar New Images', 'Tissue Product', 'White Paper Napkins Unbranded Clear Wrapped Stacks Pair.jpg');
const destDir = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');

async function convertNapkins() {
  console.log('Converting genuine White Paper Napkins photo to 1200x1200 WebP ...');

  const targets = ['OB-HOU-1013.webp', 'OB-TIS-1096.webp'];
  for (const t of targets) {
    const destPath = path.join(destDir, t);
    await sharp(srcFile)
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
      .toFile(destPath);

    const stats = fs.statSync(destPath);
    console.log(`Generated ${t} (${Math.round(stats.size / 1024)} KB)`);
  }
}

convertNapkins().catch(console.error);

