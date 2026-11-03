const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const files = [
  'Safety Items/Red Orange Traffic Cone with White Reflective Collar Band 750mm.JPG',
  'Safety Items/Rubber Base Traffic Cone RBTC 750mm Height 2kg Red Standing View.jpeg',
  'Safety Items/Red and White Plastic Safety Warning Barrier Chain Coil.jpg',
  'Safety Items/Queue Manager Stainless Steel Retractable Belt Barrier Stanchions Pair with Red Belt.JPG',
  'Stationery/Light Blue Paper Envelopes Bundle with Brown Paper Band.jpg',
  'Room Spray/Godrej aer matic Automatic Spray Dispensers Cool Surf Blue Violet Bloom Petal Crush Pink with Boxes Trio.jpg',
  'Room Spray/Godrej aer matic Violet Valley Bloom Automatic Dispenser Refill Can and Box Set.jpg'
];

async function check() {
  for (const f of files) {
    const fullPath = path.join('Office Bazzar New Images', f);
    if (!fs.existsSync(fullPath)) {
      console.log(`MISSING: ${fullPath}`);
      continue;
    }
    const meta = await sharp(fullPath).metadata();
    console.log(`OK: ${f} | ${meta.width}x${meta.height} | format: ${meta.format}`);
  }
}

check();
