const https = require('https');

const tests = [
  { name: 'Supplier Gallery Page', path: '/supplier-gallery' },
  { name: 'Product Listing', path: '/products' },
  { name: 'Supplier Asset 1', path: '/assets/supplier-library/brooms-and-sticks/aluminium-stick-5-feet-1.webp' },
  { name: 'Supplier Asset 2', path: '/assets/supplier-library/stationery/itc-long-note-160-pages-hard.webp' },
  { name: 'Supplier Asset 3', path: '/assets/supplier-library/mix/gobbler-shredder-machine-gs904-cd.webp' }
];

async function check(t) {
  return new Promise((resolve) => {
    https.get('https://officebazzar.com' + t.path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[${t.name}] ${t.path} -> Status: ${res.statusCode} | Content-Length: ${data.length} | x-vercel-cache: ${res.headers['x-vercel-cache']}`);
        resolve();
      });
    }).on('error', (err) => {
      console.error(`Error on ${t.path}:`, err.message);
      resolve();
    });
  });
}

(async () => {
  for (const t of tests) {
    await check(t);
  }
})();

