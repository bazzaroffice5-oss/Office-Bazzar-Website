const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 1. Load the 171 base mappings
const baseVerified = JSON.parse(fs.readFileSync('scripts/final_verified_supplier_products.json', 'utf8'));

// 2. Load the 45 gallery sets
const baseWithGalleries = JSON.parse(fs.readFileSync('scripts/catalog_with_gallery_images.json', 'utf8'));
const galleryMap = new Map();
for (const p of baseWithGalleries) {
  if (p.galleryImages && p.galleryImages.length > 0) {
    galleryMap.set(p.sku, p.galleryImages.map(g => g.relPath.replace(/^Product Photo \(4-3-26\)[\/\\]/, '')));
  }
}

// 3. Define the 30 verified additions
const verifiedAdditions = [
  { sku: 'OB-100', primary: 'Hygenic Tools and Trolly/Aluminium Telescopic Extension Poles 3.6M 6M 8M Set of 3.png', alts: [] },
  { sku: 'OB-126', primary: 'Mix/Chemical Product/Hi-Clean Sodium Hypochlorite 6 Percent Liquid Cleaner 5 Litre Can.jpg', alts: [] },
  { sku: 'OB-139', primary: 'Mix/Aristo Omega Trolley Shopping Basket Red With Telescopic Handle Front View.jpg', alts: ['Mix/Aristo Omega Trolley Shopping Basket Red With Telescopic Handle Side View.jpg'] },
  { sku: 'OB-RDS-01', primary: 'Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm.JPG', alts: ['Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm Wholesaler Bazzar Display.JPG'] },
  { sku: 'OB-RDS-03', primary: 'Safety Items/Rubber Base Traffic Cone RBTC 750mm Height 2kg Red Standing View.jpeg', alts: [] },
  { sku: 'OB-RDS-20', primary: 'Safety Items/Queue Manager Stainless Steel Retractable Belt Barrier Stanchions Pair with Red Belt.JPG', alts: [] },
  { sku: 'OB-RDS-22', primary: 'Safety Items/Queue Manager Gold Stanchion Posts with Red Velvet Rope.jpg', alts: [] },
  { sku: 'OB-RDS-23', primary: 'Safety Items/Red and White Plastic Safety Warning Barrier Chain Coil.jpg', alts: [] },
  { sku: 'OB-COV-01', primary: 'Safety Items/Personal Protective Equipment Kit Full Body Coverall 90 Gsm with Face Shield and Mask Packed Kit.JPG', alts: [] },
  { sku: 'OB-COV-12', primary: 'Safety Items/Contec CMS50D Pulse Oximeter Fingertip Device with Product Box.jpg', alts: ['Safety Items/Contec CMS50D Pulse Oximeter Product Box.jpg'] },
  { sku: 'OB-COV-15', primary: 'Hit and Disinfectant Spray/Savlon Surface Disinfectant Spray Fresh 170 g Front And Back View.jpeg', alts: [] },
  { sku: 'OB-COV-16', primary: 'Hit and Disinfectant Spray/Good Knight Gold Flash Liquid Vapouriser Machine And Refill 45 ml Box Front And Side View.JPG', alts: ['Hit and Disinfectant Spray/Good Knight Gold Flash Liquid Vapouriser Refill 45 ml With Box.JPG'] },
  { sku: 'OB-COV-17', primary: 'Hit and Disinfectant Spray/All Out Ultra Mosquito Liquid Vaporiser Kit Machine And Refill 45 ml With Box.jpg', alts: ['Hit and Disinfectant Spray/All Out Ultra Mosquito Liquid Vaporiser Refill 45 ml With Box.jpg'] },
  { sku: 'OB-COV-23', primary: 'Safety Items/Rowdel Yellow Industrial Safety Helmet Hard Hat Side View.jpg', alts: ['Safety Items/Rowdel Yellow Industrial Safety Helmet Hard Hat with Chin Strap.jpg'] },
  { sku: 'OB-COV-30', primary: 'Sprayer Pump/KD Pumps 2 Liter Pressure Sprayer Yellow and Red Pair.JPG', alts: [] },
  { sku: 'OB-COV-31', primary: 'Sprayer Pump/Dap Pressure Sprayer 5L Orange Bottle with Lance and Packaging Box.jpg', alts: [] },
  { sku: 'OB-COV-32', primary: 'Sprayer Pump/Neptune Knapsack Sprayer Yellow Tank with Wand and Nozzle.jpg', alts: [] },
  { sku: 'OB-HOU-1022', primary: 'Dispenser/Stainless Steel Push Button Soap Dispenser 500ml Wall Mount View.jpg', alts: ['Dispenser/Stainless Steel Push Button Soap Dispenser 500ml With Box.jpg'] },
  { sku: 'OB-HOU-1025', primary: 'Dispenser/Automatic Aerosol LED Dispenser LED 250.jpg', alts: ['Dispenser/Automatic Aerosol LED Dispenser LED 250 (2).jpg'] },
  { sku: 'OB-TIS-1100', primary: 'Tissue Product/Kimsoft Smile C-Fold Towels 31500 180 Sheets Pack and Stack.jpg', alts: ['Tissue Product/Kimsoft Smile C-Fold Towels 31500 5400 Sheets Carton with Pack and Stack.jpg'] },
  { sku: 'OB-STA-1007', primary: 'Folders/EXPANDING BUTTON FOLDER.jpeg', alts: [] },
  { sku: 'OB-DES-57', primary: 'Packing Product/Blue Box Strapping Band Roll Shrink Wrapped Close-up.jpg', alts: [] },
  { sku: 'OB-NOT-65', primary: 'Stationery/JB9 Paper Clips Assorted Colour 28mm 100 Pcs Box with Clips.jpg', alts: [] },
  { sku: 'OB-NOT-70', primary: 'Stationery/JB9 Pure Nylon Rubber Band Multi Color 500gm Pouch JB9-135.jpg', alts: [] },
  { sku: 'OB-NOT-72', primary: 'Stationery/JB9 Bright Electro Nickel Plated T-Pins 3N Single Box.jpg', alts: [] },
  { sku: 'OB-NOT-74', primary: 'Stationery/Black Mesh Wire Document Letter Tray 3 Tier Stand.jpg', alts: [] },
  { sku: 'OB-NOT-76', primary: 'Stationery/ITC Long Note - 160 Pages Hard .jpeg', alts: [] },
  { sku: 'OB-NOT-80', primary: 'Stationery/Premium Quality Cloth Line Envelope 12x10 Inch 100 Nos Pack.jpg', alts: [] },
  { sku: 'OB-PAC-1056', primary: 'Packing Product/White Box Strapping Roll Polypropylene PP Packing Band Roll.jpg', alts: [] },
  { sku: 'OB-HOU-1024', primary: 'Hit and Disinfectant Spray/Lazzo Insect Killer Machine Blue UV Light On Front View.jpg', alts: [] }
];

