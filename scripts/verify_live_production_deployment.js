const https = require('https');

function fetchStatus(urlPath) {
  return new Promise((resolve) => {
    const url = 'https://officebazzar.com' + urlPath;
    https.get(url, (res) => {
      resolve({
        path: urlPath,
        status: res.statusCode,
        cache: res.headers['x-vercel-cache'] || 'N/A'
      });
    }).on('error', (err) => {
      resolve({ path: urlPath, status: 'ERROR: ' + err.message });
    });
  });
}

async function run() {
  console.log('Testing live production endpoints on officebazzar.com...');
  const tests = [
    '/products',
    '/category/office-stationery',
    '/category/housekeeping-hygiene',
    '/category/printers-technology',
    '/category/packaging-supplies',
    '/product/cardboard-tag-file',
    '/product/3025-box-file',
    '/product/ob-069-stainless-steel-pedal-dustbin',
    '/product/ob-063-dust-pan-with-brush-set',
    '/supplier-gallery' // Expect 404 once new deployment activates
  ];

  for (const t of tests) {
    const r = await fetchStatus(t);
    console.log(`[Status ${r.status}] ${r.path} (Vercel Cache: ${r.cache})`);
  }
}

run();

