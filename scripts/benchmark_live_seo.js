const https = require('https');

function timeUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    https.get(url, (res) => {
      let ttfb = 0;
      res.once('readable', () => {
        ttfb = Date.now() - start;
      });
      res.on('data', () => {});
      res.on('end', () => {
        const total = Date.now() - start;
        resolve({ url, status: res.statusCode, ttfb, total });
      });
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

async function runBenchmarks() {
  console.log('=== LIVE PRODUCTION CORE WEB VITALS & RESPONSE TIME BENCHMARKS ===\n');
  const urls = [
    'https://officebazzar.com/',
    'https://officebazzar.com/careers',
    'https://officebazzar.com/about',
    'https://officebazzar.com/contact',
    'https://officebazzar.com/request-quote',
    'https://officebazzar.com/products',
    'https://officebazzar.com/category/office-stationery',
    'https://officebazzar.com/product/cardboard-tag-file'
  ];

  for (const u of urls) {
    const res = await timeUrl(u);
    console.log(`${u} -> Status: ${res.status}, TTFB: ${res.ttfb} ms, Total: ${res.total} ms`);
  }
}

runBenchmarks();