// Combine all product mappings
const completeProductMap = new Map();

for (const b of baseVerified) {
  const cleanSource = b.supplierSource.replace(/^Product Photo \(4-3-26\)[\/\\]/, '');
  const alts = galleryMap.get(b.sku) || [];
  completeProductMap.set(b.sku, {
    sku: b.sku,
    primarySource: cleanSource,
    altSources: alts
  });
}

for (const n of verifiedAdditions) {
  const existing = completeProductMap.get(n.sku);
  if (!existing) {
    completeProductMap.set(n.sku, {
      sku: n.sku,
      primarySource: n.primary,
      altSources: n.alts
    });
  } else {
    const mergedAlts = Array.from(new Set([...existing.altSources, ...n.alts]));
    completeProductMap.set(n.sku, {
      sku: n.sku,
      primarySource: n.primary || existing.primarySource,
      altSources: mergedAlts
    });
  }
}

console.log(`Total mapped products to process: ${completeProductMap.size}`);

// Verify existence
for (const [sku, item] of completeProductMap.entries()) {
  const pPath = path.join(SOURCE_DIR, item.primarySource);
  if (!fs.existsSync(pPath)) {
    throw new Error(`CRITICAL: Primary image for ${sku} does not exist: ${pPath}`);
  }
  for (const alt of item.altSources) {
    const aPath = path.join(SOURCE_DIR, alt);
    if (!fs.existsSync(aPath)) {
      throw new Error(`CRITICAL: Alt image for ${sku} does not exist: ${aPath}`);
    }
  }
}

console.log('All source files verified to exist in Office Bazzar New Images!');

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
  let primaryCount = 0;
  let altCount = 0;

  for (const [sku, item] of completeProductMap.entries()) {
    const primaryDest = `${sku}.webp`;
    await processImage(item.primarySource, primaryDest);
    primaryCount++;

    for (let i = 0; i < item.altSources.length; i++) {
      const altDest = `${sku}-alt-${i + 1}.webp`;
      await processImage(item.altSources[i], altDest);
      altCount++;
    }

    if (primaryCount % 50 === 0 || primaryCount === completeProductMap.size) {
      console.log(`Processed ${primaryCount} products (${primaryCount + altCount} total images)...`);
    }
  }

  console.log(`Completed Sharp processing! Primary: ${primaryCount}, Alts: ${altCount}, Total: ${primaryCount + altCount}`);

  const manifest = [];
  for (const [sku, item] of completeProductMap.entries()) {
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
}

run().catch(err => {
  console.error('Error running conversion:', err);
  process.exit(1);
});
