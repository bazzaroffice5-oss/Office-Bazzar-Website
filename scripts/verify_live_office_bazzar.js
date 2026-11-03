const https = require('https');

const urls = [
  'https://officebazzar.com/',
  'https://officebazzar.com/migrated_product_contact_sheet.html',
  'https://officebazzar.com/assets/products/catalog_2026/OB-100.webp',
  'https://officebazzar.com/assets/products/catalog_2026/OB-RDS-01.webp',
  'https://officebazzar.com/assets/placeholder-product.svg',
  'https://officebazzar.com/product/3025-box-file',
  'https://officebazzar.com/cart',
  'https://officebazzar.com/wishlist'
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, status: 'ERROR: ' + err.message });
    });
  });
}

async function verifyAll() {
  console.log('Testing live deployment endpoints...');
  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(`[HTTP ${res.status}] ${res.url}`);
  }
}

verifyAll();

