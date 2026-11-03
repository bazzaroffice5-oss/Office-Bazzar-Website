const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('catalog_products_dump.json', 'utf8'));
const priTech = catalog.filter(p => p.categoryName === 'Printers & Technology');

console.log(`Printers & Technology products (${priTech.length}):`);
priTech.forEach(p => {
  console.log(`[${p.sku}] ${p.name} (${p.brandName}) | Old: ${p.images[0]}`);
});

