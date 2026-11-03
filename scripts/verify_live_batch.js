const https = require('https');

const paths = [
  '/',
  '/product/a4-punch-folder',
  '/product/3025-box-file',
  '/product/cardboard-tag-file',
  '/assets/products/catalog_2026/OB-HOU-1011.webp',
  '/assets/products/catalog_2026/OB-HOU-1016.webp',
  '/assets/products/catalog_2026/OB-HOU-1010.webp',
  '/assets/products/catalog_2026/OB-HOU-1012.webp',
  '/assets/products/catalog_2026/OB-HOU-1026.webp',
  '/assets/products/catalog_2026/OB-GAR-1032.webp',
  '/assets/products/catalog_2026/OB-STA-1003.webp',
  '/assets/products/catalog_2026/OB-STA-1004.webp',
  '/assets/products/catalog_2026/OB-STA-1006.webp',
  '/assets/products/catalog_2026/OB-COM-1037.webp',
  '/assets/products/catalog_2026/OB-RDS-02.webp'
];

function checkPath(p) {
  return new Promise((resolve) => {
    const req = https.get(`https://officebazzar.com${p}`, (res) => {
      resolve({ path: p, status: res.statusCode });
    });
    req.on('error', (err) => {
      resolve({ path: p, status: err.message });
    });
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ path: p, status: 'TIMEOUT' });
    });
  });
}

async function verify() {
  console.log('Verifying live endpoints on https://officebazzar.com ...');
  for (const p of paths) {
    const res = await checkPath(p);
    console.log(`[${res.status}] https://officebazzar.com${p}`);
  }
}

verify();

