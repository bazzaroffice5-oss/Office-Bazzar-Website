const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment safely
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

async function getAccessToken() {
  const cache = JSON.parse(fs.readFileSync('.zoho_token_cache.json', 'utf8'));
  return cache.accessToken;
}

async function testIdempotency() {
  console.log('--- TESTING LIVE UPSERT IDEMPOTENCY ---');
  
  // Re-run upsert for OB-003 only
  const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  const match = catalogContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
  const products = eval(match[1]);
  const p = products.find(x => x.sku === 'OB-003');

  const payload = {
    data: [{
      Product_Name: p.name.trim(),
      Product_Code: p.sku.trim(),
      Product_Active: true,
      Unit_Price: 0,
      Qty_in_Stock: 0,
      Description: `[Website ID: ${p.id}]\nSlug: ${p.slug}\nCategory: ${p.categoryName}\nIdempotency Verification Test`,
      Tag: `${p.categoryName}, OfficeBazzar`
    }],
    duplicate_check_fields: ['Product_Code']
  };

  const token = await getAccessToken();
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

  const res = await new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const parsed = new URL(`${apiDomain}/crm/v2/Products/upsert`);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'OfficeBazzar-Idempotency-Test'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  console.log(`Upsert HTTP Status: ${res.status}`);
  const result = res.json?.data?.[0];
  console.log('Upsert result details:', result);

  if (result?.action === 'update') {
    console.log('PASS: Zoho CRM recognized duplicate Product_Code and performed UPDATE, creating zero duplicate records!');
  } else {
    console.log(`Result action: ${result?.action}`);
  }
}

testIdempotency();
