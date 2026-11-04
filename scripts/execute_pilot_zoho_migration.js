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
  if (fs.existsSync('.zoho_token_cache.json')) {
    try {
      const cache = JSON.parse(fs.readFileSync('.zoho_token_cache.json', 'utf8'));
      if (cache.accessToken && cache.expiresAt && cache.expiresAt > Date.now() + 60000) {
        return cache.accessToken;
      }
    } catch (e) {}
  }

  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in';
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  const url = `${accountsUrl}/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`;

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            const tokenCache = {
              accessToken: json.access_token,
              expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
              updatedAt: new Date().toISOString()
            };
            fs.writeFileSync('.zoho_token_cache.json', JSON.stringify(tokenCache, null, 2));
            resolve(json.access_token);
          } else {
            reject(new Error('Zoho token refresh failed'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function buildZohoPayload(p) {
  const images = p.images || [];
  const primaryImg = images[0] || '/assets/placeholder-product.svg';
  const galleryImgs = images.slice(1);

  const descLines = [
    `[Website ID: ${p.id}]`,
    `Slug: ${p.slug}`,
    `Category: ${p.categoryName || p.categoryId}`,
    `Subcategory: ${p.subcategoryName || 'N/A'}`,
    `Brand: ${p.brandName || 'OfficeBazzar'}`,
    `GST Rate: ${p.gstPercent || 18}%`,
    `Pack Size: ${p.packSize || 'Standard Pack'}`,
    `Primary Image: ${primaryImg}`,
    galleryImgs.length > 0 ? `Gallery Images (${galleryImgs.length}): ${galleryImgs.join(', ')}` : '',
    '',
    p.description || '',
  ].filter(Boolean);

  return {
    Product_Name: p.name.trim(),
    Product_Code: p.sku.trim(),
    Product_Active: p.isActive !== false,
    Unit_Price: Number(p.price) || 0,
    Qty_in_Stock: Number(p.stockQuantity) || 0,
    Description: descLines.join('\n'),
    Tag: `${p.categoryName || 'General'}, ${p.brandName || 'OfficeBazzar'}`
  };
}

async function runPilot() {
  console.log('=====================================================');
  console.log('  OFFICE BAZZAR - CONTROLLED PILOT ZOHO MIGRATION   ');
  console.log('=====================================================\n');

  // 1. Verify 101 existing Zoho products are untouched
  const liveZoho = JSON.parse(fs.readFileSync('scripts/live_zoho_products.json', 'utf8'));
  const existingZohoSkus = new Set(liveZoho.map(z => z.Product_Code?.trim()));
  console.log(`Verified ${existingZohoSkus.size} existing Zoho CRM product SKUs.`);

  // 2. Load 6 selected pilot products
  const pilotProducts = JSON.parse(fs.readFileSync('scripts/pilot_products_full.json', 'utf8'));
  console.log(`Loaded ${pilotProducts.length} pilot products for controlled migration:`);

  // Assert no collision with existing 101
  pilotProducts.forEach(p => {
    if (existingZohoSkus.has(p.sku)) {
      console.error(`FATAL: Pilot product ${p.sku} overlaps with existing Zoho product!`);
      process.exit(1);
    }
  });
  console.log('PASS: Zero collision with existing 101 Zoho products.\n');

  // 3. Build Zoho upsert payload
  const uploadData = pilotProducts.map(buildZohoPayload);
  const upsertBody = {
    data: uploadData,
    duplicate_check_fields: ['Product_Code']
  };

  console.log('Executing Zoho CRM Upsert (/crm/v2/Products/upsert)...');
  const token = await getAccessToken();
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

  const upsertResponse = await new Promise((resolve, reject) => {
    const postData = JSON.stringify(upsertBody);
    const parsed = new URL(`${apiDomain}/crm/v2/Products/upsert`);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'OfficeBazzar-Pilot-Sync'
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
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  console.log(`Zoho API HTTP Status: ${upsertResponse.status}`);
  const results = upsertResponse.json?.data || [];
  console.log(`Zoho API Returned ${results.length} result items.\n`);

  // 4. Analyze Upsert Results
  const pilotResults = [];
  const newlyCreatedIds = [];

  results.forEach((item, idx) => {
    const p = pilotProducts[idx];
    const zohoId = item?.details?.id;
    const code = item?.code;
    const action = item?.action;
    const message = item?.message;
    const success = code === 'SUCCESS';

    if (zohoId) newlyCreatedIds.push(zohoId);

    pilotResults.push({
      sku: p.sku,
      name: p.name,
      category: p.categoryName,
      status: success ? 'SUCCESS' : 'FAILED',
      action: action || 'N/A',
      zohoId: zohoId || null,
      message: message || 'N/A'
    });

    console.log(`[${success ? 'SUCCESS' : 'FAILED'}] ${p.sku} - ${p.name}`);
    console.log(`   Action: ${action || 'N/A'} | Zoho ID: ${zohoId || 'NONE'} | Status: ${code}`);
  });

  // 5. Verification: Read Back Each Newly Created Product from Zoho CRM
  console.log('\n--- VERIFYING RETRIEVAL OF NEWLY MIGRATED PRODUCTS FROM ZOHO CRM ---');
  const readBackResults = [];

  for (const item of pilotResults) {
    if (!item.zohoId) continue;

    const readUrl = `${apiDomain}/crm/v2/Products/${item.zohoId}`;
    const readRes = await new Promise((resolve) => {
      https.get(readUrl, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'User-Agent': 'OfficeBazzar-Pilot-Verify'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });

    const record = readRes?.data?.[0];
    if (record) {
      const p = pilotProducts.find(x => x.sku === item.sku);
      const isCodeMatch = record.Product_Code === p.sku;
      const isNameMatch = record.Product_Name === p.name;
      const isPriceMatch = Number(record.Unit_Price) === Number(p.price);
      const isDescMatch = record.Description && record.Description.includes(p.id);

      readBackResults.push({
        sku: item.sku,
        name: record.Product_Name,
        zohoId: record.id,
        Product_Code: record.Product_Code,
        Unit_Price: record.Unit_Price,
        Product_Active: record.Product_Active,
        DescriptionLength: (record.Description || '').length,
        isCodeMatch,
        isNameMatch,
        isPriceMatch,
        isDescMatch
      });

      console.log(`Verified [${record.Product_Code}] in Zoho: Name="${record.Product_Name}", Price=${record.Unit_Price}, Active=${record.Product_Active}`);
    } else {
      console.error(`Failed to read back Zoho product ${item.zohoId}`);
    }

    // Pacing delay
    await new Promise(r => setTimeout(r, 200));
  }

  // 6. Save Pilot Migration Output Report
  const report = {
    executionTimestamp: new Date().toISOString(),
    totalPilotAttempted: pilotProducts.length,
    totalPilotSucceeded: pilotResults.filter(r => r.status === 'SUCCESS').length,
    totalPilotFailed: pilotResults.filter(r => r.status === 'FAILED').length,
    existingZohoProductsUntouched: existingZohoSkus.size,
    pilotResults,
    readBackVerification: readBackResults
  };

  fs.writeFileSync('scripts/pilot_migration_report.json', JSON.stringify(report, null, 2));
  console.log('\nSaved pilot execution report to scripts/pilot_migration_report.json');
}

runPilot();

