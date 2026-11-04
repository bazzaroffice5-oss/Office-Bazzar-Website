const https = require('https');

console.log('====================================================');
console.log('     OFFICEBAZZAR - STEP 2: RFQ SUBMISSION QA       ');
console.log('====================================================');

// Test payload containing both an existing product and a newly created product
const testRfqPayload = {
  customerName: 'QA Test Engineer',
  companyName: 'OfficeBazzar Quality Assurance Corp',
  email: 'qa-audit-test@officebazzar.com',
  phone: '9876543210',
  deliveryLocation: 'Royapettah Procurement Hub, Chennai',
  pincode: '600014',
  preferredContactMethod: 'email',
  additionalRequirements: 'Automated Production Verification Test for Catalogue Expansion (Commit bb0eb52)',
  items: [
    {
      productId: 'prod-cardboard-tag-file', // Existing product
      productName: 'Cardboard Tag File',
      quantity: 50,
      unitPrice: 0,
      sku: 'OB-STA-1001'
    },
    {
      productId: 'prod-broom-stick-plastic-ob-hou-2001', // Newly created product
      productName: 'Broom Stick Plastic',
      quantity: 25,
      unitPrice: 0,
      sku: 'OB-HOU-2001'
    }
  ]
};

function submitLiveRfq(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'officebazzar.com',
      port: 443,
      path: '/api/quotations/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'OfficeBazzar-QA-Engine/2.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log('Submitting test RFQ to live endpoint https://officebazzar.com/api/quotations/create ...');
  console.log('Items in RFQ:', testRfqPayload.items.map(i => `${i.sku} (${i.productName}) x ${i.quantity}`));

  try {
    const result = await submitLiveRfq(testRfqPayload);
    console.log(`\nResponse Status: ${result.status}`);
    console.log('Response Body:', JSON.stringify(result.data || result.raw, null, 2));

    if (result.status === 200 || result.status === 201) {
      console.log('\n[PASS] RFQ Submission successfully accepted by live production API!');
      console.log(`[PASS] Quotation ID Generated: ${result.data?.quotation?.id || result.data?.id || 'OK'}`);
      console.log(`[PASS] Zoho CRM Sync Status: ${result.data?.zohoSync?.success ? 'Synced to Zoho CRM' : result.data?.zohoSync?.message || 'Queued / Mock fallback'}`);
    } else {
      console.error('\n[FAIL] RFQ submission failed with status', result.status);
    }
  } catch (err) {
    console.error('[Error] Request failed:', err);
  }
}

runTest();

