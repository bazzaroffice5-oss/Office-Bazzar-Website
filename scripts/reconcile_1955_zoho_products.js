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

async function getAccessToken(forceRefresh = false) {
  if (!forceRefresh && fs.existsSync('.zoho_token_cache.json')) {
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

async function fetchAllZohoProducts() {
  let token = await getAccessToken(true);
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
  const allRecords = [];
  let page = 1;
  let hasMore = true;

  console.log('Fetching all live products from Zoho CRM API...');

  while (hasMore) {
    const url = `${apiDomain}/crm/v2/Products?fields=id,Product_Name,Product_Code,Unit_Price,Qty_in_Stock,Product_Active,Description,Created_Time,Modified_Time&page=${page}&per_page=200`;
    
    let pageData = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'User-Agent': 'OfficeBazzar-Reconciliation'
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
      }).on('error', reject);
    });

    if (pageData.status === 401) {
      console.log('Token expired/invalid, refreshing token...');
      token = await getAccessToken(true);
      // retry once
      pageData = await new Promise((resolve, reject) => {
        https.get(url, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'User-Agent': 'OfficeBazzar-Reconciliation'
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
        }).on('error', reject);
      });
    }

    console.log(`Page ${page} HTTP status:`, pageData.status);
    if (pageData.status !== 200) {
      console.error(`Zoho API returned HTTP ${pageData.status}:`, pageData.json || pageData.text);
      hasMore = false;
      break;
    }

    if (pageData.status === 204 || !pageData.json?.data) {
      hasMore = false;
      break;
    }

    const records = pageData.json.data || [];
    allRecords.push(...records);
    console.log(`Page ${page}: Fetched ${records.length} records. (Total accumulated: ${allRecords.length})`);

    hasMore = pageData.json.info?.more_records === true;
    page++;
    if (page > 30) break;
  }

  return allRecords;
}

