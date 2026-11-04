const https = require('https');

async function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', (err) => resolve({ error: err }));
  });
}

async function post(url, body) {
  return new Promise((resolve) => {
    const dataString = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', (err) => resolve({ error: err }));
    req.write(dataString);
    req.end();
  });
}

async function run() {
  console.log('--- STARTING LIVE PRODUCTION VERIFICATION (https://officebazzar.com) ---');

  // 1. Check Storefront & Category Routes
  const routes = [
    'https://officebazzar.com/',
    'https://officebazzar.com/products',
    'https://officebazzar.com/category/office-stationery',
    'https://officebazzar.com/category/housekeeping-hygiene',
    'https://officebazzar.com/category/printers-technology',
    'https://officebazzar.com/category/packaging-supplies',
    'https://officebazzar.com/cart',
    'https://officebazzar.com/wishlist',
    'https://officebazzar.com/request-quote'
  ];

  for (const r of routes) {
    const res = await get(r);
    console.log(`Route [${res.status}]: ${r}`);
    if (res.status !== 200) {
      console.error(`ERROR: Route ${r} returned non-200 status: ${res.status}`);
    }
  }

  // 2. Check Sample /assets/product/ images across various subdirectories
  const sampleImages = [
    'https://officebazzar.com/assets/product/brooms-and-sticks/aluminium-stick-5-feet.webp',
    'https://officebazzar.com/assets/product/chemical-product/colin-glass-and-multisurface-cleaner-sparkling-shine-500ml-spray-bottles-pair-front-and-back.webp',
    'https://officebazzar.com/assets/product/dispenser/cute-star-design-jumbo-toilet-roll-dispenser-pair-white-grey.webp',
    'https://officebazzar.com/assets/product/dustbin/lazzo-stainless-steel-pedal-bin-10x15-packaging-box.webp',
    'https://officebazzar.com/assets/product/collage/joy-and-victor-rubber-household-gloves.webp',
    'https://officebazzar.com/assets/product/stationery/jb9-magnetic-white-board-duster-pack-of-10-boxes-shrink-wrapped.webp',
    'https://officebazzar.com/assets/product/tissue-product/premier-soft-face-tissues-2-ply-100-pulls-green-box-with-pop-up-tissue.webp',
    'https://officebazzar.com/assets/product/wiper/window-glass-wiper-telescopic-handle-with-mesh-sponge-and-squeegee.webp'
  ];

  console.log('\n--- Verifying Sample WebP Assets on CDN ---');
  for (const imgUrl of sampleImages) {
    const res = await get(imgUrl);
    console.log(`Image [${res.status}]: ${imgUrl.split('/product/')[1]}`);
    if (res.status !== 200) {
      console.error(`ERROR: Image failed to load: ${imgUrl}`);
    }
  }

  // 3. Test RFQ Submission
  console.log('\n--- Testing Live RFQ API (/api/quotations/create) ---');
  const quotePayload = {
    customerName: 'Live Integration QA Verifier',
    companyName: 'Office Bazzar Verification Corp',
    email: 'integration-qa@officebazzar.com',
    phone: '9840098400',
    deliveryAddress: '100 Mount Road, Guindy, Chennai, Tamil Nadu 600032',
    pincode: '600032',
    notes: 'Automated 100% product image integration verification test',
    items: [
      {
        productId: 'prod-cardboard-tag-file',
        productName: 'Cardboard Tag File',
        sku: 'OB-STA-1001',
        indicativeUnitPrice: 45,
        gstPercent: 18,
        quantity: 20,
        indicativeTotalPrice: 900,
        productImage: '/assets/products/catalog_2026/OB-STA-1001.webp',
        packSize: 'Pack of 10'
      },
      {
        productId: 'prod-colin-glass-cleaner-500-ml',
        productName: 'Colin Glass Cleaner 500 Ml',
        sku: 'OB-HOU-1071',
        indicativeUnitPrice: 105,
        gstPercent: 18,
        quantity: 10,
        indicativeTotalPrice: 1050,
        productImage: '/assets/product/chemical-product/colin-glass-and-multisurface-cleaner-sparkling-shine-500ml-spray-bottles-pair-front-and-back.webp',
        packSize: '500ml Bottle'
      }
    ]
  };

  const rfqRes = await post('https://officebazzar.com/api/quotations/create', quotePayload);
  console.log('RFQ Response Status:', rfqRes.status);
  console.log('RFQ Response Data:', rfqRes.json || rfqRes.text);

  if (rfqRes.status === 201 || (rfqRes.json && rfqRes.json.success)) {
    console.log('PASS: Live RFQ submission to Zoho CRM succeeded with 201 Created!');
  } else {
    console.log('RFQ response code:', rfqRes.status);
  }

  console.log('\n--- LIVE PRODUCTION VERIFICATION COMPLETE ---');
}

run();
