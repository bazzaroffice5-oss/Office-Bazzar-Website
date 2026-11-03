const fs = require('fs');
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const rStart = content.indexOf('const RAW_PRODUCTS');
console.log('rStart:', rStart);
console.log(content.slice(rStart, rStart + 200));