async function runReconciliation() {
  console.log('================================================================');
  console.log('   OFFICE BAZZAR — FINAL 1,955 ZOHO CRM RECONCILIATION AUDIT    ');
  console.log('================================================================\n');

  // 1. Fetch live Zoho CRM products
  const liveZoho = await fetchAllZohoProducts();
  fs.writeFileSync('scripts/all_1955_live_zoho_products.json', JSON.stringify(liveZoho, null, 2));
  console.log(`\nSuccessfully downloaded ${liveZoho.length} live Zoho CRM records.\n`);

  // 2. Read catalog.ts products
  const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  const match = catalogContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
  const websiteProducts = eval(match[1]);
  console.log(`Website Active Catalog Products: ${websiteProducts.length}`);

  const websiteSkus = new Set(websiteProducts.map(p => p.sku.trim()));
  const websiteProductBySku = new Map();
  websiteProducts.forEach(p => websiteProductBySku.set(p.sku.trim(), p));

  // 3. Compare Zoho records against Website SKUs
  const zohoByProductCode = new Map();
  const duplicateZohoProductCodes = [];
  const matchedZohoRecords = [];
  const extraZohoRecords = [];

  liveZoho.forEach(z => {
    const code = (z.Product_Code || '').trim();

    if (code) {
      if (zohoByProductCode.has(code)) {
        duplicateZohoProductCodes.push({ code, existing: zohoByProductCode.get(code), duplicate: z });
      } else {
        zohoByProductCode.set(code, z);
      }
    }

    if (code && websiteSkus.has(code)) {
      matchedZohoRecords.push(z);
    } else {
      extraZohoRecords.push(z);
    }
  });

  console.log(`\n--- RECONCILIATION SUMMARY ---`);
  console.log(`1. Total Website Catalogue Products: ${websiteProducts.length}`);
  console.log(`2. Total Live Zoho CRM Products: ${liveZoho.length}`);
  console.log(`3. Exact Difference: ${liveZoho.length - websiteProducts.length} records`);
  console.log(`4. Matched Website SKUs in Zoho CRM: ${matchedZohoRecords.length} / ${websiteProducts.length}`);
  console.log(`5. Duplicate Product_Codes in Zoho CRM: ${duplicateZohoProductCodes.length}`);
  console.log(`6. Extra Zoho Records Identified: ${extraZohoRecords.length}`);

  // 4. Detail the 7 Extra / Duplicate Records
  console.log('\n--- DETAILED AUDIT OF THE 7 DUPLICATE / EXTRA ZOHO CRM RECORDS ---');
  if (duplicateZohoProductCodes.length > 0) {
    duplicateZohoProductCodes.forEach((d, idx) => {
      console.log(`\n[Duplicate Record #${idx + 1}] Product_Code / SKU: ${d.code}`);
      console.log(`  Record A (Existing):`);
      console.log(`    Zoho ID:       ${d.existing.id}`);
      console.log(`    Product Name:  ${d.existing.Product_Name}`);
      console.log(`    Unit Price:    ₹${d.existing.Unit_Price}`);
      console.log(`    Created Time:  ${d.existing.Created_Time}`);
      console.log(`    Modified Time: ${d.existing.Modified_Time}`);
      console.log(`  Record B (Duplicate):`);
      console.log(`    Zoho ID:       ${d.duplicate.id}`);
      console.log(`    Product Name:  ${d.duplicate.Product_Name}`);
      console.log(`    Unit Price:    ₹${d.duplicate.Unit_Price}`);
      console.log(`    Created Time:  ${d.duplicate.Created_Time}`);
      console.log(`    Modified Time: ${d.duplicate.Modified_Time}`);
    });
    fs.writeFileSync('scripts/extra_7_zoho_records.json', JSON.stringify(duplicateZohoProductCodes, null, 2));
  } else {
    extraZohoRecords.forEach((r, idx) => {
      console.log(`\n[Extra Record #${idx + 1}]`);
      console.log(`  Zoho ID:        ${r.id}`);
      console.log(`  Product Name:   ${r.Product_Name}`);
      console.log(`  Product Code:   ${r.Product_Code || '(BLANK / NONE)'}`);
      console.log(`  Unit Price:     ₹${r.Unit_Price}`);
      console.log(`  Active:         ${r.Product_Active}`);
      console.log(`  Created Time:   ${r.Created_Time}`);
      console.log(`  Modified Time:  ${r.Modified_Time}`);
    });
    fs.writeFileSync('scripts/extra_7_zoho_records.json', JSON.stringify(extraZohoRecords, null, 2));
  }

  // 5. Confirm All 107 Original + Pilot Records Remain Intact
  const pilotReport = JSON.parse(fs.readFileSync('scripts/pilot_migration_report.json', 'utf8'));
  const originalBackup = JSON.parse(fs.readFileSync('scripts/live_zoho_products.json', 'utf8')); // 107 records

  let intactCount = 0;
  originalBackup.forEach(b => {
    const liveMatch = liveZoho.find(z => z.id === b.id || (b.Product_Code && z.Product_Code === b.Product_Code));
    if (liveMatch) intactCount++;
  });

  console.log(`\n--- 107 ORIGINAL & PILOT RECORDS VERIFICATION ---`);
  console.log(`Intact Original + Pilot Records in Live Zoho: ${intactCount} / ${originalBackup.length}`);

  // 6. Verify Mapping Index (zoho_product_mapping.json)
  const mapping = JSON.parse(fs.readFileSync('src/lib/data/zoho_product_mapping.json', 'utf8'));
  console.log(`\n--- MAPPING INDEX INTEGRITY ---`);
  console.log(`Total entries in zoho_product_mapping.json: ${Object.keys(mapping).length}`);
  
  let validMapCount = 0;
  websiteProducts.forEach(p => {
    const m = mapping[p.id];
    if (m && m.zohoId && m.sku === p.sku) validMapCount++;
  });
  console.log(`Valid 1-to-1 Website Product Mappings: ${validMapCount} / ${websiteProducts.length} (${((validMapCount/websiteProducts.length)*100).toFixed(2)}%)`);
}

runReconciliation();
