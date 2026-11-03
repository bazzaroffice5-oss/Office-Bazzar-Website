const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');

async function scan() {
  console.log('Scanning folder:', SOURCE_DIR);
  const files = [];

  function walk(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else {
        files.push({
          full,
          rel: path.relative(SOURCE_DIR, full),
          name: item,
          ext: path.extname(item).toLowerCase(),
          size: st.size
        });
      }
    }
  }

  walk(SOURCE_DIR);
  console.log(`Total files found: ${files.length}`);

  const imageExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const inventory = [];
  const hashGroups = {};
  let corruptCount = 0;
  let nonImageCount = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const isImageExt = imageExts.includes(f.ext);

    if (!isImageExt) {
      nonImageCount++;
      inventory.push({
        ...f,
        isImage: false,
        status: 'NON_IMAGE_ASSET',
        width: 0,
        height: 0,
        sha256: null
      });
      continue;
    }

    if (f.size === 0) {
      corruptCount++;
      inventory.push({
        ...f,
        isImage: false,
        status: 'CORRUPTED_ZERO_BYTE',
        width: 0,
        height: 0,
        sha256: null
      });
      continue;
    }

    try {
      const buf = fs.readFileSync(f.full);
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      const meta = await sharp(buf).metadata();

      if (!hashGroups[hash]) hashGroups[hash] = [];
      hashGroups[hash].push(f.rel);

      inventory.push({
        ...f,
        isImage: true,
        status: 'VALID_IMAGE',
        width: meta.width,
        height: meta.height,
        format: meta.format,
        channels: meta.channels,
        sha256: hash
      });
    } catch (err) {
      corruptCount++;
      inventory.push({
        ...f,
        isImage: false,
        status: 'CORRUPTED_CANNOT_DECODE',
        error: err.message,
        width: 0,
        height: 0,
        sha256: null
      });
    }

    if ((i + 1) % 500 === 0 || i === files.length - 1) {
      console.log(`Processed ${i + 1} / ${files.length} files...`);
    }
  }

  const validImages = inventory.filter(x => x.isImage);
  const duplicates = Object.entries(hashGroups).filter(([h, group]) => group.length > 1);

  console.log('\n--- SCAN RESULTS ---');
  console.log(`Total files: ${files.length}`);
  console.log(`Valid images: ${validImages.length}`);
  console.log(`Corrupted/0-byte: ${corruptCount}`);
  console.log(`Non-image files: ${nonImageCount}`);
  console.log(`Unique SHA256 hashes: ${Object.keys(hashGroups).length}`);
  console.log(`Duplicate hash groups: ${duplicates.length}`);

  fs.writeFileSync('scripts/office_bazzar_new_images_inventory.json', JSON.stringify(inventory, null, 2));
  fs.writeFileSync('scripts/office_bazzar_new_images_duplicates.json', JSON.stringify(duplicates, null, 2));
  console.log('Saved inventory to scripts/office_bazzar_new_images_inventory.json');
}

scan().catch(console.error);
