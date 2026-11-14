const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const EXPECTED_VERSION = '20261112_v25_bulk_10_image_replacement';

const testProducts = [
  { slug: 'pin-up-notice-board', sku: 'OB-BOA-1046', expectedHash: 'dd01fe8bcee8fcde' },
  { slug: 'white-board-for-school', sku: 'OB-BOA-1042', expectedHash: 'a67451b01effe9cc' },
  { slug: 'golden-letter-for-welcome-board', sku: 'OB-BOA-1043', expectedHash: '662f7e43c92666f6' },
  { slug: 'canon-ep-303-toner-cartridge', sku: 'OB-PRI-1076', expectedHash: 'e7a53697cd1c498d' },
  { slug: 'samsung-mlt-d116s-black-toner-cartridge-packaging-type-box', sku: 'OB-PRI-1081', expectedHash: '29ce3b241e40bfc2' },
  { slug: 'hp-678-tri-color-ink-cartridge-cz108aa', sku: 'OB-PRI-1086', expectedHash: '996951c5c14fb0c0' },
  { slug: 'alkosign-horizontal-sliding-board', sku: 'OB-BOA-1045', expectedHash: 'fb1b7000bddbf061' },
  { slug: 'alkosign-pegboard', sku: 'OB-BOA-1047', expectedHash: '96ae1031a5bbe55e' },
  { slug: 'humic-acid-liquid', sku: 'OB-CLE-1090', expectedHash: 'f4efeb1849cb01d4' },
  { slug: 'external-hard-disk', sku: 'OB-COM-1034', expectedHash: '263330c5b0892cec' }
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
  const pdpRes = await fetchUrl('https://officebazzar.com/product/pin-up-notice-board');
  const pdpHtml = pdpRes.body.toString('utf8');
  const isUpdated = pdpHtml.includes(EXPECTED_VERSION);

  console.log(`HTTP Status: ${pdpRes.statusCode}`);
  console.log(`Deployment Updated with new version? ${isUpdated}`);
  
  if (!isUpdated) {
    console.log('Production is still deploying previous commit or CDN cache is updating. Retrying in 10s...');
    return false;
  }

  console.log('\n--- VERIFYING ALL 10 PRODUCTS & IMAGES ON PRODUCTION ---');
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
    console.log(`[${item.sku}] ${item.slug}`);
    console.log(`   Page Status: ${pageRes.statusCode}, Version Tag: ${hasVersionInHtml}`);
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
        console.log('\n✓ PRODUCTION VERIFICATION COMPLETE: ALL 10 PRODUCTS FULLY DEPLOYED AND LIVE!');
        process.exit(0);
      }
    } catch (e) {
      console.error('Error fetching live site:', e.message);
    }
    await new Promise(r => setTimeout(r, 15000));
  }
  console.error('\nTimed out waiting for production deployment.');
  process.exit(1);
}

loopUntilReady();

