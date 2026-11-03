const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const rawProductsStr = cat.substring(cat.indexOf('const RAW_PRODUCTS: Product[] = ['), cat.indexOf('export const INITIAL_PRODUCTS: Product[] ='));

// Extract each product block
const productBlocks = rawProductsStr.split(/\{\s*"id":\s*"/).slice(1);

const products = productBlocks.map(block => {
  const getField = (f) => {
    const m = block.match(new RegExp(`"${f}":\\s*"([^"]+)"`));
    return m ? m[1] : '';
  };
  const sku = getField('sku');
  const name = getField('name');
  const id = block.match(/^([^"]+)"/)?.[1] || '';
  const imgMatch = block.match(/"images":\s*\[([\s\S]*?)\]/);
  const images = imgMatch ? [...imgMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]) : [];
  return { id, sku, name, images };
});

const placeholders = products.filter(p => p.images.some(img => img.includes('placeholder-product.svg')));
const mapped = products.filter(p => !p.images.some(img => img.includes('placeholder-product.svg')));

console.log('Total catalog products:', products.length);
console.log('Total with supplier photos:', mapped.length);
console.log('Total currently with placeholder:', placeholders.length);

console.log('\n--- Sample of currently unmapped products (first 30) ---');
placeholders.slice(0, 30).forEach((p, idx) => {
  console.log(`${(idx + 1).toString().padStart(3, ' ')}. [${p.sku}] ${p.name}`);
});
