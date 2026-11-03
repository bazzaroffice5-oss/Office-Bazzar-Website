const fs = require('fs');

const catPage = fs.readFileSync('src/app/products/page.tsx', 'utf8');
console.log('--- src/app/products/page.tsx ---');
console.log(catPage.slice(0, 500));

