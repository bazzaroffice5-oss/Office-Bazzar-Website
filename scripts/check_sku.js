const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const idx = cat.indexOf('"sku": "OB-GAR-1031"');
console.log(cat.substring(idx, idx + 600));
