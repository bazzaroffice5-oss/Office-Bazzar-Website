const https = require('https');
const crypto = require('crypto');

const EXPECTED_VERSION = '20261113_v28_newspaper_stand_replacement';

const target = {
  name: 'Double Sided Newspaper Stand',
  slug: 'double-sided-newspaper-stand',
  sku: 'OB-DIS-1060',
  expectedHash: '1c9ed4671cb78f46'
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(data)
      }));
    }).on('error', reject);
  });
}

async function checkDeployment() {
  console.log(`Checking live production site https://officebazzar.com for version ${EXPECTED_VERSION}...`);
  
  // Check PDP
  const pdpRes = await fetchUrl(`https://officebazzar.com/product/${target.slug}`);
  const pdpHtml = pdpRes.body.toString('utf8');
  const isUpdated = pdpHtml.includes(EXPECTED_VERSION);

  console.log(`HTTP Status: ${pdpRes.statusCode}`);
  console.log(`Deployment Updated with new version? ${isUpdated}`);
  
  if (!isUpdated) {
    console.log('Production is still deploying or CDN cache is updating. Retrying in 12s...');
    return false;
  }

  console.log('\n--- VERIFYING PRODUCT & IMAGE ON PRODUCTION ---');
  // Fetch the actual image from production CDN
  const imgUrl = `https://officebazzar.com/assets/products/catalog_2026/${target.sku}.webp?v=${EXPECTED_VERSION}`;
  const imgRes = await fetchUrl(imgUrl);
  const imgHash = crypto.createHash('sha256').update(imgRes.body).digest('hex').substring(0, 16);

  const hashMatch = imgHash === target.expectedHash;
  console.log(`[${target.sku}] ${target.name}`);
  console.log(`   Page Status: ${pdpRes.statusCode}, Version Tag in HTML: ${isUpdated}`);
  console.log(`   Image CDN Status: ${imgRes.statusCode}, Size: ${(imgRes.body.length / 1024).toFixed(1)} KB, Hash: ${imgHash} (Expected: ${target.expectedHash}) => ${hashMatch ? 'MATCH ✓' : 'MISMATCH ✗'}`);

  return isUpdated && hashMatch;
}

async function loopUntilReady() {
  let attempts = 0;
  const maxAttempts = 20;
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n[Attempt ${attempts}/${maxAttempts}]`);
    try {
      const ready = await checkDeployment();
      if (ready) {
        console.log('\n✓ PRODUCTION VERIFICATION COMPLETE: DOUBLE-SIDED NEWSPAPER STAND FULLY DEPLOYED AND LIVE!');
        process.exit(0);
      }
    } catch (e) {
      console.error('Error fetching live site:', e.message);
    }
    await new Promise(r => setTimeout(r, 12000));
  }
  console.error('\nTimed out waiting for production deployment.');
  process.exit(1);
}

loopUntilReady();

