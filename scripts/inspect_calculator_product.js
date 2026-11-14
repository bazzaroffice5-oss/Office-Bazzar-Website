const fs = require('fs');

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const slug = 'ob-not-73-casio-electronic-desk-calculator';
const searchPattern = `"slug": "${slug}"`;
const slugIndex = catalogContent.indexOf(searchPattern);

if (slugIndex !== -1) {
  const startObj = catalogContent.lastIndexOf('{', slugIndex);
  let braceCount = 0;
  let endObj = -1;
  for (let i = startObj; i < catalogContent.length; i++) {
    if (catalogContent[i] === '{') braceCount++;
    else if (catalogContent[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endObj = i + 1;
        break;
      }
    }
  }
  const productStr = catalogContent.substring(startObj, endObj);
  const prod = JSON.parse(productStr);
  console.log('Product Name:', prod.name);
  console.log('SKU:', prod.sku);
  console.log('ID:', prod.id);
  console.log('Images:', prod.images);
} else {
  console.log('Not found by slug in catalog.ts');
  // Search partial
  const idx = catalogContent.indexOf('casio-electronic-desk-calculator');
  console.log('Partial search index:', idx);
}

