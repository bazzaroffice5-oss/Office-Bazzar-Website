const fs = require('fs');

const results = JSON.parse(fs.readFileSync('full_catalog_matching.json', 'utf8'));
const unmatched = results.filter(r => !r.hasMatch);

const catCounts = {};
unmatched.forEach(u => {
  catCounts[u.category] = (catCounts[u.category] || 0) + 1;
});

console.log('Unmatched by category:');
console.table(catCounts);

console.log('\nSample 30 unmatched products:');
unmatched.slice(0, 30).forEach(u => {
  console.log(`[${u.sku}] ${u.name} | ${u.brand} | Cat: ${u.category} | Old: ${u.oldImage}`);
});

