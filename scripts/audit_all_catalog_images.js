const fs = require('fs');
const path = require('path');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const rawStart = cat.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = cat.indexOf('export const INITIAL_PRODUCTS: Product[] =');
const rawStr = cat.slice(rawStart, rawEnd);

const prods = [];
const blocks = rawStr.split(/\n\s*\{\s*\n\s*"id":/);

for (let i = 1; i < blocks.length; i++) {
  const b = '{\n    "id":' + blocks[i];
  const idM = b.match(/"id":\s*"([^"]+)"/);
  const skuM = b.match(/"sku":\s*"([^"]+)"/);
  const nameM = b.match(/"name":\s*"([^"]+)"/);
  const imgM = b.match(/"images":\s*\[([\s\S]*?)\]/);
  const activeM = b.match(/"isActive":\s*(\w+)/);

  const images = [];
  if (imgM) {
    const lines = imgM[1].split('\n');
    lines.forEach(l => {
      const im = l.match(/"([^"]+)"/);
      if (im) images.push(im[1]);
    });
  }

  prods.push({
    id: idM ? idM[1] : '',
    sku: skuM ? skuM[1] : '',
    name: nameM ? nameM[1] : '',
    isActive: activeM ? activeM[1] === 'true' : true,
    images
  });
}

console.log('Total products in catalog.ts:', prods.length);

const missingFiles = [];
const zeroByteFiles = [];
const validFiles = [];

prods.forEach(p => {
  p.images.forEach(img => {
    if (img.startsWith('/assets/products/catalog_2026/')) {
      const diskPath = path.join(process.cwd(), 'public', img);
      if (!fs.existsSync(diskPath)) {
        missingFiles.push({ sku: p.sku, name: p.name, img, diskPath });
      } else {
        const stats = fs.statSync(diskPath);
        if (stats.size === 0) {
          zeroByteFiles.push({ sku: p.sku, name: p.name, img, size: stats.size });
        } else {
          validFiles.push({ sku: p.sku, img, size: stats.size });
        }
      }
    }
  });
});

console.log('Total catalog_2026 image references:', validFiles.length + missingFiles.length + zeroByteFiles.length);
console.log('Valid files on disk:', validFiles.length);
console.log('Missing files on disk:', missingFiles.length);
console.log('Zero byte files:', zeroByteFiles.length);

if (missingFiles.length > 0) {
  console.log('\nMISSING FILES SAMPLE:');
  missingFiles.slice(0, 10).forEach(m => console.log(`   [${m.sku}] ${m.img}`));
}

