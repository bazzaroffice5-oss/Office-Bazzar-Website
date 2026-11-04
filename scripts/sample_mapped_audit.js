const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const rawStart = cat.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = cat.indexOf('export const INITIAL_PRODUCTS: Product[] =');
const rawStr = cat.slice(rawStart, rawEnd);

const blocks = rawStr.split(/\n\s*\{\s*\n\s*"id":/);
const products = [];

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

  products.push({
    sku: skuM ? skuM[1] : '',
    name: nameM ? nameM[1] : '',
    category: catM ? catM[1] : '',
    subcategory: subM ? subM[1] : '',
    image: images.length > 0 ? images[0] : null
  });
}

console.log('Sample of 30 mapped products across categories:');
const mapped = products.filter(p => p.image && !p.image.includes('placeholder-product.svg'));
for (let i = 0; i < mapped.length; i += 8) {
  const p = mapped[i];
  console.log(`[${p.sku}] ${p.name} (${p.category} / ${p.subcategory}) -> ${p.image}`);
}

