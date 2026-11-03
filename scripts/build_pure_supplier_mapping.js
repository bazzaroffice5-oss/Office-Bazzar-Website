const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/supplier_inventory_complete.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

// Load all 383 catalog products
const rawCatalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const regex = /\{\s*\"id\":\s*\"([^\"]+)\"[\s\S]*?\"name\":\s*\"([^\"]+)\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"categoryId\":\s*\"([^\"]+)\"[\s\S]*?\"brandName\":\s*\"([^\"]+)\"/g;

const catalogProducts = [];
let match;
while ((match = regex.exec(rawCatalogContent)) !== null) {
  catalogProducts.push({
    id: match[1],
    name: match[2],
    sku: match[3],
    categoryId: match[4],
    brand: match[5]
  });
}

function findSupplierImage(filterFn) {
  return validImages.find(filterFn);
}

function findAllSupplierImages(filterFn) {
  return validImages.filter(filterFn);
}

// Map each product ONLY to the supplier archive
const results = [];
let matchedCount = 0;
let missingCount = 0;

for (const p of catalogProducts) {
  const sku = p.sku;
  const name = p.name.toLowerCase();
  let matchedImage = null;
  let alternateImages = [];

  // 1. Direct OB-001 to OB-153 Housekeeping catalogue mapping
  const obMatch = sku.match(/^OB-(\d{3})$/);
  if (obMatch) {
    const num = parseInt(obMatch[1], 10);
    // Find candidate by code or known item
    // Specific high-confidence matches:
    if (num === 3) matchedImage = findSupplierImage(f => f.relPath.includes('Automatic Shoe Cover Dispenser Gold (2).jpg'));
    else if (num === 4) matchedImage = findSupplierImage(f => f.relPath.includes('Paper Cup Dispenser Wall Mount White.jpg'));
    else if (num === 5) matchedImage = findSupplierImage(f => f.relPath.includes('Jet Hand Dryer.jpg'));
    else if (num === 6) matchedImage = findSupplierImage(f => f.relPath.includes('CRV 15-C Ltr Stainless Steel Wet And Dry'));
    else if (num === 7) matchedImage = findSupplierImage(f => f.relPath.includes('Automatic Shoe Shining Machine Golden Steel Polish Cream Dispenser Front View.JPG'));
    else if (num === 8) matchedImage = findSupplierImage(f => f.relPath.includes('Aluminium Telescopic Extension Poles Assorted Lengths With Cobweb Duster Brushes Display.jpeg'));
    else if (num === 9) matchedImage = findSupplierImage(f => f.relPath.includes('Queue Manager Gold Stanchion Posts with Red Velvet Rope.jpg'));
    else if (num === 12) matchedImage = findSupplierImage(f => f.relPath.includes('Lazzo Hand Soap Dispenser 1000ml Curved Top With Box.jpg'));
    else if (num === 14) matchedImage = findSupplierImage(f => f.relPath.includes('Elbow Push Soap And Sanitizer Dispenser ABS.jpg'));
    else if (num === 15) matchedImage = findSupplierImage(f => f.relPath.includes('Manual Double Soap Dispenser 500ml x 2 White (2).jpg'));
    else if (num === 16) matchedImage = findSupplierImage(f => f.relPath.includes('Manual Double Soap Dispenser 500ml x 2 White.jpg'));
    else if (num === 17) matchedImage = findSupplierImage(f => f.relPath.includes('Automatic Hand Sanitizer Soap Dispenser White Collage.jpg'));
    else if (num === 21) matchedImage = findSupplierImage(f => f.relPath.includes('Jumbo Toilet Roll Dispenser.jpg'));
    else if (num === 23) matchedImage = findSupplierImage(f => f.relPath.includes('Cute Star Design Jumbo Toilet Roll Dispenser Pair White Grey.jpg'));
    else if (num === 24) matchedImage = findSupplierImage(f => f.relPath.includes('Cute Star Design Jumbo Toilet Roll Dispenser Pair White Grey.jpg'));
    else if (num === 25) matchedImage = findSupplierImage(f => f.relPath.includes('Greenlime HRT Roll Dispenser 1.jpeg'));
    else if (num === 26) matchedImage = findSupplierImage(f => f.relPath.includes('HRT Roll Towel Dispenser Autocut White Pull (2).JPG'));
    else if (num === 33) matchedImage = findSupplierImage(f => f.relPath.includes('Greenlime HRT White Hand Roll Towel 02410056 Carton with Two Rolls.jpg'));
    else if (num === 35) matchedImage = findSupplierImage(f => f.relPath.includes('C-Fold Paper Hand Towel White Pack and Stack Side View.jpg'));
    else if (num === 38) matchedImage = findSupplierImage(f => f.relPath.includes('Glass Cloth 18x18.jpg'));
    else if (num === 39) matchedImage = findSupplierImage(f => f.relPath.includes('Floor Cleaning Cloth 20x20.jpg'));
    else if (num === 41) matchedImage = findSupplierImage(f => f.relPath.includes('Blue Microfiber Cloth.JPG'));
    else if (num === 42) matchedImage = findSupplierImage(f => f.relPath.includes('Floor Cleaning Cloth.jpg'));
    else if (num === 43) matchedImage = findSupplierImage(f => f.relPath.includes('Color Bath Towel 24x48.jpg'));
    else if (num === 44) matchedImage = findSupplierImage(f => f.relPath.includes('Blue Microfiber Cloth.JPG'));
    else if (num === 48) matchedImage = findSupplierImage(f => f.relPath.includes('Dual Action Green and Yellow Sponge Scourer Pad Flat View.jpg'));
    else if (num === 49) matchedImage = findSupplierImage(f => f.relPath.includes('Exe Safe Heavy Quality Stainless Steel Scrubber 12 Pcs Hanging Card.jpg'));
    else if (num === 51) matchedImage = findSupplierImage(f => f.relPath.includes('Pril Dishwash Liquid And Exo Dish Wash Bar.jpg'));
    else if (num === 53) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Liquid Soap Green Apple Germs Killer 1000ml Bottle Front and Back.jpg'));
    else if (num === 57) matchedImage = findSupplierImage(f => f.relPath.includes('Toilet Cleaning Brushes Assortment.jpg'));
    else if (num === 58) matchedImage = findSupplierImage(f => f.relPath.includes('Blue Plastic Handle Floor Scrub Brush Side View.jpg'));
    else if (num === 59) matchedImage = findSupplierImage(f => f.relPath.includes('Dry Mop Set with Blue Cotton Mop Head and Extendable Handle.jpg'));
    else if (num === 60) matchedImage = findSupplierImage(f => f.relPath.includes('Kitchen and Table Mini Squeegee Wiper Pink Green Peach Blue 4-Piece Set.jpg'));
    else if (num === 61) matchedImage = findSupplierImage(f => f.relPath.includes('Joy And Victor Rubber Household Gloves.jpg'));
    else if (num === 62) matchedImage = findSupplierImage(f => f.relPath.includes('Nylon Broom.jpg'));
    else if (num === 63) matchedImage = findSupplierImage(f => f.relPath.includes('Kitchen Dish Wash Nylon Strip Scrub Sponge Multicolor Pack of 3.jpg'));
    else if (num === 65) matchedImage = findSupplierImage(f => f.relPath.includes('Floor And Glass Wipers Collection.jpg'));
    else if (num === 66) matchedImage = findSupplierImage(f => f.relPath.includes('Plastic Cleaning Caddy Basket Blue 3 Compartments Top View.jpg'));
    else if (num === 67) matchedImage = findSupplierImage(f => f.relPath.includes('Mop Wringer Trolley 50L.jpg'));
    else if (num === 69) matchedImage = findSupplierImage(f => f.relPath.includes('Aluminium Stick 5 Feet 1.jpg'));
    else if (num === 70) matchedImage = findSupplierImage(f => f.relPath.includes('Plastic Clip.jpeg'));
    else if (num === 71) matchedImage = findSupplierImage(f => f.relPath.includes('Floor Scrub Sponge With Plastic Handle.jpg'));
    else if (num === 74) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R1 to R9 Housekeeping Chemicals.jpeg'));
    else if (num === 75) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Disinfectant Floor Cleaner Rose 5 Litre Can.jpg'));
    else if (num === 76) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Disinfectant Floor Cleaner Pine 5 Litre Can.jpg'));
    else if (num === 77) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Disinfectant Floor Cleaner Jasmine 5 Litre Can.jpg'));
    else if (num === 78) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Disinfectant Floor Cleaner Citrus 5 Litre Can.jpg'));
    else if (num === 80) matchedImage = findSupplierImage(f => f.relPath.includes('Aluminium Flat Mop Set with Telescopic Handle Full View.jpg'));
    else if (num === 81) matchedImage = findSupplierImage(f => f.relPath.includes('Spray Mop.jpg'));
    else if (num === 83) matchedImage = findSupplierImage(f => f.relPath.includes('Kentucky Mop Set With Blue Head And Long Handle.jpg'));
    else if (num === 84) matchedImage = findSupplierImage(f => f.relPath.includes('Microfiber Twist Mop Telescopic Handle Set of 4 Colors Orange Green Blue Pink.jpg'));
    else if (num === 85) matchedImage = findSupplierImage(f => f.relPath.includes('Taski Tapi Spotex 1 Carpet Stain Remover 500ml Bottle Front and Back.jpg'));
    else if (num === 86) matchedImage = findSupplierImage(f => f.relPath.includes('Taski Tapi Spotex 2 Tannin Stain Remover 500ml Bottle Front and Back.jpg'));
    else if (num === 87) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R1 Super Bathroom Cleaner Concentrate 5 Litre Can.jpg'));
    else if (num === 89) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R2 Super Hygienic Hard Surface Cleaner Concentrate 5 Litre Can.jpg'));
    else if (num === 90) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R3 Glass Cleaner Concentrate 5 Litre Can Front and Back.jpg'));
    else if (num === 92) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R4 Furniture Polish 5 Litre Can Front and Back.jpg'));
    else if (num === 94) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R5 Air Freshener Concentrate 5 Litre Can Front and Back.jpg'));
    else if (num === 95) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R6 Heavy Duty Toilet Cleaner 5 Litre Can Front and Back.jpg'));
    else if (num === 96) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R7 Floor Cleaner Concentrate 5 Litre Can Front and Back.jpg'));
    else if (num === 97) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R9 Bathroom Cleaner Concentrate 5 Litre Can Front and Back.jpg'));
    else if (num === 98) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R20 Alkaline Floor Stripper 5 Litre Can Front and Back.jpg'));
    else if (num === 99) matchedImage = findSupplierImage(f => f.relPath.includes('Taski R10.jpg'));
    else if (num === 100) matchedImage = findSupplierImage(f => f.relPath.includes('Taski Spiral Heavy Duty Floor Cleaner 5 Litre Can Front and Back.jpg'));
    else if (num === 101) matchedImage = findSupplierImage(f => f.relPath.includes('Diversey Suma Scale D5.2 Descaler 5 Litre Can Front and Back.jpg'));
    else if (num === 102) matchedImage = findSupplierImage(f => f.relPath.includes('Taski Combifat 5 Ltr Front and Back.jpg'));
    else if (num === 103) matchedImage = findSupplierImage(f => f.relPath.includes('Dry Mop Blue.jpg'));
    else if (num === 104) matchedImage = findSupplierImage(f => f.relPath.includes('Microfiber Glass Cleaning Cloth Blue.jpg'));
    else if (num === 105) matchedImage = findSupplierImage(f => f.relPath.includes('Aluminium Mop Holder.jpeg'));
    else if (num === 106) matchedImage = findSupplierImage(f => f.relPath.includes('Lobby Dustpan With Comb Teeth And Wiper Broom Set Long Stainless Steel Handles.jpg'));
    else if (num === 107) matchedImage = findSupplierImage(f => f.relPath.includes('Handheld Kitchen and Window Squeegee Wiper Blue Cyan Pink Trio.jpg'));
    else if (num === 111) matchedImage = findSupplierImage(f => f.relPath.includes('Caustic Soda.jpeg'));
    else if (num === 113) matchedImage = findSupplierImage(f => f.relPath.includes('Aluminium Stick 5 Feet.jpg'));
    else if (num === 115) matchedImage = findSupplierImage(f => f.relPath.includes('Can Stick.JPG'));
    else if (num === 116) matchedImage = findSupplierImage(f => f.relPath.includes('China Stick.JPG'));
    else if (num === 120) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Toilet Cleaner All in 1 Extra Power Original 5 Litre Can Front and Back.jpg'));
    else if (num === 122) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Glass Cleaner 2X More Shine Boosters Original 5 Litre Can Front and Back.jpg'));
    else if (num === 123) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Black Concentrate Cleaner 500ml Bottle Front and Back.jpg'));
    else if (num === 124) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean HC-H1 Liquid Hand Wash Pink 5 Litre Can Front and Back.jpg'));
    else if (num === 125) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Disinfectant Bathroom Cleaner 10X Better Cleaning Red 500ml Bottle Front and Back.jpg'));
    else if (num === 129) matchedImage = findSupplierImage(f => f.relPath.includes('Hi-Clean Sodium Hypochlorite 6 Percent Liquid Cleaner 5 Litre Can.jpg'));
    else if (num === 131) matchedImage = findSupplierImage(f => f.relPath.includes('Clean India Garbage Bags Jumbo 92x122 cm Roll With Box.jpg'));
    else if (num === 132) matchedImage = findSupplierImage(f => f.relPath.includes('Comfort PVC Cushion Coil Plain Door Mat Green With Gold Oval Label.jpg'));
    else if (num === 133) matchedImage = findSupplierImage(f => f.relPath.includes('Bestone Household Rubber Gloves Natural Latex Orange Size M With Pouch.jpg'));
    else if (num === 134) matchedImage = findSupplierImage(f => f.relPath.includes('Cotton Knitted Hand Gloves 40 gms Black (2).jpeg'));
    else if (num === 138) matchedImage = findSupplierImage(f => f.relPath.includes('Triple Bucket Mop Wringer Trolley Cart Stainless Steel Frame Blue Red Yellow.jpg'));
    else if (num === 140) matchedImage = findSupplierImage(f => f.relPath.includes('Triple Bucket Mop Wringer Trolley Cart Stainless Steel Frame Blue Red Yellow.jpg'));
    else if (num === 141) matchedImage = findSupplierImage(f => f.relPath.includes('Equal Foldable Platform Trolley 200kg and 400kg Stacked Front View.jpg'));
    else if (num === 142) matchedImage = findSupplierImage(f => f.relPath.includes('Multipurpose Janitor Cart Cleaning Trolley Blue With Mop Wringer And Yellow Bag.jpg'));
    else if (num === 143) matchedImage = findSupplierImage(f => f.relPath.includes('Double Bucket Mop Wringer Trolley Cart 50 Ltr Blue Red Buckets Side View.JPG'));
    else if (num === 147) matchedImage = findSupplierImage(f => f.relPath.includes('Aristo Twin Pedal Dustbin Wet And Dry Waste Green And Blue.jpg'));
    else if (num === 149) matchedImage = findSupplierImage(f => f.relPath.includes('Aristo 4-Wheel Garbage Bin 660 Ltr Green Outdoor View.jpeg'));
    else if (num === 152) matchedImage = findSupplierImage(f => f.relPath.includes('Aristo 4-Wheel Garbage Bin 660 Ltr Blue Front View.jpg'));
    else if (num === 153) matchedImage = findSupplierImage(f => f.relPath.includes('Aristo 4-Wheel Garbage Bin 1100 Ltr Blue Closed Lid.jpg'));
  }

  // 2. COVID / Safety Items
  if (!matchedImage && sku.startsWith('OB-COV-')) {
    if (sku === 'OB-COV-03') matchedImage = findSupplierImage(f => f.relPath.includes('Breath Guard 3 Ply Surgical Face Mask With 100 Pcs Box.jpg'));
    else if (sku === 'OB-COV-06') matchedImage = findSupplierImage(f => f.relPath.includes('Cotton Knitted Hand Gloves 4 Colors Black Blue White Gray Collage.jpg'));
    else if (sku === 'OB-COV-09') matchedImage = findSupplierImage(f => f.relPath.includes('GloveOn Edge Latex Powder Free Examination Gloves Size M Box With White Glove.jpg'));
    else if (sku === 'OB-COV-10') matchedImage = findSupplierImage(f => f.relPath.includes('Anti Fog Protective Face Shield Visor With Glasses Frame And Red Box.jpg'));
    else if (sku === 'OB-COV-22') matchedImage = findSupplierImage(f => f.relPath.includes('Breath Guard 3 Ply Face Mask Packaging Boxes 50 Pcs And 100 Pcs.jpg'));
    else if (sku === 'OB-COV-23') matchedImage = findSupplierImage(f => f.relPath.includes('Automatic Shoe Cover Dispenser Gold (2).jpg'));
    else if (sku === 'OB-COV-25') matchedImage = findSupplierImage(f => f.relPath.includes('Care4U Infrared Forehead Thermometer Handheld Device with Product Box.JPG'));
    else if (sku === 'OB-COV-26') matchedImage = findSupplierImage(f => f.relPath.includes('Queue Manager Stainless Steel Stanchion Post with Blue Retractable Belt.jpeg'));
  }

  // 3. Stationery & Desk Items
  if (!matchedImage) {
    if (sku === 'OB-STA-1001') matchedImage = findSupplierImage(f => f.relPath.includes('Tag File image.jpeg'));
    else if (sku === 'OB-STA-1002') matchedImage = findSupplierImage(f => f.relPath.includes('A - Z Box File 3025 .jpeg'));
    else if (sku === 'OB-FIL-19') matchedImage = findSupplierImage(f => f.relPath.includes('Magnetic Folder A4 .jpeg'));
    else if (sku === 'OB-FIL-26') matchedImage = findSupplierImage(f => f.relPath.includes('A - Z Box File 3025 .jpeg'));
    else if (sku === 'OB-FIL-21') matchedImage = findSupplierImage(f => f.relPath.includes('Button Bag FS.jpeg') || f.relPath.includes('Button Bag FS 1.jpeg'));
    else if (sku === 'OB-FIL-31') matchedImage = findSupplierImage(f => f.relPath.includes('Classik A4 403 2 Ring Binder D-Ring File Folder Blue Closed and Open Views.jpg'));
    else if (sku === 'OB-PEN-35') matchedImage = findSupplierImage(f => f.relPath.includes('Lazzo Gold Ballpen Colours 20 Pcs Box with 5 Pens Grey Background.jpg'));
    else if (sku === 'OB-PEN-41') matchedImage = findSupplierImage(f => f.relPath.includes('Lazzo Gold Smooth Writing Ballpen Colours 20 Pcs Box with 5 Pens Display.jpg'));
    else if (sku === 'OB-PEN-42') matchedImage = findSupplierImage(f => f.relPath.includes('faber-castell-highlighter-marker-500x500.jpeg'));
    else if (sku === 'OB-DES-55') matchedImage = findSupplierImage(f => f.relPath.includes('Handheld Carton Tape Dispenser Gun Blue and Black Front Angle View.jpg'));
    else if (sku === 'OB-DES-57') matchedImage = findSupplierImage(f => f.relPath.includes('Blue Box Strapping Band Roll Shrink Wrapped Close-up.jpg'));
    else if (sku === 'OB-NOT-66') matchedImage = findSupplierImage(f => f.relPath.includes('JB9 Binder Clip 32mm 1 Doz Box with Clips Front View.jpg') || f.relPath.includes('JB9 Binder Clip 25mm'));
    else if (sku === 'OB-NOT-67') matchedImage = findSupplierImage(f => f.relPath.includes('JB9 Bright Electro Nickel Plated T-Pins 3N Single Box.jpg'));
    else if (sku === 'OB-NOT-70') matchedImage = findSupplierImage(f => f.relPath.includes('JB9 Pure Nylon Rubber Band Multi Color 500gm Pouch JB9-135.jpg'));
    else if (sku === 'OB-NOT-71') matchedImage = findSupplierImage(f => f.relPath.includes('JB9 Prompt Sticky Note Pad Multi Color 76x76mm with 12 Pcs Box.jpg') || f.relPath.includes('JB9 Prompt Sticky Note Pad Pink'));
    else if (sku === 'OB-NOT-74') matchedImage = findSupplierImage(f => f.relPath.includes('Black Mesh Wire Document Letter Tray 3 Tier Stand.jpg'));
    else if (sku === 'OB-NOT-76') matchedImage = findSupplierImage(f => f.relPath.includes('ITC Long Note - 160 Pages Hard .jpeg'));
    else if (sku === 'OB-NOT-80') matchedImage = findSupplierImage(f => f.relPath.includes('Premium Quality Cloth Line Envelope 12x10 Inch 100 Nos Pack.jpg'));
    else if (sku === 'OB-COM-1039') matchedImage = findSupplierImage(f => f.relPath.includes('Black Mesh Wire Document Letter Tray 3 Tier Stand.jpg'));
    else if (sku === 'OB-BOA-1049') matchedImage = findSupplierImage(f => f.relPath.includes('JB9 Chalk Board and Non Magnetic White Board Duster Packaging Box.jpg'));
    else if (sku === 'OB-PAC-1051') matchedImage = findSupplierImage(f => f.relPath.includes('JB9 Cello Tape Dispenser Black with Packaging Box.jpg') || f.relPath.includes('JB9 Cello Tape Dispenser Black with Box Watermarked Background.jpg'));
    else if (sku === 'OB-PAC-1054') matchedImage = findSupplierImage(f => f.relPath.includes('Bubble Sheet Roll.jpg'));
    else if (sku === 'OB-DIS-1062') matchedImage = findSupplierImage(f => f.relPath.includes('AXL Med Automatic Infrared Thermometer Mounted on Adjustable Floor Tripod Stand.JPG'));
    else if (sku === 'OB-HOU-1070') matchedImage = findSupplierImage(f => f.relPath.includes('Royal Napkins 1-Ply Red Pack Front View.jpg'));
    else if (sku === 'OB-HOU-1074') matchedImage = findSupplierImage(f => f.relPath.includes('Dettol Disinfectant Spray Original Pine 225 ml Front And Back View.jpeg'));
    else if (sku === 'OB-CLE-1093') matchedImage = findSupplierImage(f => f.relPath.includes('Lizol Surface Cleaner And Harpic Toilet Cleaner.jpg'));
    else if (sku === 'OB-TIS-1096') matchedImage = findSupplierImage(f => f.relPath.includes('Stainless Steel Half Round Tissue Paper Napkin Holder (2).jpg'));
    else if (sku === 'OB-HOU-1013') matchedImage = findSupplierImage(f => f.relPath.includes('Stainless Steel Half Round Tissue Paper Napkin Holder (2).jpg'));
    else if (sku === 'OB-HOU-1015') matchedImage = findSupplierImage(f => f.relPath.includes('Toilet Cleaning Brushes Assortment.jpg'));
    else if (sku === 'OB-HOU-1017') matchedImage = findSupplierImage(f => f.relPath.includes('Bestone Household Rubber Gloves 4 Colors Red Orange Blue Yellow With Pouch.jpg'));
    else if (sku === 'OB-HOU-1019') matchedImage = findSupplierImage(f => f.relPath.includes('Floor And Glass Wipers Collection.jpg'));
    else if (sku === 'OB-HOU-1020') matchedImage = findSupplierImage(f => f.relPath.includes('Plastic Cleaning Caddy Basket Blue 3 Compartments Top View.jpg'));
    else if (sku === 'OB-HOU-1021') matchedImage = findSupplierImage(f => f.relPath.includes('Mop Wringer Trolley 50L.jpg'));
    else if (sku === 'OB-HOU-1027') matchedImage = findSupplierImage(f => f.relPath.includes('Jumbo Toilet Roll Dispenser.jpg'));
    else if (sku === 'OB-GAR-1028') matchedImage = findSupplierImage(f => f.relPath.includes('Perforated Stainless Steel Dustbin 8x12 (2).jpg'));
  }

  if (matchedImage) {
    matchedCount++;
    results.push({
      sku: p.sku,
      name: p.name,
      category: p.categoryId,
      brand: p.brand,
      status: 'VERIFIED_SUPPLIER_IMAGE',
      supplierSource: matchedImage.relPath,
      images: [`/assets/products/catalog_2026/${p.sku}.webp`]
    });
  } else {
    missingCount++;
    results.push({
      sku: p.sku,
      name: p.name,
      category: p.categoryId,
      brand: p.brand,
      status: 'MISSING_SUPPLIER_IMAGE',
      supplierSource: null,
      images: [] // Explicitly EMPTY! Zero legacy images!
    });
  }
}

console.log(`\n========================================`);
console.log(`STRICT PURE SUPPLIER AUDIT COMPLETED:`);
console.log(`Total Products: ${catalogProducts.length}`);
console.log(`Matched to Supplier Archive: ${matchedCount}`);
console.log(`Missing Supplier Image: ${missingCount}`);
console.log(`========================================\n`);

fs.writeFileSync('scripts/pure_supplier_catalog_decision.json', JSON.stringify(results, null, 2), 'utf8');

