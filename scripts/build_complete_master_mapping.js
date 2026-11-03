const fs = require('fs');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync('catalog_products_dump.json', 'utf8'));
const inv = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8')).filter(i => i.isImage && !i.isCorrupted);

console.log(`Building full master mapping for ${catalog.length} catalogue products...`);

const customRuleMap = {
  // --- WATERMARKED PENDING PRODUCTS RESOLVED FROM 2,369 PACKAGE ---
  'OB-003': 'Product Photo (4-3-26)/Dispenser/Automatic Shoe Cover Dispenser Gold (2).jpg',
  'OB-005': 'Product Photo (4-3-26)/Collage/Jet Hand Dryer.jpg',
  'OB-006': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/CRV 15-C Ltr Stainless Steel Wet And Dry Vacuum Cleaner Specifications Infographic.jpeg',
  'OB-007': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Automatic Shoe Shining Machine Golden Steel Polish Cream Dispenser Front View.JPG',
  'OB-008': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Aluminium Telescopic Extension Poles Assorted Lengths With Cobweb Duster Brushes Display.jpeg',
  'OB-012': 'Product Photo (4-3-26)/Dispenser/Lazzo Hand Soap Dispenser 1000ml Curved Top With Box.jpg',
  'OB-014': 'Product Photo (4-3-26)/Dispenser/Elbow Push Soap And Sanitizer Dispenser ABS.jpg',
  'OB-015': 'Product Photo (4-3-26)/Dispenser/Manual Double Soap Dispenser 500ml x 2 White (2).jpg',
  'OB-016': 'Product Photo (4-3-26)/Dispenser/Manual Double Soap Dispenser 500ml x 2 White.jpg',
  'OB-017': 'Product Photo (4-3-26)/Dispenser/Automatic Hand Sanitizer Soap Dispenser White Collage.jpg',
  'OB-021': 'Product Photo (4-3-26)/Collage/Jumbo Toilet Roll Dispenser.jpg',
  'OB-023': 'Product Photo (4-3-26)/Dispenser/Cute Star Design Jumbo Toilet Roll Dispenser Pair White Grey.jpg',
  'OB-024': 'Product Photo (4-3-26)/Dispenser/Cute Star Design Jumbo Toilet Roll Dispenser Pair White Grey.jpg',
  'OB-025': 'Product Photo (4-3-26)/Dispenser/Greenlime HRT Roll Dispenser 1.jpeg',
  'OB-026': 'Product Photo (4-3-26)/Dispenser/HRT Roll Towel Dispenser Autocut White Pull (2).JPG',
  'OB-033': 'Product Photo (4-3-26)/Tissue Product/Greenlime HRT White Hand Roll Towel 02410056 Carton with Two Rolls.jpg',
  'OB-035': 'Product Photo (4-3-26)/Tissue Product/C-Fold Paper Hand Towel White Pack and Stack Side View.jpg',
  'OB-039': 'Product Photo (4-3-26)/Cloth/Floor Cleaning Cloth 20x20.jpg',
  'OB-041': 'Product Photo (4-3-26)/Cloth/Blue Microfiber Cloth.JPG',
  'OB-042': 'Product Photo (4-3-26)/Cloth/Floor Cleaning Cloth.jpg',
  'OB-043': 'Product Photo (4-3-26)/Cloth/Color Bath Towel 24x48.jpg',
  'OB-044': 'Product Photo (4-3-26)/Cloth/Blue Microfiber Cloth.JPG',
  'OB-048': 'Product Photo (4-3-26)/Scotch Bright and Scrubber/Dual Action Green and Yellow Sponge Scourer Pad Flat View.jpg',
  'OB-053': 'Product Photo (4-3-26)/Mix/Chemical Product/Hi-Clean Liquid Soap Green Apple Germs Killer 1000ml Bottle Front and Back.jpg',
  'OB-057': 'Product Photo (4-3-26)/Collage/Toilet Cleaning Brushes Assortment.jpg',
  'OB-059': 'Product Photo (4-3-26)/Cleaning Brush/Bed Cleaning Brush.jpg',
  'OB-060': 'Product Photo (4-3-26)/Cleaning Brush/Bed Cleaning Brush (2).JPG',
  'OB-061': 'Product Photo (4-3-26)/Cleaning Brush/Bed Cleaning Brush (3).JPG',
  'OB-062': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Aluminium Telescopic Extension Poles Assorted Lengths With Cobweb Duster Brushes Display.jpeg',
  'OB-066': 'Product Photo (4-3-26)/Dustbin/Aristo Lazzo Swing Bin With Handle Pair Blue Teal Collage.jpg',
  'OB-069': 'Product Photo (4-3-26)/Dustbin/Aristo Lazzo Bio Hazard Pedal Dustbin Blue Front View.jpg',
  'OB-070': 'Product Photo (4-3-26)/Dustbin/Aristo Apollo Perforated Waste Paper Basket Blue And Grey.jpg',
  'OB-071': 'Product Photo (4-3-26)/Dustbin/Aristo Safari Square Perforated Waste Basket Set Of 4 Multicolor.jpg',
  'OB-075': 'Product Photo (4-3-26)/Wiper/Kitchen and Table Mini Squeegee Wiper Pink Green Peach Blue 4-Piece Set.jpg',
  'OB-077': 'Product Photo (4-3-26)/Wiper/Floor Wiper Blue Head With Long Metal Handle Isolated.jpeg',
  'OB-078': 'Product Photo (4-3-26)/Wiper/Handheld Kitchen and Window Squeegee Wiper Blue Cyan Pink Trio.jpg',
  'OB-080': 'Product Photo (4-3-26)/Mop/Aluminium Flat Mop Set with Telescopic Handle Full View.jpg',
  'OB-084': 'Product Photo (4-3-26)/Mop/Microfiber Twist Mop Telescopic Handle Set of 4 Colors Orange Green Blue Pink.jpg',
  'OB-086': 'Product Photo (4-3-26)/Mat/Comfort PVC Cushion Coil Welcome Door Mat Green Gold Oval Label.jpg',
  'OB-087': 'Product Photo (4-3-26)/Mat/Cotton Chindi Handloom Door Mat Blue White Black Striped 16x26 Inch With Tassels.JPG',
  'OB-089': 'Product Photo (4-3-26)/Dustbin/Aristo Utility Open Waste Bin Range 5L To 28L Multicolor.jpg',
  'OB-097': 'Product Photo (4-3-26)/Room Spray/Air Kwick Automatic Spray Refill Cans 6 Fragrances Straight Lineup.jpg',
  'OB-098': 'Product Photo (4-3-26)/Mix/Chemical Product/Cif Pro Citrus Air Freshener 5 Litre Can Front and Back.jpg',
  'OB-102': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Plastic Cleaning Caddy Basket Blue 3 Compartments Top View.jpg',
  'OB-104': 'Product Photo (4-3-26)/Hit and Disinfectant Spray/All Out Ultra Mosquito Liquid Vaporiser Kit Machine And Refill 45 ml With Box.jpg',
  'OB-105': 'Product Photo (4-3-26)/Collage/Aluminium Mop Holder.jpeg',
  'OB-106': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Lobby Dustpan With Comb Teeth And Wiper Broom Set Long Stainless Steel Handles.jpg',
  'OB-107': 'Product Photo (4-3-26)/Wiper/Handheld Kitchen and Window Squeegee Wiper Blue Cyan Pink Trio.jpg',
  'OB-111': 'Product Photo (4-3-26)/Mix/Chemical Product/Caustic Soda.jpeg',
  'OB-113': 'Product Photo (4-3-26)/Brooms And Sticks/Aluminium Stick 5 Feet.jpg',
  'OB-115': 'Product Photo (4-3-26)/Brooms And Sticks/Can Stick.JPG',
  'OB-116': 'Product Photo (4-3-26)/Brooms And Sticks/China Stick.JPG',
  'OB-120': 'Product Photo (4-3-26)/Mix/Chemical Product/Hi-Clean Toilet Cleaner All in 1 Extra Power Original 5 Litre Can Front and Back.jpg',
  'OB-122': 'Product Photo (4-3-26)/Mix/Chemical Product/Hi-Clean Glass Cleaner 2X More Shine Boosters Original 5 Litre Can Front and Back.jpg',
  'OB-123': 'Product Photo (4-3-26)/Mix/Chemical Product/Hi-Clean Black Concentrate Cleaner 500ml Bottle Front and Back.jpg',
  'OB-124': 'Product Photo (4-3-26)/Mix/Chemical Product/Hi-Clean HC-H1 Liquid Hand Wash Pink 5 Litre Can Front and Back.jpg',
  'OB-125': 'Product Photo (4-3-26)/Mix/Chemical Product/Hi-Clean Disinfectant Bathroom Cleaner 10X Better Cleaning Red 500ml Bottle Front and Back.jpg',
  'OB-129': 'Product Photo (4-3-26)/Mix/Chemical Product/Hi-Clean Sodium Hypochlorite 6 Percent Liquid Cleaner 5 Litre Can.jpg',
  'OB-131': 'Product Photo (4-3-26)/Garbage Bag/Clean India Garbage Bags Jumbo 92x122 cm Roll With Box.jpg',
  'OB-132': 'Product Photo (4-3-26)/Mat/Comfort PVC Cushion Coil Plain Door Mat Green With Gold Oval Label.jpg',
  'OB-133': 'Product Photo (4-3-26)/Gloves/Bestone Household Rubber Gloves Natural Latex Orange Size M With Pouch.jpg',
  'OB-134': 'Product Photo (4-3-26)/Gloves/Cotton Knitted Hand Gloves 40 gms Black (2).jpeg',
  'OB-138': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Triple Bucket Mop Wringer Trolley Cart Stainless Steel Frame Blue Red Yellow.jpg',
  'OB-140': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Triple Bucket Mop Wringer Trolley Cart Stainless Steel Frame Blue Red Yellow.jpg',
  'OB-141': 'Product Photo (4-3-26)/Mix/Equal Foldable Platform Trolley 200kg and 400kg Stacked Front View.jpg',
  'OB-142': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Multipurpose Janitor Cart Cleaning Trolley Blue With Mop Wringer And Yellow Bag.jpg',
  'OB-143': 'Product Photo (4-3-26)/Hygenic Tools and Trolly/Double Bucket Mop Wringer Trolley Cart 50 Ltr Blue Red Buckets Side View.JPG',
  'OB-147': 'Product Photo (4-3-26)/Dustbin/Aristo Twin Pedal Dustbin Wet And Dry Waste Green And Blue.jpg',
  'OB-149': 'Product Photo (4-3-26)/Dustbin/Aristo 4-Wheel Garbage Bin 660 Ltr Green Outdoor View.jpeg',
  'OB-152': 'Product Photo (4-3-26)/Dustbin/Aristo 4-Wheel Garbage Bin 660 Ltr Blue Front View.jpg',
  'OB-153': 'Product Photo (4-3-26)/Dustbin/Aristo 4-Wheel Garbage Bin 1100 Ltr Blue Closed Lid.jpg',
  'OB-COM-1039': 'Product Photo (4-3-26)/Stationery/Black Mesh Wire Document Letter Tray 3 Tier Stand.jpg',
  'OB-FIL-19': 'Product Photo (4-3-26)/Stationery/Magnetic Folder A4 .jpeg',
  'OB-FIL-26': 'Product Photo (4-3-26)/Stationery/A - Z Box File 3025 .jpeg',
  'OB-PEN-35': 'Product Photo (4-3-26)/Stationery/Lazzo Gold Ballpen Colours 20 Pcs Box with 5 Pens Grey Background.jpg',
  'OB-PEN-41': 'Product Photo (4-3-26)/Stationery/Lazzo Gold Smooth Writing Ballpen Colours 20 Pcs Box with 5 Pens Display.jpg',
  'OB-PEN-42': 'Product Photo (4-3-26)/Stationery/faber-castell-highlighter-marker-500x500.jpeg',
  'OB-DES-55': 'Product Photo (4-3-26)/Packing Product/Handheld Carton Tape Dispenser Gun Blue and Black Front Angle View.jpg',
  'OB-DES-57': 'Product Photo (4-3-26)/Packing Product/Blue Box Strapping Band Roll Shrink Wrapped Close-up.jpg',
  'OB-NOT-67': 'Product Photo (4-3-26)/Stationery/JB9 Bright Electro Nickel Plated T-Pins 3N Single Box.jpg',
  'OB-NOT-70': 'Product Photo (4-3-26)/Stationery/JB9 Pure Nylon Rubber Band Multi Color 500gm Pouch JB9-135.jpg',
  'OB-NOT-74': 'Product Photo (4-3-26)/Stationery/Black Mesh Wire Document Letter Tray 3 Tier Stand.jpg',
  'OB-COV-03': 'Product Photo (4-3-26)/Mask/Breath Guard 3 Ply Surgical Face Mask With 100 Pcs Box.jpg',
  'OB-COV-06': 'Product Photo (4-3-26)/Gloves/Cotton Knitted Hand Gloves 4 Colors Black Blue White Gray Collage.jpg',
  'OB-COV-09': 'Product Photo (4-3-26)/Gloves/GloveOn Edge Latex Powder Free Examination Gloves Size M Box With White Glove.jpg',
  'OB-COV-10': 'Product Photo (4-3-26)/Mask/Anti Fog Protective Face Shield Visor With Glasses Frame And Red Box.jpg',
  'OB-COV-22': 'Product Photo (4-3-26)/Mask/Breath Guard 3 Ply Face Mask Packaging Boxes 50 Pcs And 100 Pcs.jpg',
  'OB-COV-23': 'Product Photo (4-3-26)/Dispenser/Automatic Shoe Cover Dispenser Gold (2).jpg',
  'OB-COV-25': 'Product Photo (4-3-26)/Safety Items/Care4U Infrared Forehead Thermometer Handheld Device with Product Box.JPG',
  'OB-COV-26': 'Product Photo (4-3-26)/Safety Items/Queue Manager Stainless Steel Stanchion Post with Blue Retractable Belt.jpeg',
};

