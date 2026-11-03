const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'Office Bazzar New Images');

const candidateList = [
  { sku: 'OB-GAR-1031', name: 'Garbage Bag - Small', primary: 'Garbage Bag/Clean India Garbage Bags Packaging Boxes 4 Sizes Small Medium Large XL.jpg', alts: [] },
  { sku: 'OB-108', name: 'Chemical Trigger Spray Bottle', primary: 'Sprayer Pump/Translucent Plastic Trigger Spray Bottles White Sprayer Pair.JPG', alts: [] },
  { sku: 'OB-130', name: 'Urinal Screen Anti-Splash Mats', primary: 'Urinal Screen/Crew Urinal Screen Orange Sealed Pack.jpg', alts: ['Urinal Screen/Diversey TASKI Fresh and Clean Urinal Screen Green Box Front and Pack.JPG'] },
  { sku: 'OB-086', name: 'Rubber Welcome Mat', primary: 'Mat/Comfort PVC Cushion Coil Welcome Door Mat Green Gold Oval Label.jpg', alts: [] },
  { sku: 'OB-089', name: 'Plastic Handheld Dustpan', primary: 'Bucket-Mug-Tray/Dustpan (10).jpg', alts: ['Bucket-Mug-Tray/Dustpan (2).jpg'] },
  { sku: 'OB-073', name: 'Commercial Glass Wiper', primary: 'Wiper/Window Glass Wiper Telescopic Handle With Mesh Sponge and Squeegee.jpg', alts: [] },
  { sku: 'OB-075', name: 'Kitchen Counter Wiper', primary: 'Wiper/Kitchen and Table Mini Squeegee Wiper Pink Green Peach Blue 4-Piece Set.jpg', alts: ['Wiper/Handheld Kitchen and Window Squeegee Wiper Blue Cyan Pink Trio.jpg'] },
  { sku: 'OB-083', name: 'Heavy Duty Mop Stick Handle', primary: 'Collage/Mop Stick Handle.jpg', alts: [] },
  { sku: 'OB-109', name: 'Goodknight Mosquito Repellent Machine Set', primary: 'Hit and Disinfectant Spray/Good Knight Flash Liquid Vaporiser Kit Machine And Refill Lavender 45 ml With Box.jpg', alts: [] },
  { sku: 'OB-TIS-1101', name: 'Toilet Roll Big', primary: 'Tissue Product/Royal Natural Jumbo Roll Tissue JRT Two Rolls Stack.jpg', alts: ['Tissue Product/Kosher JRT Jumbo Rolled Tissue 4 Inch x 750 Gms Carton with Rolls.jpg'] },
  { sku: 'OB-BOA-1049', name: 'White Board Duster', primary: 'Stationery/JB9 Magnetic White Board Duster Red with Marker Holder and Box.jpg', alts: ['Stationery/JB9 Magnetic White Board Duster Pack of 10 Boxes Shrink Wrapped.jpg'] },
  { sku: 'OB-BOA-1050', name: 'A4 Display Folders', primary: 'Stationery/Magnetic Folder A4 .jpeg', alts: [] },
  { sku: 'OB-DIS-1060', name: 'Double Sided Newspaper Stand', primary: 'Stationery/Magazine Brochure Display Stand Rack Models 1271 1272 1318 1328 Chart.jpg', alts: [] },
  { sku: 'OB-FIL-34', name: 'A4 Button File Folder', primary: 'Stationery/Button Bag FS.jpeg', alts: ['Stationery/Button Bag FS 1.jpeg'] },
  { sku: 'OB-NOT-71', name: 'Post-it Self Adhesive Sticky Notes Pad', primary: 'Stationery/JB9 Prompt Sticky Note Pad Multi Color 76x76mm with 12 Pcs Box.jpg', alts: ['Stationery/JB9 Prompt Sticky Note Pad Pink and Yellow 76x76mm 3x3 Inch Pair.jpg'] },
  { sku: 'OB-NOT-68', name: 'Steel Wire Gem Clips Pack', primary: 'Stationery/JB9 U Clips Triangular 26mm Nickel Plated Box with Clips.jpg', alts: ['Stationery/JB9 U Clips Triangular 26mm Nickel Plated 1000 Pc Box and Small Box.jpg'] },
  { sku: 'OB-PAC-1053', name: 'Floor Marking Tapes', primary: 'Stationery/Floor Masking Tape 2 inch 25 mtr.jpeg', alts: [] }
];

console.log('Verifying files in Office Bazzar New Images...');
let verified = 0;
for (const c of candidateList) {
  const pPath = path.join(srcDir, c.primary);
  const pExists = fs.existsSync(pPath);
  console.log(`${pExists ? 'OK' : 'FAIL'} | ${c.sku.padEnd(12)} | ${c.name.slice(0, 32).padEnd(32)} -> ${c.primary}`);
  if (pExists) verified++;
  for (const alt of c.alts) {
    const aPath = path.join(srcDir, alt);
    if (!fs.existsSync(aPath)) console.log(`   FAIL ALT: ${alt}`);
  }
}

console.log(`\nVerified ${verified} / ${candidateList.length} candidate files!`);
