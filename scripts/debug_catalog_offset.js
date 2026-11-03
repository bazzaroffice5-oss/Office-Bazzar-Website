const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const rawStart = cat.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = cat.indexOf('export const INITIAL_PRODUCTS: Product[] =');
const rawStr = cat.slice(rawStart, rawEnd);

const blocks = rawStr.split(/\n\s*\{\s*\n\s*"id":/);

for (let i = 1; i <= 20; i++) {
  const b = '{\n    "id":' + blocks[i];
  const skuM = b.match(/"sku":\s*"([^"]+)"/);
  const nameM = b.match(/"name":\s*"([^"]+)"/);
  const slugM = b.match(/"slug":\s*"([^"]+)"/);
  const imgM = b.match(/"images":\s*\[([\s\S]*?)\]/);

  const images = [];
  if (imgM) {
    const lines = imgM[1].split('\n');
    lines.forEach(l => {
      const im = l.match(/"([^"]+)"/);
      if (im) images.push(im[1]);
    });
  }

  console.log(`${i}. SKU: ${skuM ? skuM[1] : ''} | Name: ${nameM ? nameM[1] : ''} | Slug: ${slugM ? slugM[1] : ''}`);
  console.log(`   Images: ${JSON.stringify(images)}`);
}