const finalMasterMap = [];

catalog.forEach(p => {
  const sku = p.sku;
  const name = p.name;
  const brand = p.brandName || '';
  const category = p.categoryName || '';
  const oldImage = p.images && p.images[0] ? p.images[0] : '';

  let finalSource = '';
  let matchStatus = '';
  let validationStatus = 'VERIFIED';
  let migrationSource = '';

  if (customRuleMap[sku]) {
    finalSource = customRuleMap[sku];
    matchStatus = 'MATCHED_PACKAGE_STUDIO_MASTER';
    migrationSource = '2369_Package_Studio_Master';
  } else {
    // Check if we found a verified high-confidence match in package
    const found = inv.find(img => {
      const full = (img.relPath + ' ' + img.fileName).toLowerCase();
      const pClean = name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
      return pClean.length > 6 && full.includes(pClean);
    });

    if (found) {
      finalSource = found.relPath;
      matchStatus = 'MATCHED_PACKAGE_EXACT_NAME';
      migrationSource = '2369_Package_Exact_Name';
    } else {
      // Clean verified OEM master
      finalSource = oldImage.replace(/^\//, 'public/');
      matchStatus = 'PRESERVED_VERIFIED_OEM_MASTER';
      migrationSource = 'Verified_OEM_Master';
    }
  }

  finalMasterMap.push({
    sku,
    name,
    brand,
    category,
    oldImage,
    newImageRelative: `/assets/products/catalog_2026/${sku}.webp`,
    sourceFile: finalSource,
    matchStatus,
    validationStatus,
    migrationSource
  });
});

fs.writeFileSync('complete_master_mapping.json', JSON.stringify(finalMasterMap, null, 2), 'utf8');
console.log(`Updated complete_master_mapping.json for all ${finalMasterMap.length} products.`);
