const https = require('https');

function fetchStatus(urlPath) {
  return new Promise((resolve) => {
    const url = 'https://officebazzar.com' + urlPath;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path: urlPath,
          status: res.statusCode,
          length: Buffer.byteLength(data),
          cache: res.headers['x-vercel-cache'] || 'N/A',
          body: data
        });
      });
    }).on('error', (err) => {
      resolve({ path: urlPath, status: 'ERROR: ' + err.message });
    });
  });
}

async function run() {
  console.log('Polling Vercel deployment of commit bb0eb52 (Complete 2,365 Integration)...');

  // We can detect when the new deployment is active by fetching /products and checking for total products count or a new SKU
  for (let attempt = 1; attempt <= 20; attempt++) {
    const res = await fetchStatus('/products');
    console.log(`[Attempt ${attempt}/20] /products status: ${res.status} | Content-Length: ${res.length} | cache: ${res.cache}`);

    if (res.body && (res.body.includes('OB-HOU-2001') || res.body.includes('1808 products') || res.length > 700000)) {
      console.log('SUCCESS: New deployment bb0eb52 is LIVE in production!');
      break;
    }
    await new Promise(r => setTimeout(r, 12000));
  }

  console.log('\n--- Verifying Live Production Routes ---');
  const routes = [
    '/products',
    '/category/housekeeping-hygiene',
    '/category/office-stationery',
    '/category/packaging-supplies',
    '/category/printers-technology',
    '/product/cardboard-tag-file',
    '/product/3025-box-file'
  ];

  for (const r of routes) {
    const check = await fetchStatus(r);
    console.log(`[Status ${check.status}] ${check.path} (${check.length} bytes, cache: ${check.cache})`);
  }
}

run();

