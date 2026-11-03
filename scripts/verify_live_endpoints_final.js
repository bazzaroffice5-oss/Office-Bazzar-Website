const https = require('https');

const endpoints = [
  '/products',
  '/category/office-stationery',
  '/category/housekeeping-hygiene',
  '/category/printers-technology',
  '/category/packaging-supplies',
  '/product/tissue-paper-napkin-1',
  '/product/kangaro-staplers-hd-10d-1',
  '/assets/products/catalog_2026/OB-TIS-1096.webp',
  '/assets/products/catalog_2026/OB-STA-1005.webp',
  '/assets/products/catalog_2026/OB-PAC-1057.webp',
  '/assets/products/catalog_2026/OB-NOT-79.webp',
  '/assets/products/catalog_2026/OB-BOA-1048.webp'
];

function check(url) {
  return new Promise((resolve) => {
    https.get(`https://officebazzar.com${url}`, res => {
      resolve({ url, status: res.statusCode });
    }).on('error', err => {
      resolve({ url, status: err.message });
    });
  });
}

async function verifyAll() {
  console.log('Verifying all live production endpoints on https://officebazzar.com ...\n');
  for (const ep of endpoints) {
    const r = await check(ep);
    console.log(`[${r.status}] https://officebazzar.com${r.url}`);
  }
}

verifyAll();
