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
  const slugM = b.match(/"slug":\s*"([^"]+)"/);
  const catM = b.match(/"categoryId":\s*"([^"]+)"/);
  const subM = b.match(/"subcategoryId":\s*"([^"]+)"/);
  const brandM = b.match(/"brand":\s*"([^"]+)"/);
  const priceM = b.match(/"price":\s*([0-9.]+)/);
  const activeM = b.match(/"isActive":\s*(\w+)/);
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
    slug: slugM ? slugM[1] : '',
    categoryId: catM ? catM[1] : '',
    subcategoryId: subM ? subM[1] : '',
    brand: brandM ? brandM[1] : '',
    price: priceM ? parseFloat(priceM[1]) : 0,
    isActive: activeM ? activeM[1] === 'true' : true,
    images
  });
}

const active = prods.filter(p => p.isActive);
const placeholder = active.filter(p => p.images.length === 0 || p.images[0].includes('placeholder-product.svg'));
const mapped = active.filter(p => p.images.length > 0 && !p.images[0].includes('placeholder-product.svg'));

console.log('Total Products:', prods.length);
console.log('Active Products:', active.length);
console.log('Supplier Mapped Products:', mapped.length);
console.log('Placeholder Products:', placeholder.length);

// Check if OB-HOU-1018 and OB-TIS-1096 exist and their status
const hou = prods.find(p => p.sku === 'OB-HOU-1018');
const tis = prods.find(p => p.sku === 'OB-TIS-1096');
console.log('OB-HOU-1018 status:', hou ? { sku: hou.sku, name: hou.name, active: hou.isActive, image: hou.images[0] } : 'NOT FOUND');
console.log('OB-TIS-1096 status:', tis ? { sku: tis.sku, name: tis.name, active: tis.isActive, image: tis.images[0] } : 'NOT FOUND');

// Write out JSON files for analysis
fs.writeFileSync('scripts/mapped_products_audit.json', JSON.stringify(mapped, null, 2));
fs.writeFileSync('scripts/placeholder_products_audit.json', JSON.stringify(placeholder, null, 2));
