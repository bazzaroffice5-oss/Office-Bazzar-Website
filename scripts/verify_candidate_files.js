const fs = require('fs');
const path = require('path');

const candidates = [
  { sku: 'OB-100', name: 'Telescopic Aluminum Extension Pole', rel: 'Hygenic Tools and Trolly/Aluminium Telescopic Extension Poles 3.6M 6M 8M Set of 3.png' },
  { sku: 'OB-126', name: 'Sodium Hypochlorite Disinfectant Solution (5L)', rel: 'Mix/Chemical Product/Hi-Clean Sodium Hypochlorite 6 Percent Liquid Cleaner 5 Litre Can.jpg' },
  { sku: 'OB-139', name: 'Handheld Shopping Basket Trolley', rel: 'Mix/Aristo Omega Trolley Shopping Basket Red With Telescopic Handle Front View.jpg' },
  { sku: 'OB-RDS-01', name: 'Flexible Traffic Cone 750mm', rel: 'Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm.JPG' },
  { sku: 'OB-RDS-03', name: 'Traffic Cone with Rubberized Plastic Base', rel: 'Safety Items/Rubber Base Traffic Cone RBTC 750mm Height 2kg Red Standing View.jpeg' },
  { sku: 'OB-RDS-20', name: 'Stainless Steel Retractable Q-Manager Stanchion Post 1m', rel: 'Safety Items/Queue Manager Stainless Steel Retractable Belt Barrier Stanchions Pair with Red Belt.JPG' },
  { sku: 'OB-RDS-22', name: 'Classic Velvet Rope Stanchion Post (Gold / SS)', rel: 'Safety Items/Queue Manager Gold Stanchion Posts with Red Velvet Rope.jpg' },
  { sku: 'OB-RDS-23', name: 'Plastic Chain Q-Manager Barrier Post 1000mm', rel: 'Safety Items/Red and White Plastic Safety Warning Barrier Chain Coil.jpg' },
  { sku: 'OB-COV-01', name: 'PPE Kit 90 GSM', rel: 'Safety Items/Personal Protective Equipment Kit Full Body Coverall 90 Gsm with Face Shield and Mask Packed Kit.JPG' },
  { sku: 'OB-COV-12', name: 'Digital Fingertip Pulse Oximeter', rel: 'Safety Items/Contec CMS50D Pulse Oximeter Fingertip Device with Product Box.jpg' },
  { sku: 'OB-COV-15', name: 'Savlon Surface Disinfectant Spray', rel: 'Hit and Disinfectant Spray/Savlon Surface Disinfectant Spray Fresh 170 g Front And Back View.jpeg' },
  { sku: 'OB-COV-16', name: 'Good Knight Mosquito Vaporizer Machine', rel: 'Hit and Disinfectant Spray/Good Knight Gold Flash Liquid Vapouriser Machine And Refill 45 ml Box Front And Side View.JPG' },
  { sku: 'OB-COV-17', name: 'Mosquito Repellent Liquid Machine', rel: 'Hit and Disinfectant Spray/All Out Ultra Mosquito Liquid Vaporiser Kit Machine And Refill 45 ml With Box.jpg' },
  { sku: 'OB-COV-23', name: 'Industrial Safety Helmet', rel: 'Safety Items/Rowdel Yellow Industrial Safety Helmet Hard Hat Side View.jpg' },
  { sku: 'OB-COV-30', name: 'Manual Pressure Sanitizer Sprayer 2 Litre', rel: 'Sprayer Pump/KD Pumps 2 Liter Pressure Sprayer Yellow and Red Pair.JPG' },
  { sku: 'OB-COV-31', name: 'Garden Sanitizer Pressure Sprayer 5 Litre', rel: 'Sprayer Pump/Dap Pressure Sprayer 5L Orange Bottle with Lance and Packaging Box.jpg' },
  { sku: 'OB-COV-32', name: 'Backpack Knapsack Sanitizer Sprayer 18 Litre', rel: 'Sprayer Pump/Neptune Knapsack Sprayer Yellow Tank with Wand and Nozzle.jpg' },
  { sku: 'OB-HOU-1010', name: 'White Banian Cloth', rel: 'Cloth/White Hand Towel 14x21.jpg' },
  { sku: 'OB-HOU-1016', name: 'Checked Cloth', rel: 'Cloth/Kitchen Check Towel Stack.jpg' },
  { sku: 'OB-HOU-1022', name: 'Stainess Steel Hand Soap Dispenser', rel: 'Dispenser/Stainless Steel Push Button Soap Dispenser 500ml Wall Mount View.jpg' },
  { sku: 'OB-HOU-1025', name: 'Air Freshener Dispenser LED', rel: 'Dispenser/Automatic Aerosol LED Dispenser LED 250.jpg' },
  { sku: 'OB-TIS-1100', name: 'KIMSOFT Smile C Fold Towels 180 Towels 30 Sleeves 031500', rel: 'Tissue Product/Kimsoft Smile C-Fold Towels 31500 180 Sheets Pack and Stack.jpg' },
  { sku: 'OB-STA-1007', name: 'F/S Expanding File', rel: 'Folders/EXPANDING BUTTON FOLDER.jpeg' },
  { sku: 'OB-DES-56', name: 'Cello Tape Dispenser Desktop Medium', rel: 'Stationery/JB9 Cello Tape Dispenser Black with Packaging Box.jpg' },
  { sku: 'OB-DES-57', name: 'Mesh Metal Pen Stand Cup Black', rel: 'Stationery/Black Mesh Wire Pen Pencil Holder Stand with Pens.jpg' },
  { sku: 'OB-DES-58', name: 'Stainless Steel Scissors 7 Inch', rel: 'Stationery/JB9 Stainless Steel Scissor 7 Inch 180mm JB9-070 with 12 Pcs Box.jpg' },
  { sku: 'OB-NOT-65', name: 'Color Plastic Paper Clips Pack', rel: 'Stationery/JB9 Paper Clips Assorted Colour 28mm 100 Pcs Box with Clips.jpg' },
  { sku: 'OB-NOT-72', name: 'Elastic Rubber Bands Multi-Color 100g', rel: 'Stationery/JB9 Pure Nylon Rubber Band Multi Color 500gm Pouch JB9-135.jpg' },
  { sku: 'OB-NOT-73', name: 'Push Pins for Notice Board Assorted', rel: 'Stationery/JB9 Bright Electro Nickel Plated T-Pins 3N Single Box.jpg' },
  { sku: 'OB-PAC-1056', name: 'Packing Patti Roll', rel: 'Packing Product/Blue Box Strapping Band Roll Shrink Wrapped Close-up.jpg' },
  { sku: 'OB-PAC-21', name: 'Box Strapping Sealer Tool', rel: 'Packing Product/Heavy Duty Box Strapping Sealer Plier Tool Red Handles Angular Jaws View.jpg' },
  { sku: 'OB-PAC-22', name: 'Box Strapping Tensioner Tool', rel: 'Packing Product/Manual Box Strapping Tensioner Tool Red and Black Side View.jpg' },
  { sku: 'OB-PAC-23', name: 'Metal Strapping Clips Seals', rel: 'Packing Product/Metal Box Strapping Clips Seals Group of 4 Pieces.jpg' },
  { sku: 'OB-PAC-25', name: 'PP Sutli Twine Roll', rel: 'Packing Product/Zen PP Twine Sutli Roll Green Color Mesh Packaging.jpg' },
  { sku: 'OB-HOU-08', name: 'Rechargeable Mosquito Swatter Bat', rel: 'Hit and Disinfectant Spray/Wonder Killex Rechargeable Mosquito Swatter Racket Red Full View.jpg' },
  { sku: 'OB-HOU-1024', name: 'Electronic Fly Insect Killer Machine', rel: 'Hit and Disinfectant Spray/Lazzo Insect Killer Machine Blue UV Light On Front View.jpg' }
];

console.log('Checking existence of candidate images in Office Bazzar New Images...');
const baseDir = path.join(process.cwd(), 'Office Bazzar New Images');
let okCount = 0;
for (const c of candidates) {
  const p = path.join(baseDir, c.rel);
  const exists = fs.existsSync(p);
  console.log(`${exists ? 'OK' : 'FAIL'} | ${c.sku.padEnd(12)} | ${c.name.slice(0, 30).padEnd(30)} -> ${c.rel}`);
  if (exists) okCount++;
}
console.log(`\nVerified ${okCount} / ${candidates.length} candidate files exist in Office Bazzar New Images!`);
