const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, text: data }));
    }).on('error', reject);
  });
}

async function verifyLive() {
  const url = `https://officebazzar.com/product/ob-not-73-casio-electronic-desk-calculator?_t=${Date.now()}`;
  console.log(`Checking ${url}...`);
  const res = await fetchText(url);

  console.log('Status:', res.statusCode);
  const html = res.text;

  const hasV31 = html.includes('20261113_v31_calculator_gallery_reorder');
  console.log('Has v31 token:', hasV31);

  // Check preload link:
  // <link rel="preload" as="image" href="/assets/products/catalog_2026/OB-NOT-73-alt-2.webp?v=...
  const preloadMatch = html.match(/rel="preload" as="image" href="([^"]+)"/);
  console.log('Preload image:', preloadMatch ? preloadMatch[1] : 'NOT FOUND');

  const isAlt2Preloaded = preloadMatch && preloadMatch[1].includes('OB-NOT-73-alt-2.webp');
  console.log('Is large clear calculator preloaded as primary hero image?', isAlt2Preloaded);

  // Check order of occurrences of images
  const idxAlt2 = html.indexOf('OB-NOT-73-alt-2.webp');
  const idxAlt1 = html.indexOf('OB-NOT-73-alt-1.webp');
  const idxMain = html.indexOf('OB-NOT-73.webp?v=');

  console.log('First occurrence positions:');
  console.log('  OB-NOT-73-alt-2 (Large clear calculator):', idxAlt2);
  console.log('  OB-NOT-73-alt-1 (Angle photo):', idxAlt1);
  console.log('  OB-NOT-73 (Small calculator):', idxMain);

  const isOrdered = idxAlt2 > 0 && idxAlt1 > idxAlt2 && idxMain > idxAlt1;
  console.log('Is gallery order correct (Alt-2 -> Alt-1 -> Main)?', isOrdered);

  return hasV31 && isAlt2Preloaded && isOrdered;
}

verifyLive().then(success => {
  console.log('\nDeployment verification complete?', success);
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

