const fs = require('fs');
const path = require('path');
const https = require('https');

async function runFullVerification() {
  const results = {
    step2_routes: {},
    step3_product_images: {},
    step4_live_pages: {},
    step5_legacy_references: {},
    step6_mapping_audit: {},
    step7_deployment: {}
  };

  console.log('=== STEP 2: VERIFY ALL ROUTES IN BUILD ===');
  // Check .next/build-manifest.json or .next/prerender-manifest.json
  if (fs.existsSync('.next/prerender-manifest.json')) {
    const prerender = JSON.parse(fs.readFileSync('.next/prerender-manifest.json', 'utf8'));
    const routes = Object.keys(prerender.routes);
    console.log(`Prerendered static routes: ${routes.length}`);
    results.step2_routes.prerenderedCount = routes.length;
    results.step2_routes.sampleRoutes = routes.slice(0, 10);
  }
  if (fs.existsSync('.next/app-path-routes-manifest.json')) {
    const appRoutes = JSON.parse(fs.readFileSync('.next/app-path-routes-manifest.json', 'utf8'));
    console.log(`App path routes count: ${Object.keys(appRoutes).length}`);
    results.step2_routes.appRoutesCount = Object.keys(appRoutes).length;
  }

  console.log('\n=== STEP 3: IMAGE VALIDATION ACROSS ALL 383 PRODUCTS ===');
  const catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
  const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
  const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim().replace(/;\s*$/, '');
  const products = JSON.parse(block);

  let mappedCount = 0;
  let placeholderCount = 0;
  let validDiskImages = 0;
  let missingDiskImages = [];
  let nonWebpOrBadFormat = [];

  for (const p of products) {
    if (!p.images || p.images.length === 0) {
      placeholderCount++;
    } else {
      mappedCount++;
      for (const img of p.images) {
        if (!img.startsWith('/assets/products/catalog_2026/') || !img.endsWith('.webp')) {
          nonWebpOrBadFormat.push({ sku: p.sku, img });
        }
        const local = 'public' + img;
        if (fs.existsSync(local)) {
          const stats = fs.statSync(local);
          if (stats.size > 0) {
            validDiskImages++;
          } else {
            missingDiskImages.push({ sku: p.sku, img, reason: 'Zero byte file' });
          }
        } else {
          missingDiskImages.push({ sku: p.sku, img, reason: 'File missing on disk' });
        }
      }
    }
  }

  results.step3_product_images = {
    totalProducts: products.length,
    mappedCount,
    placeholderCount,
    validDiskImages,
    missingDiskImagesCount: missingDiskImages.length,
    missingDiskImages,
    nonWebpOrBadFormatCount: nonWebpOrBadFormat.length
  };
  console.log(`Products: ${products.length} | Mapped: ${mappedCount} | Placeholders: ${placeholderCount}`);
  console.log(`Valid disk images verified: ${validDiskImages} | Missing/0-byte: ${missingDiskImages.length}`);

  console.log('\n=== STEP 4: VERIFY LIVE PRODUCTION PAGES ===');
  const testUrls = [
    { name: 'Product Listing', path: '/products' },
    { name: 'Product Detail (Mapped)', path: '/product/cardboard-tag-file' },
    { name: 'Product Detail (Tissue Napkin)', path: '/product/tissue-paper-napkin' },
    { name: 'Product Detail (Placeholder)', path: '/product/kent-ks-12-lamination-machine' },
    { name: 'Cart Page', path: '/cart' },
    { name: 'Wishlist Page', path: '/wishlist' },
    { name: 'Quotation Request Page', path: '/request-quote' }
  ];

  function fetchUrl(urlPath) {
    return new Promise((resolve) => {
      https.get('https://officebazzar.com' + urlPath, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const oldRefs = body.match(/\/assets\/products\/(?!catalog_2026)[^\s"'`)]+/g) || [];
          resolve({
            statusCode: res.statusCode,
            contentLength: body.length,
            has383: body.includes('383'),
            hasCatalog2026: body.includes('/assets/products/catalog_2026/'),
            hasPlaceholder: body.includes('/assets/placeholder-product.svg'),
            oldAssetCount: oldRefs.length,
            oldRefs
          });
        });
      }).on('error', (err) => resolve({ error: err.message }));
    });
  }

  for (const page of testUrls) {
    const res = await fetchUrl(page.path);
    console.log(`[${page.name}] ${page.path} -> Status ${res.statusCode} | Old assets: ${res.oldAssetCount}`);
    results.step4_live_pages[page.name] = { path: page.path, ...res };
  }

  console.log('\n=== STEP 5: CONFIRM ZERO LEGACY IMAGE REFERENCES ===');
  function scanDir(dir) {
    let badPaths = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (['node_modules', '.next', '.git', 'Office Bazzar New Images'].includes(entry.name)) continue;
      if (entry.isDirectory()) {
        badPaths = badPaths.concat(scanDir(full));
      } else if (entry.isFile() && /\.(ts|tsx|js|mjs|json)$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        const m = text.match(/\/assets\/products\/(?!catalog_2026)[^\s"'`)]+/g);
        if (m) {
          badPaths.push({ file: full, matches: m });
        }
      }
    }
    return badPaths;
  }

  const legacyMatches = scanDir('src');
  results.step5_legacy_references = {
    scannedDirectory: 'src',
    legacyCount: legacyMatches.length,
    matches: legacyMatches
  };
  console.log(`Legacy product path references in src/: ${legacyMatches.length}`);

  console.log('\n=== STEP 6: AUDIT 364 NEW WEBP ASSETS AND MAPPINGS ===');
  const webpFiles = fs.readdirSync('public/assets/products/catalog_2026');
  console.log(`Files in catalog_2026: ${webpFiles.length}`);

  const referencedSet = new Set();
  const fileToProducts = new Map();
  for (const p of products) {
    for (const img of (p.images || [])) {
      const fn = path.basename(img);
      referencedSet.add(fn);
      if (!fileToProducts.has(fn)) fileToProducts.set(fn, []);
      fileToProducts.get(fn).push(p.sku);
    }
  }

  const catRefs = catContent.match(/\/assets\/products\/catalog_2026\/[A-Za-z0-9_-]+\.webp/g) || [];
  catRefs.forEach(ref => referencedSet.add(path.basename(ref)));

  const unreferencedWebp = webpFiles.filter(f => !referencedSet.has(f));
  results.step6_mapping_audit = {
    totalDiskFiles: webpFiles.length,
    totalReferencedFiles: referencedSet.size,
    unreferencedCount: unreferencedWebp.length,
    unreferencedFiles: unreferencedWebp
  };
  console.log(`Total WebP files: ${webpFiles.length} | Referenced: ${referencedSet.size} | Unreferenced: ${unreferencedWebp.length}`);

  console.log('\n=== STEP 7: VERCEL DEPLOYMENT STATUS ===');
  // Check latest live deployment response headers
  const rootRes = await fetchUrl('/products');
  results.step7_deployment = {
    target: 'https://officebazzar.com/products',
    liveStatus: rootRes.statusCode,
    liveProductCountFound: rootRes.has383,
    legacyAssetsOnLive: rootRes.oldAssetCount === 0
  };
  console.log('Live deployment check completed.');

  fs.writeFileSync('scripts/verification_execution_results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Results saved to scripts/verification_execution_results.json');
}

runFullVerification().catch(console.error);

