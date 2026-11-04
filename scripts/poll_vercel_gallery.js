const https = require('https');

async function pollDeployment() {
  console.log('Polling Vercel deployment for /supplier-gallery...');
  for (let attempt = 1; attempt <= 12; attempt++) {
    await new Promise(r => setTimeout(r, 8000));
    const status = await new Promise((resolve) => {
      https.get('https://officebazzar.com/supplier-gallery', (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve({ code: res.statusCode, len: d.length, age: res.headers['age'], cache: res.headers['x-vercel-cache'] }));
      }).on('error', () => resolve({ code: 0 }));
    });

    console.log(`Attempt ${attempt}: Status ${status.code} (Cache: ${status.cache}, Age: ${status.age})`);
    if (status.code === 200) {
      console.log('✓ Deployment is LIVE and serving /supplier-gallery successfully!');
      return true;
    }
  }
  return false;
}

pollDeployment().catch(console.error);

