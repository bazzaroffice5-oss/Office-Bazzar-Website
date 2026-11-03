const fs = require('fs');

const catSlugPage = fs.readFileSync('src/app/category/[slug]/page.tsx', 'utf8');
console.log('--- category/[slug]/page.tsx ---');
console.log(catSlugPage.slice(0, 700));

