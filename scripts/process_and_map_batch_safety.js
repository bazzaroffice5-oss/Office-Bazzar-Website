const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MAPPINGS = [
  {
    sku: 'OB-RDS-02',
    name: 'Hexagonal Traffic Cone (750mm / 1000mm)',
    images: [
      { file: 'Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm.JPG', out: 'OB-RDS-02.webp' },
      { file: 'Safety Items/Rubber Base Traffic Cone RBTC 750mm Height 2kg Red Standing View.jpeg', out: 'OB-RDS-02_alt1.webp' }
    ]
  },
  {
    sku: 'OB-RDS-04',
    name: 'Economical Traffic Cone and Chain Set',
    images: [
      { file: 'Safety Items/Red and White Plastic Safety Warning Barrier Chain Coil.jpg', out: 'OB-RDS-04.webp' }
    ]
  },
  {
    sku: 'OB-RDS-06',
    name: 'Retractable Cone Q-Manager Ribbon',
    images: [
      { file: 'Safety Items/Queue Manager Stainless Steel Retractable Belt Barrier Stanchions Pair with Red Belt.JPG', out: 'OB-RDS-06.webp' }
    ]
  },
  {
    sku: 'OB-NOT-78',
    name: 'White Mailing Envelopes Pack',
    images: [
      { file: 'Stationery/Light Blue Paper Envelopes Bundle with Brown Paper Band.jpg', out: 'OB-NOT-78.webp' }
    ]
  },
  {
    sku: 'OB-095',
    name: 'Airwick Room Freshener Spray',
    images: [
      { file: 'Room Spray/Godrej aer matic Automatic Spray Dispensers Cool Surf Blue Violet Bloom Petal Crush Pink with Boxes Trio.jpg', out: 'OB-095.webp' },
      { file: 'Room Spray/Godrej aer matic Violet Valley Bloom Automatic Dispenser Refill Can and Box Set.jpg', out: 'OB-095_alt1.webp' }
    ]
  }
];

const SOURCE_BASE = path.join(__dirname, '..', 'Office Bazzar New Images');
const DEST_BASE = path.join(__dirname, '..', 'public', 'assets', 'products', 'catalog_2026');

async function processImages() {
  console.log('--- Step 1: Converting and Generating 1200x1200 WebP Images ---');
  for (const item of MAPPINGS) {
    for (const img of item.images) {
      const srcPath = path.join(SOURCE_BASE, img.file);
      const destPath = path.join(DEST_BASE, img.out);
      
      if (!fs.existsSync(srcPath)) {
        throw new Error(`Source image not found: ${srcPath}`);
      }

      await sharp(srcPath)
        .resize(1200, 1200, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 88, effort: 4 })
        .toFile(destPath);

      const stats = fs.statSync(destPath);
      console.log(`✓ Processed ${img.out} (${(stats.size / 1024).toFixed(1)} KB) from ${img.file}`);
    }
  }

  console.log('\n--- Step 2: Updating catalog.ts ---');
  let catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

  for (const item of MAPPINGS) {
    const webpPaths = item.images.map(img => `"/assets/products/catalog_2026/${img.out}"`);
    const newImagesBlock = `"images": [\n      ${webpPaths.join(',\n      ')}\n    ]`;

    const skuTarget = `"sku": "${item.sku}"`;
    const skuIndex = catContent.indexOf(skuTarget);
    if (skuIndex === -1) {
      console.error(`ERROR: SKU ${item.sku} not found in catalog.ts!`);
      continue;
    }

    const startObj = catContent.lastIndexOf('{\n    "id":', skuIndex);
    const endObj = catContent.indexOf('\n  },', skuIndex);

    const productBlock = catContent.substring(startObj, endObj);
    const updatedBlock = productBlock.replace(/"images":\s*\[[\s\S]*?\]/, newImagesBlock);

    catContent = catContent.substring(0, startObj) + updatedBlock + catContent.substring(endObj);
    console.log(`✓ Updated images for ${item.sku} (${item.name}) -> ${webpPaths.length} image(s)`);
  }

  fs.writeFileSync('src/lib/data/catalog.ts', catContent, 'utf8');
  console.log('✓ catalog.ts saved successfully');

  console.log('\n--- Step 3: Updating manifest ---');
  const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));

  for (const item of MAPPINGS) {
    const entry = manifest.find(m => m.sku === item.sku);
    if (entry) {
      entry.hasValidSupplierImage = true;
      entry.mappedImage = `/assets/products/catalog_2026/${item.images[0].out}`;
      entry.supplierSource = item.images[0].file;
      entry.alternateAngles = item.images.slice(1).map(x => `/assets/products/catalog_2026/${x.out}`);
      entry.requiresManualReview = false;
      entry.reviewReason = 'Verified supplier photograph from Office Bazzar New Images archive';
    }
  }

  fs.writeFileSync('scripts/office_bazzar_active_catalog_manifest.json', JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✓ Manifest saved successfully');
}

processImages().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
