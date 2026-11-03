const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const files = [
  'Stationery/Magnetic Folder A4 .jpeg',
  'Stationery/JB9 Cello Tape Dispenser Black with Packaging Box.jpg',
  'Stationery/Premium Quality Cloth Line Envelope 12x10 Inch 100 Nos Pack.jpg',
  'Stationery/Magazine Brochure Display Stand Rack Models 1271 1272 1318 1328 Chart.jpg',
  'Stationery/faber-castell-highlighter-marker-500x500.jpeg',
  'Stationery/Floor Masking Tape 2 inch 25 mtr.jpeg'
];

async function check() {
  for (const f of files) {
    const full = path.join('Office Bazzar New Images', f);
    if (!fs.existsSync(full)) {
      console.log('MISSING:', full);
    } else {
      const meta = await sharp(full).metadata();
      console.log(`OK: ${f} | ${meta.width}x${meta.height} | format: ${meta.format}`);
    }
  }
}

check();

