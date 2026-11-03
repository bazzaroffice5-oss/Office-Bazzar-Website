const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function checkAshCan() {
  const full = path.join(process.cwd(), 'Office Bazzar New Images', 'Dustbin', 'Stainless Steel Ash Can Dustbin With Side Opening Pair.jpg');
  if (fs.existsSync(full)) {
    const meta = await sharp(full).metadata();
    console.log(`Ash Can Dustbin: ${meta.width}x${meta.height}, size: ${(fs.statSync(full).size / 1024).toFixed(1)} KB`);
  } else {
    console.log('Not found');
  }
}

checkAshCan();
