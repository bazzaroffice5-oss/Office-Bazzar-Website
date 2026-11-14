const http = require('http');

async function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3099' + path, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    }).on('error', reject);
  });
}

async function verify() {
  console.log('=== VERIFYING PHASE 2B SEO & FUNCTIONALITY ===\n');

  // 1. Sitemap Check
  const sitemapRes = await get('/sitemap.xml');
  const sitemapProductMatches = (sitemapRes.body.match(/<loc>https:\/\/www\.officebazzar\.com\/product\/[a-z0-9_-]+<\/loc>/gi) || []);
  console.log(`[SITEMAP] Status: ${sitemapRes.status} | Total Products in sitemap.xml: ${sitemapProductMatches.length}`);

  // 2. Robots.txt Check
  const robotsRes = await get('/robots.txt');
  console.log(`[ROBOTS] Status: ${robotsRes.status} | Contains Sitemap: ${robotsRes.body.includes('sitemap.xml')}`);

  // 3. Canonical Tags Check
  const p1 = await get('/products');
  const p1Canonical = (p1.body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i) || [])[1];
  console.log(`[CANONICAL /products] -> ${p1Canonical}`);

  const p2 = await get('/products?page=2');
  const p2Canonical = (p2.body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i) || [])[1];
  console.log(`[CANONICAL /products?page=2] -> ${p2Canonical}`);

  const catRes = await get('/category/office-stationery');
  const catCanonical = (catRes.body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i) || [])[1];
  console.log(`[CANONICAL /category/office-stationery] -> ${catCanonical}`);

  const catSubRes = await get('/category/office-stationery?sub=paper-notebooks');
  const catSubCanonical = (catSubRes.body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i) || [])[1];
  console.log(`[CANONICAL /category/office-stationery?sub=paper-notebooks] -> ${catSubCanonical}`);

  // 4. Crawlable Pagination Links on /products
  const p1PaginationLinks = (p1.body.match(/href="\/products\?page=[0-9]+"/gi) || []);
  console.log(`[PAGINATION LINKS /products] Found crawlable links: ${p1PaginationLinks.slice(0, 5).join(', ')} (Total: ${p1PaginationLinks.length})`);

  // 5. Crawlable Pagination Links on /category/[slug]?sub=...
  const catPaginationLinks = (catSubRes.body.match(/href="\/category\/office-stationery\?[^"]*page=[0-9]+"/gi) || []);
  console.log(`[PAGINATION LINKS /category/office-stationery?sub=paper-notebooks] Found crawlable links: ${catPaginationLinks.join(', ')}`);

  // 6. Check Product Detail Page
  const firstProductHref = (p1.body.match(/\/product\/[a-z0-9_-]+/i) || [])[0];
  if (firstProductHref) {
    const prodRes = await get(firstProductHref);
    const prodCanonical = (prodRes.body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i) || [])[1];
    const hasSchema = prodRes.body.includes('application/ld+json');
    console.log(`[PRODUCT DETAIL ${firstProductHref}] Status: ${prodRes.status} | Canonical: ${prodCanonical} | Has Schema: ${hasSchema}`);
  }

  // 7. Check Brand & Search Filter
  const searchRes = await get('/products?query=stapler');
  console.log(`[SEARCH /products?query=stapler] Status: ${searchRes.status} | HTML size: ${(Buffer.byteLength(searchRes.body) / 1024).toFixed(2)} KB`);

  console.log('\n=== ALL SEO & FUNCTIONAL CHECKS COMPLETE ===');
}

verify();
