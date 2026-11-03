const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootFiles = [
  'Milton Small Water Bottle 450  .jpeg',
  'Stainless Water Bottle.jpeg',
  'water bottle .jpeg',
  'watter bottle normal .jpeg',
  'parry sugar .jpeg'
];

async function check() {
  for (const f of rootFiles) {
    const full = path.join(process.cwd(), 'Office Bazzar New Images', f);
    if (fs.existsSync(full)) {
      const meta = await sharp(full).metadata();
      console.log(`${f.padEnd(35)}: ${meta.width}x${meta.height}, ${meta.format}, size: ${(fs.statSync(full).size / 1024).toFixed(1)} KB`);
    }
  }
}

check();

