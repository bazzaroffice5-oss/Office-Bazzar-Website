const https = require('https');

function check() {
  return new Promise((resolve) => {
    https.get('https://officebazzar.com/assets/products/catalog_2026/OB-102.webp', res => {
      res.resume();
      resolve(res.statusCode);
    }).on('error', err => resolve(err.message));
  });
}

async function poll() {
  console.log('Polling Vercel deployment of OB-102.webp ...');
  for (let i = 1; i <= 20; i++) {
    const status = await check();
    console.log(`[Attempt ${i}/20] OB-102.webp HTTP Status: ${status}`);
    if (status === 200) {
      console.log('Deployment is LIVE on officebazzar.com!');
      return;
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}

poll();

