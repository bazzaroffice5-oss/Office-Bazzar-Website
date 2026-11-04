const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
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
      if (cache.accessToken && cache.expiresAt && cache.expiresAt > Date.now() + 120000) {
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
            reject(new Error('Zoho token refresh failed: ' + JSON.stringify(json)));
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

function buildZohoPayload(p, isDupName) {
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

  const finalName = isDupName ? `${p.name.trim()} (${p.sku.trim()})` : p.name.trim();

  return {
    Product_Name: finalName,
    Product_Code: p.sku.trim(),
    Product_Active: p.isActive !== false,
    Unit_Price: Number(p.price) || 0,
    Qty_in_Stock: Number(p.stockQuantity) || 0,
    Description: descLines.join('\n'),
    Tag: `${p.categoryName || 'General'}, ${p.brandName || 'OfficeBazzar'}`
  };
}

async function callZohoWithRetry(apiPath, postBody, maxRetries = 3) {
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const token = await getAccessToken();

    try {
      const res = await new Promise((resolve, reject) => {
        const postData = JSON.stringify(postBody);
        const parsed = new URL(`${apiDomain}${apiPath}`);
        const req = https.request({
          hostname: parsed.hostname,
          path: parsed.pathname,
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent': 'OfficeBazzar-Full-Migration'
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

      // 200, 201, and 202 (Accepted Multi-Status) are valid Zoho API responses
      if (res.status === 200 || res.status === 201 || res.status === 202) {
        return res;
      }

      // Check for rate limit or transient error
      if (res.status === 429 || res.status >= 500) {
        console.warn(`[Retry Warning] Attempt ${attempt} failed with HTTP ${res.status}. Backing off...`);
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      // Other client error
      return res;
    } catch (netErr) {
      console.warn(`[Network Warning] Attempt ${attempt} encountered error: ${netErr.message}. Retrying...`);
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts on ${apiPath}`);
}

async function verifyZohoHealth() {
  const token = await getAccessToken();
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
  return new Promise((resolve) => {
    https.get(`${apiDomain}/crm/v2/Products?per_page=1`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    }, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function runFullMigration() {
  console.log('================================================================');
  console.log('   OFFICE BAZZAR — PHASE 2 FULL ZOHO CRM BACKEND MIGRATION      ');
  console.log('================================================================\n');

  // 1. Read existing catalog.ts
  const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  const match = catalogContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
  const products = eval(match[1]);
  console.log(`Loaded ${products.length} products from website catalog.`);

  // Compute name frequency across catalog for disambiguation
  const nameFreq = new Map();
  products.forEach(p => {
    const norm = p.name.trim().toLowerCase();
    nameFreq.set(norm, (nameFreq.get(norm) || 0) + 1);
  });

  // 2. Load existing 107 mapped products
  const currentMapping = JSON.parse(fs.readFileSync('src/lib/data/zoho_product_mapping.json', 'utf8'));
  const existingMappedSkus = new Set(Object.values(currentMapping).map(m => m.sku));
  console.log(`Preserving ${existingMappedSkus.size} existing mapped products in Zoho CRM.`);

  // 3. Filter remaining products to migrate
  const pendingProducts = products.filter(p => !existingMappedSkus.has(p.sku));
  console.log(`Total Products to migrate in Phase 2: ${pendingProducts.length}\n`);

  const chunkSize = 100;
  const totalBatches = Math.ceil(pendingProducts.length / chunkSize);
  console.log(`Starting execution of ${totalBatches} sequential batches of up to ${chunkSize} items...\n`);

  const updatedMapping = { ...currentMapping };
  const allResultsLog = [];
  let totalSuccessful = 0;
  let totalFailed = 0;

  for (let b = 0; b < totalBatches; b++) {
    const batchNum = b + 1;
    const chunk = pendingProducts.slice(b * chunkSize, (b + 1) * chunkSize);
    console.log(`>>> Executing Batch ${batchNum}/${totalBatches} (${chunk.length} products)...`);

    const uploadData = chunk.map(p => {
      const isDup = nameFreq.get(p.name.trim().toLowerCase()) > 1;
      return buildZohoPayload(p, isDup);
    });

    const postBody = {
      data: uploadData,
      duplicate_check_fields: ['Product_Code']
    };

    let response;
    try {
      response = await callZohoWithRetry('/crm/v2/Products/upsert', postBody);
    } catch (batchErr) {
      console.error(`FATAL ERROR on Batch ${batchNum}:`, batchErr.message);
      console.error('Migration PAUSED as per user instruction.');
      process.exit(1);
    }

    if (response.status !== 200 && response.status !== 201 && response.status !== 202) {
      console.error(`FATAL: Batch ${batchNum} returned HTTP ${response.status}:`, response.json || response.text);
      console.error('Migration PAUSED as per user instruction.');
      process.exit(1);
    }

    const items = response.json?.data || [];
    let batchSuccess = 0;
    let batchFail = 0;

    items.forEach((item, idx) => {
      const prod = chunk[idx];
      const zohoId = item?.details?.id;
      const code = item?.code;
      const action = item?.action;
      const msg = item?.message;
      const success = (code === 'SUCCESS' || code === 'RECORD_UPDATED') && Boolean(zohoId);

      if (success) {
        batchSuccess++;
        totalSuccessful++;
        updatedMapping[prod.id] = {
          zohoId,
          sku: prod.sku,
          websiteId: prod.id,
          name: prod.name,
          price: Number(prod.price) || 0,
          action: action || 'upserted'
        };
      } else {
        batchFail++;
        totalFailed++;
        console.warn(`[Batch ${batchNum} Warning] ${prod.sku} (${prod.name}): ${msg || code}`);
      }

      allResultsLog.push({
        batch: batchNum,
        sku: prod.sku,
        name: prod.name,
        category: prod.categoryName,
        status: success ? 'SUCCESS' : 'FAILED',
        action: action || 'N/A',
        zohoId: zohoId || null,
        message: msg || code
      });
    });

    console.log(`<<< Batch ${batchNum} Complete: ${batchSuccess} succeeded, ${batchFail} failed. (Cumulative: ${totalSuccessful}/${pendingProducts.length})`);

    // Live checkpoint verification after every 5 batches
    if (batchNum % 5 === 0 && batchNum < totalBatches) {
      console.log(`\n--- [CHECKPOINT] Verifying live Zoho API health after Batch ${batchNum} ---`);
      const isHealthy = await verifyZohoHealth();
      if (!isHealthy) {
        console.error(`ERROR: Live Zoho health check failed after Batch ${batchNum}. Pausing migration.`);
        process.exit(1);
      }
      console.log(`PASS: Zoho CRM API is healthy and responding. Resuming next batch...\n`);
    }

    // Safety pacing delay between batches (600ms)
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n================================================================');
  console.log(`PHASE 2 MIGRATION COMPLETE!`);
  console.log(`Total Attempted: ${pendingProducts.length}`);
  console.log(`Total Succeeded: ${totalSuccessful}`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log(`Total Mapped Products in Master Index: ${Object.keys(updatedMapping).length}`);
  console.log('================================================================\n');

  // Save updated mapping index
  fs.writeFileSync('src/lib/data/zoho_product_mapping.json', JSON.stringify(updatedMapping, null, 2));
  console.log('Updated src/lib/data/zoho_product_mapping.json!');

  // Save comprehensive execution reports
  fs.writeFileSync('scripts/full_zoho_migration_report.json', JSON.stringify({
    executionTimestamp: new Date().toISOString(),
    totalActiveCatalogProducts: products.length,
    previouslyMapped: existingMappedSkus.size,
    phase2Attempted: pendingProducts.length,
    phase2Succeeded: totalSuccessful,
    phase2Failed: totalFailed,
    totalFinalMapped: Object.keys(updatedMapping).length,
    results: allResultsLog
  }, null, 2));

  const csvHeader = 'Batch,SKU,Product Name,Category,Status,Action,Zoho ID,Message\n';
  const csvRows = allResultsLog.map(r => `${r.batch},"${r.sku}","${r.name.replace(/"/g, '""')}","${r.category}","${r.status}","${r.action}","${r.zohoId || ''}","${(r.message || '').replace(/"/g, '""')}"`).join('\n');
  fs.writeFileSync('scripts/full_zoho_migration_report.csv', csvHeader + csvRows);
  console.log('Saved detailed reports to scripts/full_zoho_migration_report.json and .csv');

  // Verify Total Count from Live Zoho CRM
  console.log('\n--- VERIFYING FINAL TOTAL IN LIVE ZOHO CRM ---');
  let zohoPage = 1;
  let hasMore = true;
  let liveCount = 0;
  const token = await getAccessToken();
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';

  while (hasMore) {
    const pageRes = await new Promise((resolve) => {
      https.get(`${apiDomain}/crm/v2/Products?fields=id,Product_Code&page=${zohoPage}&per_page=200`, {
        headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
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

    const records = pageRes?.data || [];
    liveCount += records.length;
    hasMore = pageRes?.info?.more_records === true;
    zohoPage++;
    if (zohoPage > 25) break;
  }

  console.log(`Final verified live product count in Zoho CRM: ${liveCount} products!`);
}

runFullMigration();
