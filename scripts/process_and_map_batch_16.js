const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MAPPINGS = [
  {
    sku: 'OB-HOU-1011',
    name: 'Scrubbing Pad',
    images: [
      { file: 'Scotch Bright and Scrubber/Green Nylon Scrub Pad Unpackaged Flat View.jpg', out: 'OB-HOU-1011.webp' },
      { file: 'Collage/Scrub Pad.jpg', out: 'OB-HOU-1011_alt1.webp' }
    ]
  },
  {
    sku: 'OB-HOU-1016',
    name: 'Checked Cloth',
    images: [
      { file: 'Cloth/Kitchen Check Towel Stack.jpg', out: 'OB-HOU-1016.webp' }
    ]
  },
  {
    sku: 'OB-HOU-1010',
    name: 'White Banian Cloth',
    images: [
      { file: 'Cloth/Floor Cleaning Cloth 20x20.jpg', out: 'OB-HOU-1010.webp' }
    ]
  },
  {
    sku: 'OB-HOU-1012',
    name: 'Housekeeping Cleaning Chemicals',
    images: [
      { file: 'Mix/Chemical Product/Diversey Taski R2 Hygienic Hard Surface Cleaner Concentrate 5 Litre Can Front and Back.jpg', out: 'OB-HOU-1012.webp' },
      { file: 'Mix/Chemical Product/Cif Pro All Purpose Kitchen Cleaner 5 Litre Can Front and Back.jpg', out: 'OB-HOU-1012_alt1.webp' }
    ]
  },
  {
    sku: 'OB-HOU-1026',
    name: 'Copper Water Bottle',
    images: [
      { file: 'Stainless Water Bottle.jpeg', out: 'OB-HOU-1026.webp' },
      { file: 'water bottle .jpeg', out: 'OB-HOU-1026_alt1.webp' }
    ]
  },
  {
    sku: 'OB-GAR-1032',
    name: 'Silver Stainless Steel SS Lobby Ashtray Bin, Capacity: 8x24',
    images: [
      { file: 'Dustbin/Stainless Steel Ash Can Dustbin With Side Opening Pair.jpg', out: 'OB-GAR-1032.webp' }
    ]
  },
  {
    sku: 'OB-STA-1003',
    name: 'A/4 Punch Folder',
    images: [
      { file: 'Stationery/Button Bag FS.jpeg', out: 'OB-STA-1003.webp' }
    ]
  },
  {
    sku: 'OB-STA-1004',
    name: 'A/4 Report File',
    images: [
      { file: 'Stationery/Button Bag FS 1.jpeg', out: 'OB-STA-1004.webp' }
    ]
  },
  {
    sku: 'OB-STA-1006',
    name: 'Visiting Card Folder',
    images: [
      { file: 'Stationery/Blue Wall Mounted Document Display Panel Flip Folder Rack 10 Panels Open.JPG', out: 'OB-STA-1006.webp' },
      { file: 'Stationery/Document Display Panels Blue Green Red Yellow Black Collaged Frames.JPG', out: 'OB-STA-1006_alt1.webp' }
    ]
  },
  {
    sku: 'OB-COM-1037',
    name: 'Keyboard Tray Metal',
    images: [
      { file: 'Stationery/Key Board.jpeg', out: 'OB-COM-1037.webp' }
    ]
  },
  {
    sku: 'OB-045',
    name: 'Cotton Towel (Small / Big)',
    images: [
      { file: 'Cloth/Color Hand Towel 14x21.jpg', out: 'OB-045.webp' },
      { file: 'Cloth/Color Bath Towel 24x48.jpg', out: 'OB-045_alt1.webp' }
    ]
  },
  {
    sku: 'OB-054',
    name: 'Vim & Pril Dishwash Soap',
    images: [
      { file: 'Collage/Pril Dishwash Liquid And Exo Dish Wash Bar.jpg', out: 'OB-054.webp' },
      { file: 'Collage/Vim Dishwash Liquid 5L And Bottles.jpg', out: 'OB-054_alt1.webp' }
    ]
  },
  {
    sku: 'OB-062',
    name: 'Cobweb Stick Sunflower',
    images: [
      { file: 'Cleaning Brush/Cobweb Brush.jpg', out: 'OB-062.webp' },
      { file: 'Cleaning Brush/Cobweb Brush (2).jpg', out: 'OB-062_alt1.webp' }
    ]
  },
  {
    sku: 'OB-071',
    name: 'SS Push Can Dustbin',
    images: [
      { file: 'Collage/Stainless Steel Push Dustbin.jpg', out: 'OB-071.webp' },
      { file: 'Collage/Executive Push Dustbin With Handle.jpg', out: 'OB-071_alt1.webp' }
    ]
  },
  {
    sku: 'OB-076',
    name: 'Versa Wiper',
    images: [
      { file: 'Collage/Nova Floor Wiper.jpg', out: 'OB-076.webp' },
      { file: 'Collage/Sumo Floor Wiper 21 Inch.jpg', out: 'OB-076_alt1.webp' }
    ]
  },
  {
    sku: 'OB-112',
    name: 'PVC Hard Broom',
    images: [
      { file: 'Brooms And Sticks/Kharata Broom Stick Plastic.jpg', out: 'OB-112.webp' },
      { file: 'Brooms And Sticks/Kharata Broom Stick Plastic 1.jpg', out: 'OB-112_alt1.webp' }
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

    // Target the specific product block by finding its sku
    const skuTarget = `"sku": "${item.sku}"`;
    const skuIndex = catContent.indexOf(skuTarget);
    if (skuIndex === -1) {
      console.error(`ERROR: SKU ${item.sku} not found in catalog.ts!`);
      continue;
    }

    // Find the enclosing product block around skuIndex
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
