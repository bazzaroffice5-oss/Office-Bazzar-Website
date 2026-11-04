const https = require('https');

const targetCommit = '7aefde5';
console.log(`Polling https://officebazzar.com for commit ${targetCommit} or build update...`);

async function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', (err) => resolve({ error: err }));
  });
}

async function checkSampleProduct() {
  // Test a product mapped with /assets/product/
  const res = await fetchUrl('https://officebazzar.com/assets/product/brooms-and-sticks/aluminium-stick-5-feet.webp');
  return res.status;
}

async function poll() {
  const maxAttempts = 30;
  for (let i = 1; i <= maxAttempts; i++) {
    console.log(`[Attempt ${i}/${maxAttempts}] Checking live production deployment...`);
    
    // Check if new asset path returns 200 OK
    const assetStatus = await checkSampleProduct();
    console.log(`Sample product image HTTP status: ${assetStatus}`);

    // Check products page
    const pageRes = await fetchUrl('https://officebazzar.com/products');
    console.log(`Products page HTTP status: ${pageRes.status}`);

    if (assetStatus === 200) {
      console.log('SUCCESS: Commit 7aefde5 and /assets/product/ assets are LIVE on production!');
      process.exit(0);
    }

    // Wait 10 seconds before next attempt
    await new Promise(r => setTimeout(r, 10000));
  }

  console.log('Timeout waiting for deployment.');
  process.exit(1);
}

poll();

