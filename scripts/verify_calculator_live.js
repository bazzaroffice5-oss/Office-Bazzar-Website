const https = require('https');
const crypto = require('crypto');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ statusCode: res.statusCode, buffer: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('--- Verifying Casio Desk Calculator (OB-NOT-73) on https://officebazzar.com ---');
  const pdpUrl = `https://officebazzar.com/product/ob-not-73-casio-electronic-desk-calculator?_t=${Date.now()}`;
  const pdpRes = await fetchBuffer(pdpUrl);
  const pdpHtml = pdpRes.buffer.toString('utf8');

  const hasV30 = pdpHtml.includes('20261113_v30_calculator_gallery_replacement');
  const hasImg1 = pdpHtml.includes('OB-NOT-73.webp');
  const hasImg2 = pdpHtml.includes('OB-NOT-73-alt-1.webp');
  const hasImg3 = pdpHtml.includes('OB-NOT-73-alt-2.webp');

  console.log('PDP Status:', pdpRes.statusCode);
  console.log('Has v30 token:', hasV30);
  console.log('References Image 1:', hasImg1);
  console.log('References Image 2:', hasImg2);
  console.log('References Image 3:', hasImg3);

  // Check 3rd image
  const img3Url = `https://officebazzar.com/assets/products/catalog_2026/OB-NOT-73-alt-2.webp?_t=${Date.now()}`;
  const img3Res = await fetchBuffer(img3Url);
  const img3Hash = crypto.createHash('sha256').update(img3Res.buffer).digest('hex').substring(0, 16);
  const expectedHash = '27e602cc4702728b';
  const img3Match = img3Hash === expectedHash;

  console.log('Image 3 Status:', img3Res.statusCode);
  console.log('Image 3 Hash:', img3Hash, 'Expected:', expectedHash, '| Match:', img3Match);

  // Check 1st and 2nd images unchanged
  const img1Url = `https://officebazzar.com/assets/products/catalog_2026/OB-NOT-73.webp?_t=${Date.now()}`;
  const img1Res = await fetchBuffer(img1Url);
  const img1Hash = crypto.createHash('sha256').update(img1Res.buffer).digest('hex').substring(0, 16);
  const img1Expected = 'fd3d9336132c8d8f';

  const img2Url = `https://officebazzar.com/assets/products/catalog_2026/OB-NOT-73-alt-1.webp?_t=${Date.now()}`;
  const img2Res = await fetchBuffer(img2Url);
  const img2Hash = crypto.createHash('sha256').update(img2Res.buffer).digest('hex').substring(0, 16);
  const img2Expected = '8f3e860c00f5cfbf';

  console.log('Image 1 Status:', img1Res.statusCode, '| Unchanged:', img1Hash === img1Expected);
  console.log('Image 2 Status:', img2Res.statusCode, '| Unchanged:', img2Hash === img2Expected);

  const isComplete = hasV30 && img3Match && (img1Hash === img1Expected) && (img2Hash === img2Expected);
  return isComplete;
}

verify().then(complete => {
  console.log('\nDeployment verification complete?', complete);
  process.exit(complete ? 0 : 1);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

