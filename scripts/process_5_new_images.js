const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MAPPINGS = [
  {
    sku: 'OB-102',
    name: 'Cleaning Caddy Basket Organizer',
    src: 'Hygenic Tools and Trolly/Plastic Cleaning Caddy Basket Blue 3 Compartments Top View.jpg',
    out: 'OB-102.webp'
  },
  {
    sku: 'OB-104',
    name: 'Commercial Insect Killer Fly Catcher Machine',
    src: 'Hit and Disinfectant Spray/Lazzo Insect Killer Machine Black UV Light On Front View.jpg',
    out: 'OB-104.webp'
  },
  {
    sku: 'OB-COV-05',
    name: 'Yellow Disposable Protective Mask',
    src: 'Mask/N95 Foldable Virus Protection Face Mask Bright Yellow.jpeg',
    out: 'OB-COV-05.webp'
  },
  {
    sku: 'OB-078',
    name: 'Table Top Wiper',
    src: 'Wiper/Kitchen and Table Mini Squeegee Wiper Pink Green Peach Blue 4-Piece Set.jpg',
    out: 'OB-078.webp'
  },
  {
    sku: 'OB-027',
    name: 'Kitchen Roll Dispenser',
    src: 'Dispenser/Toilet Roll Holder With Mobile Shelf White.jpg',
    out: 'OB-027.webp'
  }
];

const SOURCE_BASE = path.join(process.cwd(), 'Office Bazzar New Images');
const DEST_BASE = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');

async function processImages() {
  console.log('--- Processing 5 New Verified Supplier Images to 1200x1200 WebP ---');
  for (const m of MAPPINGS) {
    const srcPath = path.join(SOURCE_BASE, m.src);
    const destPath = path.join(DEST_BASE, m.out);

    if (!fs.existsSync(srcPath)) {
      console.error(`Missing source: ${srcPath}`);
      continue;
    }

    await sharp(srcPath)
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
    console.log(`Generated ${m.out} (${Math.round(stats.size / 1024)} KB) for ${m.sku} - ${m.name}`);
  }
}

processImages().catch(console.error);
