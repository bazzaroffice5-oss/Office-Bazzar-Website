const https = require('https');
const crypto = require('crypto');

const EXPECTED_VERSION = '20261113_v27_bulk_3_image_replacement';

const testProducts = [
  {
    name: 'Barcode Printer',
    slug: 'barcode-printer',
    sku: 'OB-COM-1040',
    expectedHash: '1f0fee07c32fce0d'
  },
  {
    name: 'Harpic Toilet Cleaner',
    slug: 'harpic-toilet-cleaner',
    sku: 'OB-CLE-1093',
    expectedHash: '687216cb856cf7d7'
  },
  {
    name: 'Lizol Liquid Cleaner',
    slug: 'lizol-liquid-cleaner',
    sku: 'OB-CLE-1092',
    expectedHash: 'd660643c6716758d'
  }
];

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
  
  // Check PDP for first product
  const pdpRes = await fetchUrl(`https://officebazzar.com/product/${testProducts[0].slug}`);
  const pdpHtml = pdpRes.body.toString('utf8');
  const isUpdated = pdpHtml.includes(EXPECTED_VERSION);

  console.log(`HTTP Status: ${pdpRes.statusCode}`);
  console.log(`Deployment Updated with new version? ${isUpdated}`);
  
  if (!isUpdated) {
    console.log('Production is still deploying or CDN cache is updating. Retrying in 12s...');
    return false;
  }

  console.log('\n--- VERIFYING ALL 3 PRODUCTS & IMAGES ON PRODUCTION ---');
  let successCount = 0;

  for (const item of testProducts) {
    const pageUrl = `https://officebazzar.com/product/${item.slug}`;
    const pageRes = await fetchUrl(pageUrl);
    const pageHtml = pageRes.body.toString('utf8');
    const hasVersionInHtml = pageHtml.includes(EXPECTED_VERSION);

    // Fetch the actual image from production CDN
    const imgUrl = `https://officebazzar.com/assets/products/catalog_2026/${item.sku}.webp?v=${EXPECTED_VERSION}`;
    const imgRes = await fetchUrl(imgUrl);
    const imgHash = crypto.createHash('sha256').update(imgRes.body).digest('hex').substring(0, 16);

    const hashMatch = imgHash === item.expectedHash;
    console.log(`[${item.sku}] ${item.name}`);
    console.log(`   Page Status: ${pageRes.statusCode}, Version Tag in HTML: ${hasVersionInHtml}`);
    console.log(`   Image CDN Status: ${imgRes.statusCode}, Size: ${(imgRes.body.length / 1024).toFixed(1)} KB, Hash: ${imgHash} (Expected: ${item.expectedHash}) => ${hashMatch ? 'MATCH ✓' : 'MISMATCH ✗'}`);

    if (hasVersionInHtml && hashMatch) successCount++;
  }

  console.log(`\nVerified ${successCount}/${testProducts.length} live products on production.`);
  return successCount === testProducts.length;
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
        console.log('\n✓ PRODUCTION VERIFICATION COMPLETE: ALL 3 PRODUCTS FULLY DEPLOYED AND LIVE!');
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

