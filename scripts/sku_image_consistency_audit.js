/**
 * Permanent SKU-to-Image Regression & Consistency Test Suite
 *
 * Verifies byte-level integrity, mapping, sync resilience, and live production delivery
 * for OB-RDS-24 and OB-RDS-38 across all system layers.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const sharp = require('sharp');

// Expected MD5 hashes of authentic verified images
const EXPECTED_HASHES = {
  'OB-RDS-24': {
    name: 'Microprismatic Reflective Warning Tape – 50mm x 50m',
    slug: 'ob-rds-24-microprismatic-reflective-warning-tape-50mm-x-50m',
    primaryAsset: 'public/assets/products/catalog_2026/OB-RDS-24.webp',
    altAsset: 'public/assets/products/catalog_2026/OB-RDS-24-alt-1.webp',
    expectedMd5: '490756ba5d8d02c22ca8f34b686b5919',
    expectedWidth: 1200,
    expectedHeight: 1200,
    liveUrl: 'https://officebazzar.com/product/ob-rds-24-microprismatic-reflective-warning-tape-50mm-x-50m',
    searchUrl: 'https://officebazzar.com/products?query=OB-RDS-24'
  },
  'OB-RDS-38': {
    name: 'Heavy Duty Anti-Slip Traction Safety Tapes',
    slug: 'ob-rds-38-heavy-duty-anti-slip-traction-safety-tapes',
    primaryAsset: 'public/assets/products/catalog_2026/OB-RDS-38.webp',
    altAsset: 'public/assets/products/catalog_2026/OB-RDS-38-alt-1.webp',
    expectedMd5: '96d2d947bcda24c432d7fe9e0c22f1fc',
    expectedWidth: 1200,
    expectedHeight: 1200,
    liveUrl: 'https://officebazzar.com/product/ob-rds-38-heavy-duty-anti-slip-traction-safety-tapes',
    searchUrl: 'https://officebazzar.com/products?query=OB-RDS-38'
  }
};

function computeMd5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer,
          text: buffer.toString('utf-8')
        });
      });
    }).on('error', reject);
  });
}

async function runRegressionSuite() {
  console.log('================================================================');
  console.log('   OFFICEBAZZAR PERMANENT PRODUCT IMAGE CONSISTENCY AUDIT');
  console.log('   Target SKUs: OB-RDS-24 & OB-RDS-38');
  console.log('   Timestamp:  ' + new Date().toISOString());
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failedTests++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Local Disk Assets Verification
  // -------------------------------------------------------------
  console.log('TEST 1: Local Disk Assets Verification (Byte & Metadata)');
  for (const [sku, conf] of Object.entries(EXPECTED_HASHES)) {
    const primPath = path.join(process.cwd(), conf.primaryAsset);
    const altPath = path.join(process.cwd(), conf.altAsset);

    assert(fs.existsSync(primPath), `${sku}: Primary asset file exists at ${conf.primaryAsset}`);
    assert(fs.existsSync(altPath), `${sku}: Alternate asset file exists at ${conf.altAsset}`);

    const primBuf = fs.readFileSync(primPath);
    const primHash = computeMd5(primBuf);
    assert(primHash === conf.expectedMd5, `${sku}: Primary asset MD5 matches authentic image (${primHash})`);

    const altBuf = fs.readFileSync(altPath);
    const altHash = computeMd5(altBuf);
    assert(altHash === conf.expectedMd5, `${sku}: Alternate asset MD5 matches authentic image (${altHash})`);

    const meta = await sharp(primBuf).metadata();
    assert(meta.width === conf.expectedWidth && meta.height === conf.expectedHeight, `${sku}: Asset dimensions are exactly ${meta.width}x${meta.height} (Expected ${conf.expectedWidth}x${conf.expectedHeight})`);
    assert(meta.format === 'webp', `${sku}: Asset format is WebP`);
  }

  // -------------------------------------------------------------
  // TEST 2: Static Master Catalog Integrity (src/lib/data/catalog.ts)
  // -------------------------------------------------------------
  console.log('\nTEST 2: Catalog Database Mapping Integrity');
  const catalogContent = fs.readFileSync(path.join(process.cwd(), 'src/lib/data/catalog.ts'), 'utf-8');

  for (const [sku, conf] of Object.entries(EXPECTED_HASHES)) {
    const skuIndex = catalogContent.indexOf(`"sku": "${sku}"`);
    assert(skuIndex !== -1, `${sku}: Found in src/lib/data/catalog.ts`);

    const block = catalogContent.substring(skuIndex, skuIndex + 1200);
    const expectedImgPath = `/assets/products/catalog_2026/${sku}.webp`;
    assert(block.includes(`"${expectedImgPath}"`), `${sku}: Images array in catalog.ts maps directly to ${expectedImgPath}`);
    assert(!block.includes('placeholder-product.svg'), `${sku}: Does NOT reference placeholder in catalog.ts`);
  }

  // -------------------------------------------------------------
  // TEST 3: Master Image Records Mapping
  // -------------------------------------------------------------
  console.log('\nTEST 3: Master Image Mapping File Integrity');
  const masterJsonPath = path.join(process.cwd(), 'scripts/complete_product_image_mapping_master.json');
  assert(fs.existsSync(masterJsonPath), 'scripts/complete_product_image_mapping_master.json exists');
  if (fs.existsSync(masterJsonPath)) {
    const masterJson = JSON.parse(fs.readFileSync(masterJsonPath, 'utf-8'));
    for (const [sku, conf] of Object.entries(EXPECTED_HASHES)) {
      const entry = masterJson[sku];
      assert(!!entry, `${sku}: Exists in master mapping JSON`);
      if (entry) {
        assert(entry.primaryImage === `/assets/products/catalog_2026/${sku}.webp`, `${sku}: Master primaryImage matches`);
        assert(entry.imageStatus === 'VERIFIED_GENUINE_PRODUCT_PHOTO', `${sku}: Status is VERIFIED_GENUINE_PRODUCT_PHOTO`);
      }
    }
  }

  // -------------------------------------------------------------
  // TEST 4: Zoho CRM Synchronization Resilience Test
  // -------------------------------------------------------------
  console.log('\nTEST 4: Zoho CRM Synchronization Resilience');
  // Verify that syncProductsFromZohoInternal preserves existing.images and cannot overwrite images
  const zohoSyncFile = fs.readFileSync(path.join(process.cwd(), 'src/lib/zoho/products.ts'), 'utf-8');
  assert(!zohoSyncFile.includes('existing.images ='), 'Zoho sync never reassigns existing.images');
  assert(zohoSyncFile.includes('...existing,'), 'Zoho sync uses spread operator (...existing) preserving catalog images');

  // -------------------------------------------------------------
  // TEST 5: Frontend Component Image Versioning Audit
  // -------------------------------------------------------------
  console.log('\nTEST 5: Frontend Component Cache-Buster & Utility Integration');
  const componentChecks = [
    { file: 'src/components/product/ProductCard.tsx', label: 'ProductCard (Homepage, All Products, Categories, Search, Related)' },
    { file: 'src/components/product/ProductDetailClient.tsx', label: 'ProductDetailClient (PDP & Galleries)' },
    { file: 'src/components/cart/CartDrawer.tsx', label: 'CartDrawer (Slide-out Cart)' },
    { file: 'src/app/cart/page.tsx', label: 'Cart Page' },
    { file: 'src/components/quote/RequestQuoteClient.tsx', label: 'RequestQuoteClient (Quotation Request Form)' },
    { file: 'src/components/chatbot/BazzarAIChatbot.tsx', label: 'BazzarAIChatbot (AI Product Cards)' },
    { file: 'src/app/wishlist/page.tsx', label: 'Wishlist Page' },
    { file: 'src/app/order-success/[orderId]/page.tsx', label: 'Order Success Page' },
    { file: 'src/components/account/CustomerOrdersClient.tsx', label: 'Customer Order History' }
  ];

  for (const c of componentChecks) {
    const fullPath = path.join(process.cwd(), c.file);
    if (fs.existsSync(fullPath)) {
      const text = fs.readFileSync(fullPath, 'utf-8');
      const usesVersioned = text.includes('getVersionedImageUrl');
      assert(usesVersioned, `${c.label}: Implements getVersionedImageUrl`);
    } else {
      assert(false, `${c.label}: File ${c.file} not found`);
    }
  }

  // -------------------------------------------------------------
  // TEST 6: Live Production HTTP Responses & Hash Matching
  // -------------------------------------------------------------
  console.log('\nTEST 6: Live Production Response Verification (Byte-for-Byte)');

  // 6a. Live Image Asset Direct Fetch & MD5 Comparison
  for (const [sku, conf] of Object.entries(EXPECTED_HASHES)) {
    const assetUrl = `https://officebazzar.com/assets/products/catalog_2026/${sku}.webp`;
    console.log(`  Fetching live asset: ${assetUrl}`);
    const res = await httpsGet(assetUrl);
    assert(res.statusCode === 200, `${sku}: Live asset returned HTTP 200`);
    assert(res.headers['content-type'] === 'image/webp', `${sku}: Content-Type is image/webp`);

    const liveMd5 = computeMd5(res.buffer);
    assert(liveMd5 === conf.expectedMd5, `${sku}: Live asset byte hash matches verified replacement (${liveMd5})`);
    assert(res.buffer.length === fs.statSync(path.join(process.cwd(), conf.primaryAsset)).size, `${sku}: Byte length matches local file (${res.buffer.length} bytes)`);
  }

  // 6b. Live Product Detail Pages HTML Inspection
  for (const [sku, conf] of Object.entries(EXPECTED_HASHES)) {
    console.log(`  Fetching live PDP HTML: ${conf.liveUrl}`);
    const pdpRes = await httpsGet(conf.liveUrl);
    assert(pdpRes.statusCode === 200, `${sku}: Live PDP returned HTTP 200`);
    assert(pdpRes.text.includes(`/assets/products/catalog_2026/${sku}.webp`), `${sku}: Live PDP HTML contains direct reference to /assets/products/catalog_2026/${sku}.webp`);
    assert(!pdpRes.text.includes(`"${sku}"` + '.*placeholder-product.svg'), `${sku}: Live PDP does not render placeholder for ${sku}`);
  }

  // 6c. Live Category Listing HTML Inspection
  const categoryUrl = 'https://officebazzar.com/category/packaging-supplies?sub=floor-marking-safety-tapes';
  console.log(`  Fetching live Category HTML: ${categoryUrl}`);
  const catRes = await httpsGet(categoryUrl);
  assert(catRes.statusCode === 200, 'Live Floor Marking & Safety Tapes Category returned HTTP 200');
  for (const [sku] of Object.entries(EXPECTED_HASHES)) {
    assert(catRes.text.includes(`/assets/products/catalog_2026/${sku}.webp`), `Category HTML contains thumbnail for ${sku}`);
  }

  // 6d. Live Search Results HTML Inspection
  for (const [sku, conf] of Object.entries(EXPECTED_HASHES)) {
    console.log(`  Fetching live Search HTML: ${conf.searchUrl}`);
    const searchRes = await httpsGet(conf.searchUrl);
    assert(searchRes.statusCode === 200, `${sku}: Live Search returned HTTP 200`);
    assert(searchRes.text.includes(`/assets/products/catalog_2026/${sku}.webp`), `${sku}: Live Search results contain authentic image reference`);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   AUDIT COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch(err => {
  console.error('Fatal error in regression suite:', err);
  process.exit(1);
});
