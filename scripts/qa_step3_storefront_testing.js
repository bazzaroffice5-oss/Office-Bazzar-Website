const https = require('https');

console.log('====================================================');
console.log('    OFFICEBAZZAR - STEP 3: STOREFRONT & PAGES QA    ');
console.log('====================================================');

function testUrl(urlPath) {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = 'https://officebazzar.com' + urlPath;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          path: urlPath,
          status: res.statusCode,
          durationMs: duration,
          sizeBytes: Buffer.byteLength(data),
          cache: res.headers['x-vercel-cache'] || 'N/A',
          body: data
        });
      });
    }).on('error', (err) => {
      resolve({ path: urlPath, status: 'ERROR', error: err.message });
    });
  });
}

async function runStorefrontTests() {
  const tests = [
    // 1. Core Listing & Pagination
    { path: '/products', desc: 'All Products (Default / Page 1)' },
    { path: '/products?page=2', desc: 'All Products (Page 2 Pagination)' },
    { path: '/products?page=10', desc: 'All Products (Page 10 Pagination)' },
    { path: '/products?page=75', desc: 'All Products (Page 75 Pagination)' },

    // 2. All 4 Category Pages
    { path: '/category/housekeeping-hygiene', desc: 'Housekeeping & Hygiene Category' },
    { path: '/category/office-stationery', desc: 'Office Stationery Category' },
    { path: '/category/packaging-supplies', desc: 'Packaging Supplies Category' },
    { path: '/category/printers-technology', desc: 'Printers & Technology Category' },

    // 3. Search Queries
    { path: '/products?search=broom', desc: 'Search Query: "broom"' },
    { path: '/products?search=trolley', desc: 'Search Query: "trolley"' },
    { path: '/products?search=tape', desc: 'Search Query: "tape"' },
    { path: '/products?search=dustbin', desc: 'Search Query: "dustbin"' },

    // 4. Brand Filter Queries
    { path: '/products?brand=brand-aristo', desc: 'Brand Filter: Aristo' },
    { path: '/products?brand=brand-gala', desc: 'Brand Filter: Gala' },
    { path: '/products?brand=brand-equal', desc: 'Brand Filter: Equal' },

    // 5. Existing Product Detail Pages
    { path: '/product/cardboard-tag-file', desc: 'PDP: Cardboard Tag File (Existing)' },
    { path: '/product/3025-box-file', desc: 'PDP: 3025 Box File (Existing)' },
    { path: '/product/ob-069-stainless-steel-pedal-dustbin', desc: 'PDP: SS Pedal Dustbin (Existing Multi-Image)' },

    // 6. Newly Created Product Detail Pages
    { path: '/product/broom-stick-plastic-ob-hou-2001', desc: 'PDP: Broom Stick Plastic (Newly Created)' },

    // 7. Standalone Gallery Decommission Check
    { path: '/supplier-gallery', desc: 'Standalone Gallery (Expect 404)' }
  ];

  console.log(`Running ${tests.length} live production endpoint tests...\n`);

  let allPassed = true;

  for (const t of tests) {
    const res = await testUrl(t.path);
    const isExpected404 = t.path === '/supplier-gallery' && res.status === 404;
    const isExpected200 = t.path !== '/supplier-gallery' && res.status === 200;
    const pass = isExpected404 || isExpected200;

    if (!pass) allPassed = false;

    const statusBadge = pass ? '[PASS]' : '[FAIL]';
    console.log(`${statusBadge} Status ${res.status} | ${t.path.padEnd(45)} | ${res.durationMs}ms | ${res.sizeBytes} bytes | ${t.desc}`);
  }

  console.log(`\nStorefront QA Status: ${allPassed ? 'ALL 18 ENDPOINTS PASSED SUCCESSFULLY!' : 'FAILED WITH ERRORS'}`);
}

runStorefrontTests();
