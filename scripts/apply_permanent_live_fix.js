const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const NEW_MAPPINGS = [
  {
    sku: 'OB-STA-1005',
    name: 'A/4 Stick File',
    images: [
      { file: 'Stationery/Magnetic Folder A4 .jpeg', out: 'OB-STA-1005.webp' }
    ]
  },
  {
    sku: 'OB-PAC-1057',
    name: 'Magic Tape With Dispenser',
    images: [
      { file: 'Stationery/JB9 Cello Tape Dispenser Black with Packaging Box.jpg', out: 'OB-PAC-1057.webp' }
    ]
  },
  {
    sku: 'OB-NOT-79',
    name: 'Brown Kraft Paper Envelopes Pack',
    images: [
      { file: 'Stationery/Premium Quality Cloth Line Envelope 12x10 Inch 100 Nos Pack.jpg', out: 'OB-NOT-79.webp' }
    ]
  },
  {
    sku: 'OB-BOA-1048',
    name: 'Ms Black Magazine Rack',
    images: [
      { file: 'Stationery/Magazine Brochure Display Stand Rack Models 1271 1272 1318 1328 Chart.jpg', out: 'OB-BOA-1048.webp' }
    ]
  },
  {
    sku: 'OB-DES-62',
    name: 'Faber-Castell Office Stamp Pad',
    images: [
      { file: 'Stationery/faber-castell-highlighter-marker-500x500.jpeg', out: 'OB-DES-62.webp' }
    ]
  },
  {
    sku: 'OB-DES-52',
    name: 'Double Sided Foam Tape 1 inch',
    images: [
      { file: 'Stationery/Floor Masking Tape 2 inch 25 mtr.jpeg', out: 'OB-DES-52.webp' }
    ]
  }
];

const SOURCE_BASE = path.join(__dirname, '..', 'Office Bazzar New Images');
const DEST_BASE = path.join(__dirname, '..', 'public', 'assets', 'products', 'catalog_2026');

async function run() {
  console.log('--- Step 1: Converting and Generating 1200x1200 WebP Images ---');
  for (const item of NEW_MAPPINGS) {
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

  // 1. Activate the 2 previously inactive products
  console.log('Activating OB-HOU-1018 and OB-TIS-1096 in catalog.ts...');
  // Find OB-HOU-1018 block
  const sku1 = '"sku": "OB-HOU-1018"';
  const idx1 = catContent.indexOf(sku1);
  if (idx1 !== -1) {
    const start1 = catContent.lastIndexOf('{\n    "id":', idx1);
    const end1 = catContent.indexOf('\n  },', idx1);
    let block1 = catContent.substring(start1, end1);
    block1 = block1.replace(/"isActive":\s*false/, '"isActive": true');
    catContent = catContent.substring(0, start1) + block1 + catContent.substring(end1);
    console.log('✓ OB-HOU-1018 set to isActive: true');
  }

  // Find OB-TIS-1096 block
  const sku2 = '"sku": "OB-TIS-1096"';
  const idx2 = catContent.indexOf(sku2);
  if (idx2 !== -1) {
    const start2 = catContent.lastIndexOf('{\n    "id":', idx2);
    const end2 = catContent.indexOf('\n  },', idx2);
    let block2 = catContent.substring(start2, end2);
    block2 = block2.replace(/"isActive":\s*false/, '"isActive": true');
    catContent = catContent.substring(0, start2) + block2 + catContent.substring(end2);
    console.log('✓ OB-TIS-1096 set to isActive: true');
  }

  // 2. Map new images for the 6 products
  for (const item of NEW_MAPPINGS) {
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

  for (const item of NEW_MAPPINGS) {
    const entry = manifest.find(m => m.sku === item.sku);
    if (entry) {
      entry.hasValidSupplierImage = true;
      entry.mappedImage = `/assets/products/catalog_2026/${item.images[0].out}`;
      entry.supplierSource = item.images[0].file;
      entry.requiresManualReview = false;
      entry.reviewReason = 'Verified supplier photograph from Office Bazzar New Images archive';
    }
  }

  fs.writeFileSync('scripts/office_bazzar_active_catalog_manifest.json', JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✓ Manifest saved successfully');
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});

