const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');

// Load previous manifest (189 products)
const prevManifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));

// 16 new high-confidence matches
const new16 = [
  { sku: 'OB-HOU-1023', primary: 'Hygenic Tools and Trolly/Automatic Hand Dryer 1800W ABS White On Black Packaging Box.jpg', alts: ['Hygenic Tools and Trolly/Automatic Hand Dryer 1500W ABS White Specifications Infographic.jpg'] },
  { sku: 'OB-COV-14', primary: 'Mix/Chemical Product/Lifebuoy Germ Protection Total Pro Plus Handwash 5 Litre Can Front View.jpg', alts: ['Mix/Chemical Product/Lifebuoy Germ Protection Total Pro Plus Handwash 5 Litre Cans Pair Front and Back.jpg'] },
  { sku: 'OB-CLE-1091', primary: 'Mix/Chemical Product/Vim Dishwash Liquid Lemon 500ml Bottle Front and Back.jpg', alts: ['Mix/Chemical Product/Vim Dishwash Liquid Lemon 250ml Bottle Front and Back.jpg'] },
  { sku: 'OB-052', primary: 'Mix/Chemical Product/Vim Dishwash Liquid Lemon Concentrated Gel 1.8 Litre Handle Bottle Front and Back Variant 2.jpg', alts: [] },
  { sku: 'OB-CLE-1095', primary: 'Mix/Chemical Product/Hi-Clean Liquid Soap Apple Rose Lemon 1000ml Bottles Set of 3.jpg', alts: ['Mix/Chemical Product/Hi-Clean Liquid Soap Green Apple Germs Killer 1000ml Bottle Front and Back.jpg'] },
  { sku: 'OB-047', primary: 'Collage/Scotch-Brite Scrub Sponge Pad.jpg', alts: [] },
  { sku: 'OB-063', primary: 'Bucket-Mug-Tray/Dustpan With Brush (10).jpg', alts: ['Bucket-Mug-Tray/Dustpan With Brush (11).jpg'] },
  { sku: 'OB-081', primary: 'Cleaning Brush/Cobweb Brush.jpg', alts: ['Cleaning Brush/Cobweb Brush (2).jpg'] },
  { sku: 'OB-121', primary: 'Mix/Chemical Product/Hi-Clean Herbal Perfumed Phenyle Assorted Fragrances 1 Litre Bottles Row of 5.jpg', alts: [] },
  { sku: 'OB-135', primary: 'Hit and Disinfectant Spray/Naphthalene Balls White Grid Array On Fabric.JPG', alts: [] },
  { sku: 'OB-145', primary: 'Dustbin/Kyracs Stepbin Bio-Medical Waste Pedal Dustbin 4 Sizes Multicolor.JPG', alts: [] },
  { sku: 'OB-146', primary: 'Dustbin/Aristo Twin Pedal Dustbin Wet And Dry Waste Green And Blue.jpg', alts: [] },
  { sku: 'OB-013', primary: 'Dispenser/Clear Wall Mount Soap Dispenser Push Button.jpg', alts: [] },
  { sku: 'OB-018', primary: 'Dispenser/Touch Soap Dispenser Wall Mount Silver With Box.jpg', alts: [] },
  { sku: 'OB-020', primary: 'Dispenser/M Fold Paper Towel Dispenser White With Tissue.jpg', alts: [] },
  { sku: 'OB-COV-27', primary: 'Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm Wholesaler Bazzar Display.JPG', alts: [] }
];

const completeMap = new Map();

for (const m of prevManifest) {
  completeMap.set(m.sku, {
    sku: m.sku,
    primarySource: m.primarySource,
    altSources: m.altSources
  });
}

for (const n of new16) {
  completeMap.set(n.sku, {
    sku: n.sku,
    primarySource: n.primary,
    altSources: n.alts
  });
}

console.log(`Total mapped products: ${completeMap.size}`);

async function processImage(srcRel, destName) {
  const srcFull = path.join(SOURCE_DIR, srcRel);
  const destFull = path.join(OUTPUT_DIR, destName);

  await sharp(srcFull)
    .resize(1200, 1200, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .webp({ quality: 90 })
    .toFile(destFull);
}

async function run() {
  console.log('Processing Sharp images for all mapped products...');
  let primaryCount = 0;
  let altCount = 0;

  for (const [sku, item] of completeMap.entries()) {
    const primaryDest = `${sku}.webp`;
    const primaryPath = path.join(OUTPUT_DIR, primaryDest);
    if (!fs.existsSync(primaryPath)) {
      await processImage(item.primarySource, primaryDest);
    }
    primaryCount++;

    for (let i = 0; i < item.altSources.length; i++) {
      const altDest = `${sku}-alt-${i + 1}.webp`;
      const altPath = path.join(OUTPUT_DIR, altDest);
      if (!fs.existsSync(altPath)) {
        await processImage(item.altSources[i], altDest);
      }
      altCount++;
    }
  }

  console.log(`Finished processing! Primary: ${primaryCount}, Alts: ${altCount}`);

  // Create updated manifest
  const manifest = [];
  for (const [sku, item] of completeMap.entries()) {
    const primaryRel = `/assets/products/catalog_2026/${sku}.webp`;
    const altRels = item.altSources.map((_, idx) => `/assets/products/catalog_2026/${sku}-alt-${idx + 1}.webp`);
    manifest.push({
      sku,
      primaryRelative: primaryRel,
      primarySource: item.primarySource,
      altRelatives: altRels,
      altSources: item.altSources,
      allImages: [primaryRel, ...altRels]
    });
  }
  fs.writeFileSync('scripts/office_bazzar_active_catalog_manifest.json', JSON.stringify(manifest, null, 2), 'utf8');

  // Update src/lib/data/catalog.ts
  const catalogPath = path.join(process.cwd(), 'src', 'lib', 'data', 'catalog.ts');
  const catalogContent = fs.readFileSync(catalogPath, 'utf8');

  const manifestMap = new Map();
  for (const m of manifest) {
    manifestMap.set(m.sku, m.allImages);
  }

  const productBlockRegex = /(\{\s*\"id\":\s*\"[^\"]+\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"images\":\s*\[)([\s\S]*?)(\])/g;
  let updatedCount = 0;
  let matchedCount = 0;
  let placeholderCount = 0;

  const newCatalogContent = catalogContent.replace(productBlockRegex, (match, prefix, sku, oldImagesRaw, suffix) => {
    updatedCount++;
    const matchedImages = manifestMap.get(sku);
    if (matchedImages && matchedImages.length > 0) {
      matchedCount++;
      const formatted = '\n      ' + matchedImages.map(img => `"${img}"`).join(',\n      ') + '\n    ';
      return `${prefix}${formatted}${suffix}`;
    } else {
      placeholderCount++;
      return `${prefix}${suffix}`;
    }
  });

  fs.writeFileSync(catalogPath, newCatalogContent, 'utf8');
  console.log(`Catalog updated! Total: ${updatedCount}, Mapped: ${matchedCount}, Placeholder: ${placeholderCount}`);
}

run().catch(console.error);

