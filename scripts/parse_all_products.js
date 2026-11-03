const fs = require('fs');

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
  const catM = b.match(/"categoryName":\s*"([^"]+)"/);
  const imgM = b.match(/"images":\s*\[([\s\S]*?)\]/);

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
    category: catM ? catM[1] : '',
    images
  });
}

const unmapped = prods.filter(p => p.images.length === 0 || p.images[0].includes('placeholder'));
console.log(`Total unmapped products: ${unmapped.length}`);

unmapped.forEach((p, idx) => {
  console.log(`${(idx + 1).toString().padStart(3, ' ')}. [${p.sku}] (${p.category}) ${p.name}`);
});

fs.writeFileSync('scripts/current_unmapped_164.json', JSON.stringify(unmapped, null, 2));
