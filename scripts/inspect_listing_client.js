const fs = require('fs');

const client = fs.readFileSync('src/components/product/ProductListingClient.tsx', 'utf8');
console.log('--- ProductListingClient.tsx ---');
console.log(client.slice(0, 1000));

