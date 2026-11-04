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
  // Check local token cache
  if (fs.existsSync('.zoho_token_cache.json')) {
    try {
      const cache = JSON.parse(fs.readFileSync('.zoho_token_cache.json', 'utf8'));
      if (cache.accessToken && cache.expiresAt && cache.expiresAt > Date.now() + 60000) {
        console.log('Using valid cached access token from .zoho_token_cache.json');
        return cache.accessToken;
      }
    } catch (e) {}
  }

  // Refresh token
  console.log('Refreshing Zoho CRM OAuth access token...');
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
            console.log('Obtained fresh Zoho access token.');
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

async function fetchZohoProducts(token) {
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in';
  const allRecords = [];
  let page = 1;
  let hasMore = true;

  console.log('Fetching products from Zoho CRM...');

  while (hasMore) {
    const url = `${apiDomain}/crm/v2/Products?fields=id,Product_Name,Product_Code,Unit_Price,Qty_in_Stock,Product_Active,Description,Modified_Time&page=${page}&per_page=200`;
    
    const pageData = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'User-Agent': 'OfficeBazzar-Catalog-Sync'
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

    if (pageData.status === 204 || !pageData.json?.data) {
      console.log(`Page ${page} returned status ${pageData.status} (no more records).`);
      hasMore = false;
      break;
    }

    if (pageData.status !== 200) {
      console.error(`Zoho API returned HTTP ${pageData.status}:`, pageData.json || pageData.text);
      break;
    }

    const records = pageData.json.data || [];
    allRecords.push(...records);
    console.log(`Page ${page}: Fetched ${records.length} products (Total so far: ${allRecords.length})`);

    hasMore = pageData.json.info?.more_records === true;
    page++;
    if (page > 30) break; // safety guard
  }

  return allRecords;
}

async function run() {
  try {
    const token = await getAccessToken();
    const zohoProducts = await fetchZohoProducts(token);
    console.log(`\nSUCCESS: Sourced ${zohoProducts.length} total live products from Zoho CRM.`);

    fs.writeFileSync('scripts/live_zoho_products.json', JSON.stringify(zohoProducts, null, 2));
    console.log('Saved to scripts/live_zoho_products.json');
  } catch (err) {
    console.error('ERROR during Zoho CRM fetch:', err.message);
  }
}

run();
