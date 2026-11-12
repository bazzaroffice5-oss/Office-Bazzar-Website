const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', err => resolve({ status: 500, error: err.message }));
  });
}

async function verify() {
  console.log('Checking live production website (https://officebazzar.com)...\n');

  // 1. Check sitemap
  const sitemap = await fetchUrl('https://officebazzar.com/sitemap.xml');
  const hasNov12 = sitemap.data ? sitemap.data.includes('2026-11-12') : false;
  console.log('1. Sitemap (https://officebazzar.com/sitemap.xml):');
  console.log(`   Status: ${sitemap.status}, Contains 2026-11-12: ${hasNov12}`);

  // 2. Check llms.txt
  const llms = await fetchUrl('https://officebazzar.com/llms.txt');
  console.log('2. LLMs Manifest (https://officebazzar.com/llms.txt):');
  console.log(`   Status: ${llms.status}, Content length: ${(llms.data || '').length} bytes`);

  // 3. Check building webp image
  const img = await fetchUrl('https://officebazzar.com/images/officebazzar-building.webp?v=20261112_v1');
  console.log('3. Optimized Building WebP Image:');
  console.log(`   Status: ${img.status}, Content-Type: ${img.headers['content-type']}, Size: ${img.headers['content-length']} bytes`);

  // 4. Check Product Detail Page Title
  const pdp = await fetchUrl('https://officebazzar.com/product/cardboard-tag-file');
  const titleMatch = pdp.data ? pdp.data.match(/<title>([^<]+)<\/title>/) : null;
  console.log('4. Product Page Title (cardboard-tag-file):');
  console.log(`   Status: ${pdp.status}, Title: "${titleMatch ? titleMatch[1] : 'NONE'}"`);

  // 5. Check Category Page
  const cat = await fetchUrl('https://officebazzar.com/category/office-stationery');
  const hasFeatured = cat.data ? cat.data.includes('Featured &amp; Essential Office Stationery') || cat.data.includes('Featured & Essential Office Stationery') : false;
  console.log('5. Category Page (office-stationery):');
  console.log(`   Status: ${cat.status}, Has Featured Category Products Section: ${hasFeatured}`);

  return hasNov12 && llms.status === 200 && img.status === 200;
}

verify();
