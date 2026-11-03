const fs = require('fs');
const placeholders = JSON.parse(fs.readFileSync('scripts/placeholders_178.json', 'utf8'));

function printCategory(catName) {
  const prods = placeholders.filter(p => p.categoryId === catName);
  console.log(`\n========================================`);
  console.log(`CATEGORY: ${catName} (${prods.length} products)`);
  console.log(`========================================`);
  prods.forEach(p => {
    console.log(`${p.sku.padEnd(14)} | ${p.brand.padEnd(16)} | ${p.name}`);
  });
}

printCategory('housekeeping-hygiene');
printCategory('packaging-supplies');
printCategory('printers-technology');
printCategory('office-stationery');
