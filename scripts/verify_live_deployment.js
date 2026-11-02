const https = require('https');

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function verifyLive() {
  console.log('=== VERIFYING LIVE PRODUCTION WEBSITE (https://officebazzar.com) ===\n');

  // 1. Homepage
  console.log('1. Checking Homepage (https://officebazzar.com)...');
  try {
    const home = await fetchUrl('https://officebazzar.com');
    console.log(`   Status: ${home.status} OK`);
    console.log(`   Has OfficeBazzar title: ${home.body.includes('OfficeBazzar')}`);
    console.log(`   Content length: ${home.body.length} bytes\n`);
  } catch (err) {
    console.error('   Homepage failed:', err.message);
  }

  // 2. Category Pages
  console.log('2. Checking Category Pages...');
  const catUrls = [
    'https://officebazzar.com/category/housekeeping-hygiene',
    'https://officebazzar.com/category/office-stationery',
    'https://officebazzar.com/category/packaging-supplies',
    'https://officebazzar.com/category/printers-technology',
    'https://officebazzar.com/shop'
  ];
  for (const cUrl of catUrls) {
    try {
      const res = await fetchUrl(cUrl);
      console.log(`   ${cUrl} -> Status: ${res.status}`);
    } catch (err) {
      console.error(`   ${cUrl} failed:`, err.message);
    }
  }

  // 3. Product Detail Pages
  console.log('\n3. Checking Product Detail Pages...');
  const prodUrls = [
    'https://officebazzar.com/product/cardboard-tag-file',
    'https://officebazzar.com/product/ob-pap-04-jk-copier-paper-75-gsm-a4',
    'https://officebazzar.com/product/ob-001-ss-hand-dryer-machine',
    'https://officebazzar.com/product/ob-rds-01-pvc-reflective-traffic-safety-cone'
  ];
  for (const pUrl of prodUrls) {
    try {
      const res = await fetchUrl(pUrl);
      console.log(`   ${pUrl} -> Status: ${res.status}`);
    } catch (err) {
      console.error(`   ${pUrl} failed:`, err.message);
    }
  }

  // 4. Extracted Product Image Assets on Vercel CDN
  console.log('\n4. Checking Extracted Product Images on Production CDN...');
  const imgUrls = [
    'https://officebazzar.com/assets/products/copier-papers/ob-pap-04-jk-copier-paper-75-gsm-a4.webp',
    'https://officebazzar.com/assets/products/housekeeping/ob-001-ss-hand-dryer-machine.webp',
    'https://officebazzar.com/assets/products/stationery/ob-fil-23-office-document-tag-file.webp',
    'https://officebazzar.com/assets/products/road-safety/ob-rds-01-pvc-reflective-traffic-safety-cone.webp'
  ];
  for (const iUrl of imgUrls) {
    try {
      const res = await fetchUrl(iUrl);
      console.log(`   ${iUrl} -> Status: ${res.status}, Type: ${res.headers['content-type']}, Size: ${res.headers['content-length']} bytes`);
    } catch (err) {
      console.error(`   ${iUrl} failed:`, err.message);
    }
  }

  // 5. Bazzar AI Chat API Live Test
  console.log('\n5. Checking Live Bazzar AI Chatbot API (/api/chat)...');
  try {
    const chatRes = await fetchUrl('https://officebazzar.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Do you supply JK Copier paper?',
        history: []
      })
    });
    console.log(`   Status: ${chatRes.status}`);
    const parsed = JSON.parse(chatRes.body);
    console.log(`   AI Response (first 120 chars): "${(parsed.response || parsed.text || '').substring(0, 120)}..."`);
    console.log(`   Products recommended count: ${(parsed.products || []).length}`);
    if (parsed.products && parsed.products.length > 0) {
      console.log(`   Top recommended: ${parsed.products[0].name} (${parsed.products[0].sku || ''})`);
    }
  } catch (err) {
    console.error('   Live Chat test failed:', err.message);
  }

  console.log('\n=== LIVE PRODUCTION VERIFICATION COMPLETE ===\n');
}

verifyLive().catch(console.error);

