const https = require('https');

function check() {
  return new Promise((resolve) => {
    https.get('https://officebazzar.com/supplier-gallery', (res) => {
      resolve(res.statusCode);
    }).on('error', () => resolve(null));
  });
}

async function poll() {
  console.log('Polling Vercel deployment of commit 5be6cf8 (waiting for /supplier-gallery removal)...');
  for (let i = 1; i <= 20; i++) {
    const status = await check();
    console.log(`[Attempt ${i}/20] /supplier-gallery status: ${status}`);
    if (status === 404) {
      console.log('SUCCESS: Deployment active! /supplier-gallery returns 404.');
      return true;
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  return false;
}

poll().then((res) => {
  if (res) {
    const { execSync } = require('child_process');
    console.log('\nRunning full production endpoints check:');
    console.log(execSync('node scripts/verify_live_production_deployment.js').toString());
  }
});

