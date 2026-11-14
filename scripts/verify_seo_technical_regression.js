const http = require('http');
const fs = require('fs');
const path = require('path');

const results = {
  robotsTxt: {},
  sitemapXml: {},
  canonicalTags: {},
  pagination: {},
  redirectsAndErrors: {},
  structuredData: {},
  googlebotAccess: {},
  mobileRendering: {},
  summary: { passed: 0, failed: 0 }
};

function pass(category, testName, details) {
  results[category][testName] = { status: 'PASSED', details };
  results.summary.passed++;
  console.log(`[PASS] [${category}] ${testName}: ${details}`);
}

function fail(category, testName, details) {
  results[category][testName] = { status: 'FAILED', details };
  results.summary.failed++;
  console.error(`[FAIL] [${category}] ${testName}: ${details}`);
}

function fetch(urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== STARTING TECHNICAL SEO REGRESSION SUITE ===\n');

  // 1. Robots.txt
  try {
    const res = await fetch('/robots.txt');
    if (res.status === 200 && res.body.includes('Sitemap: https://officebazzar.com/sitemap.xml')) {
      pass('robotsTxt', 'sitemapDeclaration', 'robots.txt exists, returns 200, and declares sitemap.xml');
    } else {
      fail('robotsTxt', 'sitemapDeclaration', `Status: ${res.status}, body length: ${res.body.length}`);
    }

    if (res.body.includes('Disallow: /admin') && res.body.includes('Disallow: /checkout') && res.body.includes('Disallow: /cart')) {
      pass('robotsTxt', 'privatePathsDisallowed', 'Private administrative and checkout routes are properly disallowed');
    } else {
      fail('robotsTxt', 'privatePathsDisallowed', 'Missing expected disallow paths');
    }

    if (res.body.toUpperCase().includes('USER-AGENT: GOOGLEBOT') && res.body.includes('Allow: /')) {
      pass('robotsTxt', 'googlebotRules', 'Googlebot is explicitly allowed full access to crawlable public routes');
    } else {
      fail('robotsTxt', 'googlebotRules', 'Googlebot block or missing allow rule');
    }
  } catch (err) {
    fail('robotsTxt', 'execution', err.message);
  }

  // 2. Sitemap.xml
  try {
    const res = await fetch('/sitemap.xml');
    if (res.status === 200) {
      const urlCount = (res.body.match(/<url>/g) || []).length;
      pass('sitemapXml', 'availabilityAndSize', `sitemap.xml returns 200 with ${urlCount} total entries`);
      
      const containsTissueRedirect = res.body.includes('/product/tissue-paper-napkin-1');
      if (!containsTissueRedirect) {
        pass('sitemapXml', 'noRedirectsInSitemap', 'Redirected SKU OB-TIS-1096 (tissue-paper-napkin-1) is excluded from sitemap');
      } else {
        fail('sitemapXml', 'noRedirectsInSitemap', 'Sitemap contains redirecting URL tissue-paper-napkin-1');
      }

      const containsCanonicalTissue = res.body.includes('/product/tissue-paper-napkin</loc>');
      if (containsCanonicalTissue) {
        pass('sitemapXml', 'canonicalTissueIncluded', 'Canonical partner /product/tissue-paper-napkin is included');
      } else {
        fail('sitemapXml', 'canonicalTissueIncluded', 'Canonical partner /product/tissue-paper-napkin is missing');
      }
    } else {
      fail('sitemapXml', 'availabilityAndSize', `Status: ${res.status}`);
    }
  } catch (err) {
    fail('sitemapXml', 'execution', err.message);
  }

  // 3. Canonical Tags on Representative Routes
  const testRoutes = [
    { path: '/', expectedRegex: /^https:\/\/officebazzar\.com\/?$/ },
    { path: '/products', expectedRegex: /^https:\/\/officebazzar\.com\/products$/ },
    { path: '/category/housekeeping-hygiene', expectedRegex: /^https:\/\/officebazzar\.com\/category\/housekeeping-hygiene$/ },
    { path: '/product/ob-060-cloth-washing-brush', expectedRegex: /^https:\/\/officebazzar\.com\/product\/ob-060-cloth-washing-brush$/ },
  ];

  for (const tr of testRoutes) {
    try {
      const res = await fetch(tr.path);
      const match = res.body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
      const canonical = match ? match[1] : null;
      if (canonical && tr.expectedRegex.test(canonical)) {
        pass('canonicalTags', `canonical_${tr.path}`, `Canonical matches valid target: ${canonical}`);
      } else {
        fail('canonicalTags', `canonical_${tr.path}`, `Expected regex: ${tr.expectedRegex}, Got: ${canonical}`);
      }
    } catch (err) {
      fail('canonicalTags', `canonical_${tr.path}`, err.message);
    }
  }

  // 4. Pagination Links
  try {
    const res = await fetch('/products?page=2');
    const match = res.body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
    const canonical = match ? match[1] : null;
    if (canonical === 'https://officebazzar.com/products?page=2') {
      pass('pagination', 'paginationCanonical', 'Paginated route /products?page=2 points canonical cleanly to self per Google guidelines');
    } else {
      fail('pagination', 'paginationCanonical', `Expected self canonical https://officebazzar.com/products?page=2, got: ${canonical}`);
    }
  } catch (err) {
    fail('pagination', 'execution', err.message);
  }

  // 5. Redirects and 404 Checks
  try {
    const resRedirect = await fetch('/product/tissue-paper-napkin-1');
    if (resRedirect.status === 308 && resRedirect.headers.location === '/product/tissue-paper-napkin') {
      pass('redirectsAndErrors', 'duplicateProductRedirect', 'tissue-paper-napkin-1 properly redirects with 308 to /product/tissue-paper-napkin');
    } else {
      fail('redirectsAndErrors', 'duplicateProductRedirect', `Status: ${resRedirect.status}, Location: ${resRedirect.headers.location}`);
    }

    const resInactive = await fetch('/product/kangaro-staplers-hd-10d');
    if (resInactive.status === 404) {
      pass('redirectsAndErrors', 'inactiveProduct404', 'Inactive SKU OB-STA-1009 properly returns 404 Not Found');
    } else {
      fail('redirectsAndErrors', 'inactiveProduct404', `Status: ${resInactive.status}`);
    }

    const resLegacy = await fetch('/category/office-supplies-stationery');
    if (resLegacy.status === 308 && resLegacy.headers.location === '/category/office-stationery') {
      pass('redirectsAndErrors', 'legacyCategoryRedirect', 'Legacy category redirects with 308 to /category/office-stationery');
    } else {
      fail('redirectsAndErrors', 'legacyCategoryRedirect', `Status: ${resLegacy.status}, Location: ${resLegacy.headers.location}`);
    }
  } catch (err) {
    fail('redirectsAndErrors', 'execution', err.message);
  }

  // 6. Structured Data
  try {
    const resPdp = await fetch('/product/ob-060-cloth-washing-brush');
    const jsonLdBlocks = resPdp.body.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    let hasProductSchema = false;
    let hasBreadcrumbSchema = false;
    let hasOrgSchema = false;
    let hasWebSiteSchema = false;

    for (const block of jsonLdBlocks) {
      const content = block.replace(/<\/?script[^>]*>/g, '').trim();
      try {
        const parsed = JSON.parse(content);
        if (parsed['@type'] === 'Product') hasProductSchema = true;
        if (parsed['@type'] === 'BreadcrumbList') hasBreadcrumbSchema = true;
        if (parsed['@type'] === 'Organization') hasOrgSchema = true;
        if (parsed['@type'] === 'WebSite') hasWebSiteSchema = true;
      } catch {}
    }

    if (hasProductSchema && hasBreadcrumbSchema && hasOrgSchema && hasWebSiteSchema) {
      pass('structuredData', 'allSchemasPresent', 'Valid JSON-LD schemas found: Product, BreadcrumbList, Organization, WebSite');
    } else {
      fail('structuredData', 'allSchemasPresent', `Product: ${hasProductSchema}, Breadcrumb: ${hasBreadcrumbSchema}, Org: ${hasOrgSchema}, WebSite: ${hasWebSiteSchema}`);
    }
  } catch (err) {
    fail('structuredData', 'execution', err.message);
  }

  // 7. Googlebot Access
  try {
    const resGooglebot = await fetch('/product/ob-060-cloth-washing-brush', {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    });
    if (resGooglebot.status === 200 && resGooglebot.body.includes('Cloth Washing Brush')) {
      pass('googlebotAccess', 'googlebotAllowed', 'Googlebot receives 200 OK with full server-rendered HTML');
    } else {
      fail('googlebotAccess', 'googlebotAllowed', `Status: ${resGooglebot.status}`);
    }
  } catch (err) {
    fail('googlebotAccess', 'execution', err.message);
  }

  // 8. Mobile Rendering
  try {
    const resMobile = await fetch('/');
    const viewportMatch = resMobile.body.match(/<meta[^>]+name="viewport"[^>]+content="([^"]+)"/);
    if (viewportMatch && viewportMatch[1].includes('width=device-width')) {
      pass('mobileRendering', 'metaViewport', `Valid responsive viewport configured: ${viewportMatch[1]}`);
    } else {
      fail('mobileRendering', 'metaViewport', `Viewport missing or invalid: ${viewportMatch ? viewportMatch[1] : 'None'}`);
    }
  } catch (err) {
    fail('mobileRendering', 'execution', err.message);
  }

  console.log(`\n=== TECHNICAL REGRESSION AUDIT FINISHED: ${results.summary.passed} PASSED, ${results.summary.failed} FAILED ===`);
  
  const artifactDir = path.join(process.cwd(), 'artifacts');
  fs.writeFileSync(path.join(artifactDir, 'technical_seo_regression_results.json'), JSON.stringify(results, null, 2), 'utf8');
}

run();
