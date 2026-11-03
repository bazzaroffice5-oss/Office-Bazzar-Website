const fs = require('fs');

const products = JSON.parse(fs.readFileSync('catalog_products_dump.json', 'utf8'));

const imagePrefixes = {};
let noImageCount = 0;
let multipleImageCount = 0;

products.forEach(p => {
  if (!p.images || p.images.length === 0) {
    noImageCount++;
  } else {
    if (p.images.length > 1) multipleImageCount++;
    p.images.forEach(img => {
      let prefix = 'unknown';
      if (img.startsWith('http')) prefix = 'http (remote)';
      else if (img.startsWith('/uploads/products/')) prefix = '/uploads/products/';
      else if (img.startsWith('/uploads/')) prefix = '/uploads/other';
      else if (img.startsWith('/images/')) prefix = '/images/';
      else prefix = img.split('/')[1] || 'root';
      imagePrefixes[prefix] = (imagePrefixes[prefix] || 0) + 1;
    });
  }
});

console.log('No image count:', noImageCount);
console.log('Multiple image count:', multipleImageCount);
console.log('Image prefixes:', imagePrefixes);
console.log('\nSample 5 products:');
products.slice(0, 5).forEach(p => {
  console.log(p.sku, '|', p.name, '|', p.brandName, '|', p.images);
});

