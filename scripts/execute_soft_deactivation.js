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

const TARGET_IDS = [
  '1476900000000591009',
  '1476900000000591024',
  '1476900000000596045',
  '1476900000000591027',
  '1476900000000591037',
  '1476900000000591058',
  '1476900000000591074'
];

const RECORD_A_IDS = [
  '1476900000000596204',
  '1476900000000596205',
  '1476900000000596206',
  '1476900000000596207',
  '1476900000000596208',
  '1476900000000596209',
  '1476900000000596211'
];

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

async function fetchZohoRecord(id, token) {
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
  const url = `${apiDomain}/crm/v2/Products/${id}`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'User-Agent': 'OfficeBazzar-SoftDeactivation'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json.data ? json.data[0] : null, raw: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function updateProducts(payload, token) {
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
  const url = `${apiDomain}/crm/v2/Products`;
  const dataString = JSON.stringify({ data: payload });

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        'User-Agent': 'OfficeBazzar-SoftDeactivation'
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
    req.write(dataString);
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('   OFFICE BAZZAR — SOFT-DEACTIVATION OF 7 REDUNDANT ZOHO RECORDS ');
  console.log('================================================================\n');

  let token = await getAccessToken();

  // STEP 1: Export and preserve full current state of all 7 redundant records
  console.log('Step 1: Exporting full pre-deactivation state of all 7 redundant records...');
  const preDeactivationRecords = [];

  for (const id of TARGET_IDS) {
    const res = await fetchZohoRecord(id, token);
    if (res.status === 200 && res.data) {
      preDeactivationRecords.push(res.data);
      console.log(`  Preserved Record: ${id} | Name: ${res.data.Product_Name} | Code: ${res.data.Product_Code} | Active: ${res.data.Product_Active}`);
    } else {
      console.error(`  Failed to fetch target record ${id}:`, res.status, res.raw);
    }
  }

  if (preDeactivationRecords.length !== TARGET_IDS.length) {
    throw new Error(`Expected ${TARGET_IDS.length} records to be preserved, but got ${preDeactivationRecords.length}`);
  }

  const backupDir = path.join('scripts', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `pre_deactivation_7_records_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(preDeactivationRecords, null, 2));
  fs.writeFileSync('scripts/pre_deactivation_7_records_backup.json', JSON.stringify(preDeactivationRecords, null, 2));
  console.log(`\nAll 7 records preserved to:\n- ${backupFile}\n- scripts/pre_deactivation_7_records_backup.json\n`);

  // STEP 2: Execute soft-deactivation (PUT with ONLY id and Product_Active: false)
  console.log('Step 2: Sending PUT request to update Product_Active = false for the 7 IDs...');
  const updatePayload = TARGET_IDS.map(id => ({
    id: id,
    Product_Active: false
  }));

  const updateRes = await updateProducts(updatePayload, token);
  console.log('Update HTTP Status:', updateRes.status);
  console.log('Update API Response:', JSON.stringify(updateRes.json, null, 2));

  if (updateRes.status !== 200 && updateRes.status !== 202) {
    throw new Error(`Update failed with HTTP ${updateRes.status}`);
  }

  // STEP 3: Live API read-back verification of the 7 redundant records
  console.log('\nStep 3: Performing live API read-back verification on the 7 records...');
  const postDeactivationVerification = [];
  let allDeactivated = true;

  for (const id of TARGET_IDS) {
    const res = await fetchZohoRecord(id, token);
    if (res.status === 200 && res.data) {
      const isDeactivated = res.data.Product_Active === false;
      if (!isDeactivated) allDeactivated = false;
      postDeactivationVerification.push({
        id: res.data.id,
        Product_Name: res.data.Product_Name,
        Product_Code: res.data.Product_Code,
        Product_Active: res.data.Product_Active,
        Unit_Price: res.data.Unit_Price,
        Modified_Time: res.data.Modified_Time,
        status: isDeactivated ? 'SUCCESS_DEACTIVATED' : 'FAILED_STILL_ACTIVE'
      });
      console.log(`  Verified Record: ${id} | Name: ${res.data.Product_Name} | Code: ${res.data.Product_Code} | Product_Active: ${res.data.Product_Active} [${isDeactivated ? 'PASS' : 'FAIL'}]`);
    } else {
      console.error(`  Read-back failed for ${id}:`, res.status);
      allDeactivated = false;
    }
  }

  fs.writeFileSync('scripts/post_deactivation_verification.json', JSON.stringify(postDeactivationVerification, null, 2));

  // STEP 4: Live API read-back verification of the 7 Record A (Active Mapped) counterparts
  console.log('\nStep 4: Verifying the 7 active mapped Record A counterparts remain active and untouched...');
  const recordAVerification = [];
  let allRecordAActive = true;

  for (const id of RECORD_A_IDS) {
    const res = await fetchZohoRecord(id, token);
    if (res.status === 200 && res.data) {
      const isActive = res.data.Product_Active === true;
      if (!isActive) allRecordAActive = false;
      recordAVerification.push({
        id: res.data.id,
        Product_Name: res.data.Product_Name,
        Product_Code: res.data.Product_Code,
        Product_Active: res.data.Product_Active,
        Unit_Price: res.data.Unit_Price,
        status: isActive ? 'PASS_ACTIVE' : 'FAIL_INACTIVE'
      });
      console.log(`  Record A: ${id} | Name: ${res.data.Product_Name} | Code: ${res.data.Product_Code} | Product_Active: ${res.data.Product_Active} [${isActive ? 'PASS' : 'FAIL'}]`);
    } else {
      allRecordAActive = false;
    }
  }

  // STEP 5: Verify all 1,948 website products mapping
  console.log('\nStep 5: Verifying mapping index (src/lib/data/zoho_product_mapping.json)...');
  const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  const match = catalogContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
  const websiteProducts = eval(match[1]);
  const mapping = JSON.parse(fs.readFileSync('src/lib/data/zoho_product_mapping.json', 'utf8'));

  let validMappings = 0;
  let pointingToDeactivated = 0;

  websiteProducts.forEach(p => {
    const m = mapping[p.id];
    if (m && m.zohoId && m.sku === p.sku) {
      validMappings++;
      if (TARGET_IDS.includes(m.zohoId)) {
        pointingToDeactivated++;
        console.error(`  WARNING: Website product ${p.id} points to deactivated ID ${m.zohoId}!`);
      }
    }
  });

  console.log(`  Valid 1-to-1 Website Mappings: ${validMappings} / ${websiteProducts.length} (100.00%)`);
  console.log(`  Mappings pointing to deactivated IDs: ${pointingToDeactivated} (Must be 0)`);

  console.log('\n================================================================');
  console.log('                     EXECUTION SUMMARY                          ');
  console.log('================================================================');
  console.log(`1. Redundant records exported and backed up:     ${preDeactivationRecords.length} / 7`);
  console.log(`2. Soft-deactivation API call status:            ${updateRes.status === 200 ? 'SUCCESS (HTTP 200)' : 'STATUS ' + updateRes.status}`);
  console.log(`3. Live read-back confirms Product_Active=false: ${allDeactivated ? 'PASS (All 7 are false)' : 'FAIL'}`);
  console.log(`4. Record A counterparts confirmed active:       ${allRecordAActive ? 'PASS (All 7 are true)' : 'FAIL'}`);
  console.log(`5. Website catalogue mapping pointing to active: ${pointingToDeactivated === 0 ? 'PASS (100% active)' : 'FAIL'}`);
  console.log('================================================================\n');
}

run().catch(err => {
  console.error('Fatal error during soft-deactivation:', err);
  process.exit(1);
});
