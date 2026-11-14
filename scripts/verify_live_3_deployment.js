const https = require('https');
const crypto = require('crypto');

const EXPECTED_VERSION = '20261112_v26_bulk_3_image_replacement';

const testProducts = [
  {
    name: 'Epson EcoTank L6160 Wi-Fi Duplex Multi-Function Ink Tank Printer',
    slug: 'epson-ecotank-l6160-wi-fi-duplex-multi-function-ink-tank-printer',
    sku: 'OB-COM-1035',
    expectedHash: 'b696f5d3df8f77ea'
  },
  {
    name: 'SanDisk Pen Drive',
    slug: 'sandisk-pen-drive',
    sku: 'OB-COM-1038',
    expectedHash: '57d9de8a0b284708'
  },
  {
    name: 'Name Plate Plain Innofitt',
    slug: 'name-plate-plain-innofitt',
    sku: 'OB-DIS-1063',
    expectedHash: '9232738cc7a019a8'
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

