const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'Office Bazzar New Images');

const newMatches = [
  { sku: 'OB-HOU-1023', name: 'ABS Hand Dryer Machine', rel: 'Hygenic Tools and Trolly/Automatic Hand Dryer 1800W ABS White On Black Packaging Box.jpg', alts: ['Hygenic Tools and Trolly/Automatic Hand Dryer 1500W ABS White Specifications Infographic.jpg'] },
  { sku: 'OB-COV-14', name: 'Lifebuoy Germ Protection Liquid Hand Wash', rel: 'Mix/Chemical Product/Lifebuoy Germ Protection Total Pro Plus Handwash 5 Litre Can Front View.jpg', alts: ['Mix/Chemical Product/Lifebuoy Germ Protection Total Pro Plus Handwash 5 Litre Cans Pair Front and Back.jpg'] },
  { sku: 'OB-CLE-1091', name: 'Vim Liquid Dish Wash', rel: 'Mix/Chemical Product/Vim Dishwash Liquid Lemon 500ml Bottle Front and Back.jpg', alts: ['Mix/Chemical Product/Vim Dishwash Liquid Lemon 250ml Bottle Front and Back.jpg'] },
  { sku: 'OB-052', name: 'Vim Dishwash Gel (250ml / 500ml / 1.8 Ltr)', rel: 'Mix/Chemical Product/Vim Dishwash Liquid Lemon Concentrated Gel 1.8 Litre Handle Bottle Front and Back Variant 2.jpg', alts: [] },
  { sku: 'OB-CLE-1095', name: 'Hi Clean Liquid Soap Oil', rel: 'Mix/Chemical Product/Hi-Clean Liquid Soap Apple Rose Lemon 1000ml Bottles Set of 3.jpg', alts: ['Mix/Chemical Product/Hi-Clean Liquid Soap Green Apple Germs Killer 1000ml Bottle Front and Back.jpg'] },
  { sku: 'OB-047', name: 'Scrub Pad with Sponge', rel: 'Collage/Scotch-Brite Scrub Sponge Pad.jpg', alts: [] },
  { sku: 'OB-063', name: 'Dust Pan with Brush Set', rel: 'Bucket-Mug-Tray/Dustpan With Brush (10).jpg', alts: ['Bucket-Mug-Tray/Dustpan With Brush (11).jpg'] },
  { sku: 'OB-081', name: 'Cob Web Brush Curved', rel: 'Cleaning Brush/Cobweb Brush.jpg', alts: ['Cleaning Brush/Cobweb Brush (2).jpg'] },
  { sku: 'OB-121', name: 'Hi-Clean Perfumed Phenyl (Multicolor)', rel: 'Mix/Chemical Product/Hi-Clean Herbal Perfumed Phenyle Assorted Fragrances 1 Litre Bottles Row of 5.jpg', alts: [] },
  { sku: 'OB-135', name: 'Pure White Naphthalene Balls', rel: 'Hit and Disinfectant Spray/Naphthalene Balls White Grid Array On Fabric.JPG', alts: [] },
  { sku: 'OB-145', name: 'Bio Medical Waste Segregation Dustbins Set', rel: 'Dustbin/Kyracs Stepbin Bio-Medical Waste Pedal Dustbin 4 Sizes Multicolor.JPG', alts: [] },
  { sku: 'OB-146', name: 'Duo Wet & Dry Plastic Dustbin', rel: 'Dustbin/Aristo Twin Pedal Dustbin Wet And Dry Waste Green And Blue.jpg', alts: [] },
  { sku: 'OB-013', name: 'ABS Soap Dispenser Single Clear', rel: 'Dispenser/Clear Wall Mount Soap Dispenser Push Button.jpg', alts: [] },
  { sku: 'OB-018', name: 'Touch Free Soap Dispenser', rel: 'Dispenser/Touch Soap Dispenser Wall Mount Silver With Box.jpg', alts: [] },
  { sku: 'OB-020', name: 'ABS Tissue Dispenser M-Fold', rel: 'Dispenser/M Fold Paper Towel Dispenser White With Tissue.jpg', alts: [] },
  { sku: 'OB-COV-27', name: 'Reflective Safety Traffic Cone', rel: 'Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm Wholesaler Bazzar Display.JPG', alts: [] }
];

console.log('Verifying 16 high-confidence additions...');
let okCount = 0;
for (const m of newMatches) {
  const p = path.join(srcDir, m.rel);
  const exists = fs.existsSync(p);
  console.log(`${exists ? 'OK' : 'FAIL'} | ${m.sku.padEnd(14)} | ${m.name.slice(0, 30).padEnd(30)} -> ${m.rel}`);
  if (exists) okCount++;
  for (const a of m.alts) {
    const aPath = path.join(srcDir, a);
    if (!fs.existsSync(aPath)) console.log(`   FAIL ALT: ${a}`);
  }
}
console.log(`Verified ${okCount} / ${newMatches.length} primary images exist in Office Bazzar New Images!`);

