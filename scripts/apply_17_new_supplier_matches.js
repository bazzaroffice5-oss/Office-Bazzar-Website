const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');

// Load previous manifest (205 products)
const prevManifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));

// The 17 newly verified additions
const newAdditions = [
  { sku: 'OB-GAR-1031', primary: 'Garbage Bag/Clean India Garbage Bags Packaging Boxes 4 Sizes Small Medium Large XL.jpg', alts: [] },
  { sku: 'OB-108', primary: 'Sprayer Pump/Translucent Plastic Trigger Spray Bottles White Sprayer Pair.JPG', alts: [] },
  { sku: 'OB-130', primary: 'Urinal Screen/Crew Urinal Screen Orange Sealed Pack.jpg', alts: ['Urinal Screen/Diversey TASKI Fresh and Clean Urinal Screen Green Box Front and Pack.JPG'] },
  { sku: 'OB-086', primary: 'Mat/Comfort PVC Cushion Coil Welcome Door Mat Green Gold Oval Label.jpg', alts: [] },
  { sku: 'OB-089', primary: 'Bucket-Mug-Tray/Dustpan (10).jpg', alts: ['Bucket-Mug-Tray/Dustpan (2).jpg'] },
  { sku: 'OB-073', primary: 'Wiper/Window Glass Wiper Telescopic Handle With Mesh Sponge and Squeegee.jpg', alts: [] },
  { sku: 'OB-075', primary: 'Wiper/Kitchen and Table Mini Squeegee Wiper Pink Green Peach Blue 4-Piece Set.jpg', alts: ['Wiper/Handheld Kitchen and Window Squeegee Wiper Blue Cyan Pink Trio.jpg'] },
  { sku: 'OB-083', primary: 'Collage/Mop Stick Handle.jpg', alts: [] },
  { sku: 'OB-109', primary: 'Hit and Disinfectant Spray/Good Knight Flash Liquid Vaporiser Kit Machine And Refill Lavender 45 ml With Box.jpg', alts: [] },
  { sku: 'OB-TIS-1101', primary: 'Tissue Product/Royal Natural Jumbo Roll Tissue JRT Two Rolls Stack.jpg', alts: ['Tissue Product/Kosher JRT Jumbo Rolled Tissue 4 Inch x 750 Gms Carton with Rolls.jpg'] },
  { sku: 'OB-BOA-1049', primary: 'Stationery/JB9 Magnetic White Board Duster Red with Marker Holder and Box.jpg', alts: ['Stationery/JB9 Magnetic White Board Duster Pack of 10 Boxes Shrink Wrapped.jpg'] },
  { sku: 'OB-BOA-1050', primary: 'Stationery/Magnetic Folder A4 .jpeg', alts: [] },
  { sku: 'OB-DIS-1060', primary: 'Stationery/Magazine Brochure Display Stand Rack Models 1271 1272 1318 1328 Chart.jpg', alts: [] },
  { sku: 'OB-FIL-34', primary: 'Stationery/Button Bag FS.jpeg', alts: ['Stationery/Button Bag FS 1.jpeg'] },
  { sku: 'OB-NOT-71', primary: 'Stationery/JB9 Prompt Sticky Note Pad Multi Color 76x76mm with 12 Pcs Box.jpg', alts: ['Stationery/JB9 Prompt Sticky Note Pad Pink and Yellow 76x76mm 3x3 Inch Pair.jpg'] },
  { sku: 'OB-NOT-68', primary: 'Stationery/JB9 U Clips Triangular 26mm Nickel Plated Box with Clips.jpg', alts: ['Stationery/JB9 U Clips Triangular 26mm Nickel Plated 1000 Pc Box and Small Box.jpg'] },
  { sku: 'OB-PAC-1053', primary: 'Stationery/Floor Masking Tape 2 inch 25 mtr.jpeg', alts: [] }
];

const completeMap = new Map();

for (const m of prevManifest) {
  completeMap.set(m.sku, {
    sku: m.sku,
    primarySource: m.primarySource,
    altSources: m.altSources
  });
}

for (const n of newAdditions) {
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
  console.log('Sharp processing newly verified additions...');
  for (const item of newAdditions) {
    const primaryDest = `${item.sku}.webp`;
    await processImage(item.primary, primaryDest);
    console.log(`Converted primary: ${primaryDest}`);

    for (let i = 0; i < item.alts.length; i++) {
      const altDest = `${item.sku}-alt-${i + 1}.webp`;
      await processImage(item.alts[i], altDest);
      console.log(`Converted alt: ${altDest}`);
    }
  }

  // Build full updated manifest
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
  console.log('Saved scripts/office_bazzar_active_catalog_manifest.json');

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
  console.log(`\nCatalog Update Complete:`);
  console.log(`Total Products: ${updatedCount}`);
  console.log(`Mapped Products: ${matchedCount}`);
  console.log(`Placeholder Products: ${placeholderCount}`);
}

run().catch(console.error);
