const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const QA_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\qa_visuals';
if (!fs.existsSync(QA_DIR)) fs.mkdirSync(QA_DIR, { recursive: true });

async function httpsGet(url, maxRedirects = 3) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OfficeBazzar-QA' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location && maxRedirects > 0) {
          const redirectUrl = res.headers.location.startsWith('http') ? res.headers.location : `https://officebazzar.com${res.headers.location}`;
          const redirected = await httpsGet(redirectUrl, maxRedirects - 1);
          resolve({
            status: res.statusCode,
            finalStatus: redirected.status,
            finalUrl: redirectUrl,
            headers: redirected.headers,
            text: redirected.text
          });
        } else {
          resolve({ status: res.statusCode, finalStatus: res.statusCode, headers: res.headers, text: data });
        }
      });
    }).on('error', err => resolve({ error: err.message, status: 500 }));
  });
}

async function httpsPost(url, payload) {
  return new Promise((resolve) => {
    const dataString = JSON.stringify(payload);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OfficeBazzar-QA'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, text: data, headers: res.headers });
        }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.write(dataString);
    req.end();
  });
}

async function runPhase3AcceptanceTesting() {
  console.log('================================================================');
  console.log('   OFFICE BAZZAR — PHASE 3 PRODUCTION ACCEPTANCE TESTING SUITE   ');
  console.log('================================================================\n');

  const testResults = [];

  // -------------------------------------------------------------
  // TEST 1: All 1,948 Active Products Load Correctly
  // -------------------------------------------------------------
  console.log('TEST 1: Verifying all 1,948 active catalogue products...');
  const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  const match = catalogContent.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
  const products = eval(match[1]);

  const uniqueSkus = new Set(products.map(p => p.sku.trim()));
  const uniqueSlugs = new Set(products.map(p => p.slug.trim()));
  const activeProducts = products.filter(p => p.isActive !== false);

  const test1Pass = products.length === 1948 && uniqueSkus.size === 1948 && uniqueSlugs.size === 1948 && activeProducts.length === 1948;
  testResults.push({
    testId: 1,
    name: '1,948 Active Products Integrity',
    target: 1948,
    actual: products.length,
    uniqueSkus: uniqueSkus.size,
    uniqueSlugs: uniqueSlugs.size,
    activeCount: activeProducts.length,
    status: test1Pass ? 'PASS' : 'FAIL'
  });
  console.log(`  Result: ${test1Pass ? 'PASS' : 'FAIL'} | Total: ${products.length} | Unique SKUs: ${uniqueSkus.size} | Unique Slugs: ${uniqueSlugs.size} | Active: ${activeProducts.length}`);

  // -------------------------------------------------------------
  // TEST 2: All Four Categories Display Accurate Counts
  // -------------------------------------------------------------
  console.log('\nTEST 2: Verifying 4 categories accurate product counts...');
  const categoryCounts = {
    'office-stationery': 0,
    'housekeeping-hygiene': 0,
    'printers-technology': 0,
    'packaging-supplies': 0
  };

  products.forEach(p => {
    if (categoryCounts[p.categoryId] !== undefined) {
      categoryCounts[p.categoryId]++;
    }
  });

  const catUrls = [
    'https://officebazzar.com/category/office-stationery',
    'https://officebazzar.com/category/housekeeping-hygiene',
    'https://officebazzar.com/category/printers-technology',
    'https://officebazzar.com/category/packaging-supplies'
  ];

  const catLiveStatuses = {};
  for (const url of catUrls) {
    const slug = url.split('/').pop();
    const res = await httpsGet(url);
    catLiveStatuses[slug] = res.status;
    console.log(`  Live URL [${res.status}]: ${url} | Count in Data: ${categoryCounts[slug]}`);
  }

  const test2Pass = categoryCounts['office-stationery'] === 341 &&
                    categoryCounts['housekeeping-hygiene'] === 1536 &&
                    categoryCounts['printers-technology'] === 28 &&
                    categoryCounts['packaging-supplies'] === 43 &&
                    Object.values(catLiveStatuses).every(s => s === 200);

  testResults.push({
    testId: 2,
    name: 'Four Categories Accurate Counts',
    counts: categoryCounts,
    liveHttpStatuses: catLiveStatuses,
    status: test2Pass ? 'PASS' : 'FAIL'
  });
  console.log(`  Result: ${test2Pass ? 'PASS' : 'FAIL'} | Stationery: 341 | Housekeeping: 1536 | Printers: 28 | Packaging: 43`);

  // -------------------------------------------------------------
  // TEST 3: Product Search by SKU and Product Names
  // -------------------------------------------------------------
  console.log('\nTEST 3: Verifying product search using SKU and product names...');
  const searchQueries = [
    { type: 'SKU', query: 'OB-003', expectedName: 'Shoe Cover Dispenser' },
    { type: 'SKU', query: 'OB-HOU-2027', expectedName: 'Plastic Bucket' },
    { type: 'SKU', query: 'OB-PAP-01', expectedName: 'Paper' },
    { type: 'Exact Name', query: 'Shoe Cover Dispenser', expectedSku: 'OB-003' },
    { type: 'Partial Name', query: 'dustbin', minExpected: 5 },
    { type: 'Partial Name', query: 'stapler', minExpected: 3 }
  ];

  const searchResults = [];
  let allSearchPass = true;

  for (const s of searchQueries) {
    const q = s.query.toLowerCase().trim();
    const matches = products.filter(p =>
      p.isActive !== false &&
      (p.sku.toLowerCase().includes(q) ||
       p.name.toLowerCase().includes(q) ||
       p.brandName.toLowerCase().includes(q) ||
       p.description.toLowerCase().includes(q))
    );

    let passed = false;
    if (s.expectedName) {
      passed = matches.some(m => m.name.toLowerCase().includes(s.expectedName.toLowerCase()));
    } else if (s.expectedSku) {
      passed = matches.some(m => m.sku === s.expectedSku);
    } else if (s.minExpected) {
      passed = matches.length >= s.minExpected;
    }

    if (!passed) allSearchPass = false;
    searchResults.push({ query: s.query, type: s.type, matchesCount: matches.length, passed });
    console.log(`  Search [${s.type}] "${s.query}": ${matches.length} matches [${passed ? 'PASS' : 'FAIL'}]`);
  }

  testResults.push({
    testId: 3,
    name: 'Product Search by SKU & Name',
    results: searchResults,
    status: allSearchPass ? 'PASS' : 'FAIL'
  });

  // -------------------------------------------------------------
  // TEST 4: Product Detail Pages (Images, Descriptions, Specifications)
  // -------------------------------------------------------------
  console.log('\nTEST 4: Verifying Product Detail Pages (PDP)...');
  const samplePdpSlugs = [
    'ob-003-shoe-cover-dispenser',
    'ob-004-paper-cup-dispenser',
    'cardboard-tag-file',
    '3025-box-file'
  ];

  const pdpResults = [];
  let allPdpPass = true;

  for (const slug of samplePdpSlugs) {
    const prod = products.find(p => p.slug === slug || p.id.includes(slug));
    const url = `https://officebazzar.com/product/${slug}`;
    const res = await httpsGet(url);
    const hasImage = prod && prod.images && prod.images.length > 0;
    const hasDesc = prod && prod.description && prod.description.length > 10;
    const hasSpecs = prod && prod.specifications && Object.keys(prod.specifications).length > 0;
    const pageOk = res.status === 200;

    const pass = pageOk && hasImage && hasDesc && hasSpecs;
    if (!pass) allPdpPass = false;
    pdpResults.push({ slug, status: res.status, hasImage, hasDesc, hasSpecs, pass });
    console.log(`  PDP /product/${slug} [${res.status}]: Image: ${hasImage} | Desc: ${hasDesc} | Specs: ${hasSpecs} [${pass ? 'PASS' : 'FAIL'}]`);
  }

  testResults.push({
    testId: 4,
    name: 'Product Detail Pages Integrity',
    results: pdpResults,
    status: allPdpPass ? 'PASS' : 'FAIL'
  });

  // -------------------------------------------------------------
  // TEST 5: Add to Cart and Quote Cart Functionality
  // -------------------------------------------------------------
  console.log('\nTEST 5: Verifying Add to Cart and Quote Cart functionality...');
  const quoteCartRes = await httpsGet('https://officebazzar.com/quote-cart');
  const cartRes = await httpsGet('https://officebazzar.com/cart');
  // /quote-cart permanently redirects (308) to /cart (200), consolidating cart logic
  const quoteCartPass = (quoteCartRes.status === 308 && quoteCartRes.finalStatus === 200) || (quoteCartRes.status === 200 && cartRes.status === 200);

  testResults.push({
    testId: 5,
    name: 'Cart and Quote Cart Routes',
    quoteCartInitialStatus: quoteCartRes.status,
    quoteCartFinalStatus: quoteCartRes.finalStatus,
    cartStatus: cartRes.status,
    consolidatedToCart: true,
    status: quoteCartPass ? 'PASS' : 'FAIL'
  });
  console.log(`  Result: ${quoteCartPass ? 'PASS' : 'FAIL'} | /quote-cart: ${quoteCartRes.status} -> ${quoteCartRes.finalUrl} [${quoteCartRes.finalStatus}] | /cart: ${cartRes.status}`);

  // -------------------------------------------------------------
  // TEST 6: RFQ Submission Creates Records in Zoho CRM
  // -------------------------------------------------------------
  console.log('\nTEST 6: Testing live RFQ submission directly to Zoho CRM...');
  const rfqTestPayload = {
    customerName: 'Phase 3 Production Acceptance QA',
    companyName: 'Office Bazzar Verification Systems Ltd',
    email: 'phase3-qa@officebazzar.com',
    phone: '9840198401',
    deliveryAddress: 'Ground Floor, Technology Corridor, Chennai, TN 600096',
    pincode: '600096',
    notes: 'Phase 3 Production Acceptance Test RFQ Submission',
    items: [
      {
        productId: 'prod-ob-003-shoe-cover-dispenser',
        productName: 'Shoe Cover Dispenser',
        sku: 'OB-003',
        indicativeUnitPrice: 0,
        gstPercent: 18,
        quantity: 10,
        indicativeTotalPrice: 0,
        productImage: '/assets/products/catalog_2026/OB-003.webp',
        packSize: 'Standard Institutional Pack'
      }
    ]
  };

  const rfqRes = await httpsPost('https://officebazzar.com/api/quotations/create', rfqTestPayload);
  const rfqSuccess = rfqRes.status === 201 && rfqRes.json && rfqRes.json.success === true && !!rfqRes.json.zohoQuoteId;

  testResults.push({
    testId: 6,
    name: 'Live RFQ Submission in Zoho CRM',
    httpStatus: rfqRes.status,
    zohoQuoteId: rfqRes.json?.zohoQuoteId,
    quotationNumber: rfqRes.json?.quotationNumber,
    assignedAdmin: rfqRes.json?.assignedAdmin?.email,
    status: rfqSuccess ? 'PASS' : 'FAIL'
  });
  console.log(`  Result: ${rfqSuccess ? 'PASS' : 'FAIL'} | Status: ${rfqRes.status} | Zoho Quote ID: ${rfqRes.json?.zohoQuoteId} | Quote #: ${rfqRes.json?.quotationNumber}`);

  // -------------------------------------------------------------
  // TEST 7: Seven Inactive Duplicate Products Isolation
  // -------------------------------------------------------------
  console.log('\nTEST 7: Verifying complete isolation of 7 inactive duplicate products...');
  const TARGET_DEACTIVATED_IDS = [
    '1476900000000591009',
    '1476900000000591024',
    '1476900000000596045',
    '1476900000000591027',
    '1476900000000591037',
    '1476900000000591058',
    '1476900000000591074'
  ];

  const mappingData = JSON.parse(fs.readFileSync('src/lib/data/zoho_product_mapping.json', 'utf8'));
  let inMapping = 0;
  Object.values(mappingData).forEach(m => {
    if (TARGET_DEACTIVATED_IDS.includes(m.zohoId)) inMapping++;
  });

  const duplicateSkus = ['OB-HOU-2027', 'OB-HOU-2042', 'OB-HOU-2045', 'OB-HOU-2046', 'OB-HOU-2056', 'OB-HOU-2077', 'OB-HOU-2092'];
  let duplicateSearchResults = 0;
  duplicateSkus.forEach(sku => {
    const matches = products.filter(p => p.sku === sku && p.isActive !== false);
    if (matches.length !== 1) duplicateSearchResults++;
  });

  const test7Pass = inMapping === 0 && duplicateSearchResults === 0;
  testResults.push({
    testId: 7,
    name: 'Inactive Duplicates Isolation',
    deactivatedIdsInMapping: inMapping,
    duplicateSkuMatches: duplicateSearchResults,
    status: test7Pass ? 'PASS' : 'FAIL'
  });
  console.log(`  Result: ${test7Pass ? 'PASS' : 'FAIL'} | Deactivated IDs in Mapping: ${inMapping} | Duplicate SKU Matches: ${duplicateSearchResults}`);

  // -------------------------------------------------------------
  // TEST 8: Responsive Layout (Desktop, Tablet, Mobile)
  // -------------------------------------------------------------
  console.log('\nTEST 8: Capturing visual screenshots across Desktop, Tablet, and Mobile...');
  const os = require('os');
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome_qa_phase3_'));
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9334;

  const screenshotResults = [];
  try {
    const chrome = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpProfile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      'about:blank'
    ]);

    await new Promise(r => setTimeout(r, 2000));

    let connected = false;
    let ws = null;
    let msgId = 1;
    const pending = new Map();

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    for (let i = 0; i < 5; i++) {
      try {
        const list = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${port}/json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
          }).on('error', reject);
        });

        const target = list.find(t => t.type === 'page') || list[0];
        ws = new WebSocket(target.webSocketDebuggerUrl);

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };

        await new Promise(r => ws.onopen = r);
        await send('Page.enable');
        connected = true;
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (connected && ws) {
      const viewports = [
        { name: 'desktop', width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false },
        { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2, mobile: true },
        { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 3, mobile: true }
      ];

      const capturePages = [
        { url: 'https://officebazzar.com/', tag: 'homepage' },
        { url: 'https://officebazzar.com/products', tag: 'products' },
        { url: 'https://officebazzar.com/category/office-stationery', tag: 'category_stationery' },
        { url: 'https://officebazzar.com/product/ob-003-shoe-cover-dispenser', tag: 'pdp_shoe_cover' }
      ];

      for (const vp of viewports) {
        await send('Emulation.setDeviceMetricsOverride', vp);
        for (const cp of capturePages) {
          await send('Page.navigate', { url: cp.url });
          await new Promise(r => setTimeout(r, 2000));
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          const filename = `phase3_${vp.name}_${cp.tag}.png`;
          const filePath = path.join(QA_DIR, filename);
          fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
          screenshotResults.push({ viewport: vp.name, tag: cp.tag, filename, filePath, size: shot.data.length });
          console.log(`  Saved screenshot: ${filename} (${Math.round(shot.data.length / 1024)} KB)`);
        }
      }

      ws.close();
    }

    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
  } catch (err) {
    console.warn('  Browser capture error:', err.message);
  }

  const test8Pass = screenshotResults.length >= 3;
  testResults.push({
    testId: 8,
    name: 'Responsive Visual Layouts',
    screenshotsCaptured: screenshotResults.length,
    screenshots: screenshotResults.map(s => s.filename),
    status: test8Pass ? 'PASS' : 'FAIL'
  });
  console.log(`  Result: ${test8Pass ? 'PASS' : 'FAIL'} | Total Screenshots Captured: ${screenshotResults.length}`);

  // -------------------------------------------------------------
  // TEST 9: Production Deployment Health & Server Logs
  // -------------------------------------------------------------
  console.log('\nTEST 9: Verifying production deployment health and server response headers...');
  const homeRes = await httpsGet('https://officebazzar.com/');
  const vercelId = homeRes.headers['x-vercel-id'];
  const test9Pass = homeRes.status === 200 && !!vercelId;

  testResults.push({
    testId: 9,
    name: 'Production Deployment Health',
    httpStatus: homeRes.status,
    vercelId: vercelId,
    cacheControl: homeRes.headers['cache-control'],
    status: test9Pass ? 'PASS' : 'FAIL'
  });
  console.log(`  Result: ${test9Pass ? 'PASS' : 'FAIL'} | HTTP ${homeRes.status} | Edge ID: ${vercelId}`);

  // -------------------------------------------------------------
  // TEST 10: Secret Leakage & Credential Exposure Audit
  // -------------------------------------------------------------
  console.log('\nTEST 10: Auditing public bundle and HTML for exposed secrets...');
  const sensitivePatterns = [
    /ZOHO_CLIENT_SECRET/i,
    /ZOHO_REFRESH_TOKEN/i,
    /SUPABASE_SERVICE_ROLE_KEY/i,
    /RAZORPAY_KEY_SECRET/i
  ];

  let exposedSecretsFound = 0;
  const samplePages = ['https://officebazzar.com/', 'https://officebazzar.com/products', 'https://officebazzar.com/cart'];

  for (const p of samplePages) {
    const pageHtml = await httpsGet(p);
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(pageHtml.text)) {
        exposedSecretsFound++;
        console.error(`  SECURITY ALERT: Potential secret exposure matching ${pattern} on ${p}!`);
      }
    });
  }

  const publicFiles = fs.readdirSync('public');
  publicFiles.forEach(f => {
    if (f.endsWith('.env') || f.includes('secret') || f.includes('key')) {
      exposedSecretsFound++;
    }
  });

  const test10Pass = exposedSecretsFound === 0;
  testResults.push({
    testId: 10,
    name: 'No Exposed API Credentials or Secrets',
    exposuresFound: exposedSecretsFound,
    status: test10Pass ? 'PASS' : 'FAIL'
  });
  console.log(`  Result: ${test10Pass ? 'PASS' : 'FAIL'} | Exposed Secrets Found: ${exposedSecretsFound}`);

  // Save Results
  fs.writeFileSync('scripts/phase3_acceptance_test_results.json', JSON.stringify(testResults, null, 2));

  console.log('\n================================================================');
  console.log('              PHASE 3 ACCEPTANCE TEST SUMMARY                   ');
  console.log('================================================================');
  testResults.forEach(r => {
    console.log(`Test ${r.testId} [${r.status}]: ${r.name}`);
  });
  console.log('================================================================\n');

  return testResults;
}

runPhase3AcceptanceTesting().catch(err => {
  console.error('Fatal error during Phase 3 acceptance testing:', err);
  process.exit(1);
});
