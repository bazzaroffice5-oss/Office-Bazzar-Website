const fs = require('fs');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = content.indexOf('const RAW_PRODUCTS: any[] = [');
const endIdx = content.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const rawText = content.substring(startIdx + 'const RAW_PRODUCTS: any[] = '.length, endIdx).trim().replace(/;\s*$/, '');
const products = eval(rawText);

function formatProductSeoTitle(product) {
  const brand = 'Office Bazzar';
  const sku = (product.sku || '').trim();
  let name = (product.name || '').trim();

  // Strip existing brand suffixes if any
  name = name
    .replace(/\s*[|–-]\s*Office\s*Bazzar(\s+India)?\s*$/i, '')
    .trim();

  // Ideal format: Name (SKU) | Office Bazzar
  const suffix = sku ? ` (${sku}) | ${brand}` : ` | ${brand}`;
  const maxTitleLen = 65;
  const maxNameLen = maxTitleLen - suffix.length;

  if (name.length > maxNameLen && maxNameLen > 15) {
    // Truncate name safely at word boundary
    const sliced = name.slice(0, maxNameLen);
    const lastSpace = sliced.lastIndexOf(' ');
    if (lastSpace > 10) {
      name = sliced.slice(0, lastSpace).trim();
    } else {
      name = sliced.trim();
    }
  }

  return `${name}${suffix}`;
}

const titles = new Map();
let overLenCount = 0;
let maxLen = 0;

for (const p of products) {
  const t = formatProductSeoTitle(p);
  if (t.length > 65) overLenCount++;
  if (t.length > maxLen) maxLen = t.length;
  if (!titles.has(t)) {
    titles.set(t, []);
  }
  titles.get(t).push(p.sku);
}

const duplicates = Array.from(titles.entries()).filter(([t, skus]) => skus.length > 1);

console.log('Total products tested:', products.length);
console.log('Total unique titles generated:', titles.size);
console.log('Duplicates count:', duplicates.length);
console.log('Titles > 65 chars:', overLenCount);
console.log('Max title length:', maxLen);

if (duplicates.length > 0) {
  console.log('Duplicate examples:', duplicates.slice(0, 5));
} else {
  console.log('SUCCESS: 100% of product titles are completely UNIQUE!');
}

console.log('\nSample titles:');
Array.from(titles.keys()).slice(0, 10).forEach(t => console.log('  [' + t.length + ' chars] ' + t));
