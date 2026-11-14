const https = require('https');
const http = require('http');

function testRedirect(urlStr) {
  return new Promise((resolve) => {
    const isHttps = urlStr.startsWith('https');
    const client = isHttps ? https : http;
    const req = client.request(urlStr, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      resolve({
        url: urlStr,
        statusCode: res.statusCode,
        location: res.headers.location,
        server: res.headers.server
      });
    });
    req.on('error', (err) => resolve({ url: urlStr, error: err.message }));
    req.end();
  });
}

function fetchContent(urlStr) {
  return new Promise((resolve) => {
    const isHttps = urlStr.startsWith('https');
    const client = isHttps ? https : http;
    client.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ url: urlStr, status: res.statusCode, headers: res.headers, data }));
    }).on('error', (err) => resolve({ url: urlStr, error: err.message }));
  });
}

async function run() {
  console.log('Testing redirects from non-www:');
  const r1 = await testRedirect('https://officebazzar.com');
  console.log('1. https://officebazzar.com ->', r1.statusCode, 'Location:', r1.location);

  const r2 = await testRedirect('https://officebazzar.com/products?query=canon');
  console.log('2. https://officebazzar.com/products?query=canon ->', r2.statusCode, 'Location:', r2.location);

  const r3 = await testRedirect('https://officebazzar.com/category/office-stationery');
  console.log('3. https://officebazzar.com/category/office-stationery ->', r3.statusCode, 'Location:', r3.location);

  const rHttp = await testRedirect('http://officebazzar.com/products');
  console.log('4. http://officebazzar.com/products ->', rHttp.statusCode, 'Location:', rHttp.location);

  console.log('\nTesting www live content:');
  const w1 = await fetchContent('https://www.officebazzar.com?t=' + Date.now());
  const canonical = w1.data ? w1.data.match(/<link rel="canonical" href="[^"]+"/) : null;
  const ogUrl = w1.data ? w1.data.match(/<meta property="og:url" content="[^"]+"/) : null;
  console.log('5. https://www.officebazzar.com status:', w1.status);
  console.log('   Canonical tag:   ', canonical ? canonical[0] : 'not found');
  console.log('   og:url tag:      ', ogUrl ? ogUrl[0] : 'not found');

  const p1 = await fetchContent('https://www.officebazzar.com/products?t=' + Date.now());
  const pCanonical = p1.data ? p1.data.match(/<link rel="canonical" href="[^"]+"/) : null;
  console.log('6. /products status:', p1.status, 'Canonical:', pCanonical ? pCanonical[0] : 'not found');

  const robots = await fetchContent('https://www.officebazzar.com/robots.txt?t=' + Date.now());
  console.log('7. robots.txt status:', robots.status);
  console.log('   Has www sitemap: ', robots.data ? robots.data.includes('https://www.officebazzar.com/sitemap.xml') : false);
  console.log('   Has www host:    ', robots.data ? robots.data.includes('Host: https://www.officebazzar.com') : false);

  const sitemap = await fetchContent('https://www.officebazzar.com/sitemap.xml?t=' + Date.now());
  console.log('8. sitemap.xml status:', sitemap.status);
  console.log('   Contains www locs:', sitemap.data ? sitemap.data.includes('<loc>https://www.officebazzar.com/') : false);
}

run();

