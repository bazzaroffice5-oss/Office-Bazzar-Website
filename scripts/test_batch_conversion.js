const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function testBatch() {
  const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));
  const testSample = allFiles.slice(0, 10);

  const t0 = Date.now();
  for (const f of testSample) {
    const ext = path.extname(f.filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext) || f.size === 0) continue;

    const folderSlug = slugify(f.folder);
    const fileSlug = slugify(path.parse(f.filename).name);
    const dest = path.join('public/assets/supplier-library', folderSlug, `${fileSlug}.webp`);

    await sharp(f.fullPath)
      .resize({
        width: 1200,
        height: 1200,
        fit: 'contain',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: 80 })
      .toFile(dest);

    const outSize = fs.statSync(dest).size;
    console.log(`[${f.folder}] ${f.filename} (${Math.round(f.size/1024)} KB) -> ${fileSlug}.webp (${Math.round(outSize/1024)} KB)`);
  }
  console.log(`Test 10 files took ${Date.now() - t0}ms`);
}

testBatch().catch(console.error);

