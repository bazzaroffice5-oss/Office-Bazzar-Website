const fs = require('fs');

const file1 = fs.readFileSync('src/components/home/TrendingCategoriesSection.tsx', 'utf8');
console.log('--- TrendingCategoriesSection.tsx ---');
console.log(file1.slice(0, 600));

const file2 = fs.readFileSync('src/components/category/CategoryLandingClient.tsx', 'utf8');
console.log('--- CategoryLandingClient.tsx ---');
console.log(file2.slice(0, 600));
