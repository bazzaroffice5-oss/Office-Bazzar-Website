const fs = require('fs');
const path = require('path');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const rawStart = cat.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = cat.indexOf('export const INITIAL_PRODUCTS: Product[] =');
const rawStr = cat.slice(rawStart, rawEnd);

const blocks = rawStr.split(/\n\s*\{\s*\n\s*"id":/);
const mapped = [];

for (let i = 1; i < blocks.length; i++) {
  const b = '{\n    "id":' + blocks[i];
  const idM = b.match(/"id":\s*"([^"]+)"/);
  const skuM = b.match(/"sku":\s*"([^"]+)"/);
  const nameM = b.match(/"name":\s*"([^"]+)"/);
  const catM = b.match(/"categoryName":\s*"([^"]+)"/) || b.match(/"categoryId":\s*"([^"]+)"/);
  const subM = b.match(/"subcategoryName":\s*"([^"]+)"/) || b.match(/"subcategoryId":\s*"([^"]+)"/);
  const imgM = b.match(/"images":\s*\[([\s\S]*?)\]/);

  let images = [];
  if (imgM) {
    const lines = imgM[1].split('\n');
    lines.forEach(l => {
      const im = l.match(/"([^"]+)"/);
      if (im) images.push(im[1]);
    });
  }

  if (images.length > 0 && !images[0].includes('placeholder-product.svg')) {
    mapped.push({
      sku: skuM ? skuM[1] : '',
      name: nameM ? nameM[1] : '',
      category: catM ? catM[1] : '',
      subcategory: subM ? subM[1] : '',
      images
    });
  }
}

console.log('Total mapped products to audit:', mapped.length);

// Check if all image files exist on disk
let missing = 0;
for (const p of mapped) {
  for (const img of p.images) {
    const diskPath = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
    if (!fs.existsSync(diskPath)) {
      console.error(`MISSING ASSET ON DISK: ${p.sku} (${p.name}) -> ${img}`);
      missing++;
    }
  }
}
console.log('Missing assets on disk:', missing);

// Check if any product has an image that doesn't match its category
const categoryAnomalies = [];
for (const p of mapped) {
  const catLower = p.category.toLowerCase();
  const nameLower = p.name.toLowerCase();
  
  // E.g. A product with "file" in stationery having a dustbin image
  // Let's inspect
}

fs.writeFileSync('scripts/all_251_mapped_audit.json', JSON.stringify(mapped, null, 2));
console.log('Saved scripts/all_251_mapped_audit.json');

