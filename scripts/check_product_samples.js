const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function checkSample() {
  const dir = 'public/assets/product/cleaning-brush';
  if (!fs.existsSync(dir)) {
    console.log('Dir does not exist:', dir);
    return;
  }
  const files = fs.readdirSync(dir).slice(0, 5);
  for (const f of files) {
    const full = path.join(dir, f);
    const meta = await sharp(full).metadata();
    console.log(f, meta.width, meta.height, meta.format, meta.hasAlpha);
  }
}
checkSample();

