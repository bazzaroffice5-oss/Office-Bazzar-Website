const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function inspectKeyBoard() {
  const full = path.join(process.cwd(), 'Office Bazzar New Images', 'Stationery', 'Key Board.jpeg');
  if (fs.existsSync(full)) {
    const meta = await sharp(full).metadata();
    console.log(`Key Board.jpeg: ${meta.width}x${meta.height}, ${meta.format}, size: ${(fs.statSync(full).size / 1024).toFixed(1)} KB`);
  } else {
    console.log('Not found');
  }
}

inspectKeyBoard();

