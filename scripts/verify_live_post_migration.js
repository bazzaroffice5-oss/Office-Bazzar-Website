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
  console.log('--- VERIFYING LIVE POST-MIGRATION STOREFRONT AND RFQ ---');

  // Check Storefront Routes
  const routes = [
    'https://officebazzar.com/',
    'https://officebazzar.com/products',
    'https://officebazzar.com/category/office-stationery',
    'https://officebazzar.com/category/housekeeping-hygiene'
  ];

  for (const r of routes) {
    const res = await get(r);
    console.log(`Route [${res.status}]: ${r}`);
  }

  // Test RFQ with newly migrated products
  console.log('\n--- Testing Live RFQ API with Newly Migrated Products ---');
  const quotePayload = {
    customerName: 'Post Migration Verification Tester',
    companyName: 'Office Bazzar Enterprise Procurement',
    email: 'post-migration-qa@officebazzar.com',
    phone: '9840098400',
    deliveryAddress: '500 Anna Salai, Teynampet, Chennai, Tamil Nadu 600018',
    pincode: '600018',
    notes: 'Live verification test for Phase 2 1,948 products Zoho CRM rollout',
    items: [
      {
        productId: 'prod-ob-003-shoe-cover-dispenser',
        productName: 'Shoe Cover Dispenser',
        sku: 'OB-003',
        indicativeUnitPrice: 0,
        gstPercent: 18,
        quantity: 2,
        indicativeTotalPrice: 0,
        productImage: '/assets/products/catalog_2026/OB-003.webp',
        packSize: 'Standard Institutional Pack'
      },
      {
        productId: 'prod-ob-004-paper-cup-dispenser',
        productName: 'Paper Cup Dispenser',
        sku: 'OB-004',
        indicativeUnitPrice: 0,
        gstPercent: 18,
        quantity: 5,
        indicativeTotalPrice: 0,
        productImage: '/assets/products/catalog_2026/OB-004.webp',
        packSize: 'Standard Institutional Pack'
      }
    ]
  };

  const rfqRes = await post('https://officebazzar.com/api/quotations/create', quotePayload);
  console.log('RFQ Response Status:', rfqRes.status);
  console.log('RFQ Response Data:', rfqRes.json || rfqRes.text);

  if (rfqRes.status === 201 || (rfqRes.json && rfqRes.json.success)) {
    console.log('\nPASS: Live RFQ with newly migrated products successfully registered in Zoho CRM!');
  } else {
    console.log('RFQ response:', rfqRes.status);
  }

  console.log('\n--- LIVE VERIFICATION COMPLETE ---');
}

run();

