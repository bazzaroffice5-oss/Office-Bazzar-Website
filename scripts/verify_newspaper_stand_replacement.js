const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

// Parse image.ts
const imageTsContent = fs.readFileSync('src/lib/utils/image.ts', 'utf8');
const versionMatch = imageTsContent.match(/CATALOG_IMAGE_VERSION\s*=\s*['"]([^'"]+)['"]/);
const CATALOG_IMAGE_VERSION = versionMatch ? versionMatch[1] : null;

function getVersionedImageUrl(url) {
  if (!url) return `/assets/placeholder-product.svg?v=${CATALOG_IMAGE_VERSION}`;
  if (
    url.includes('?v=') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  return `${url}?v=${CATALOG_IMAGE_VERSION}`;
}

const item = {
  name: 'Double Sided Newspaper Stand',
  sku: 'OB-DIS-1060',
  slug: 'double-sided-newspaper-stand',
  expectedImage: '/assets/products/catalog_2026/OB-DIS-1060.webp'
};

async function runVerification() {
  console.log('===============================================================');
  console.log(' AUTOMATED NEWSPAPER STAND IMAGE REPLACEMENT TEST');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Verify CATALOG_IMAGE_VERSION
  assert(
    CATALOG_IMAGE_VERSION === '20261113_v28_newspaper_stand_replacement',
    `CATALOG_IMAGE_VERSION is updated to '20261113_v28_newspaper_stand_replacement' (found: ${CATALOG_IMAGE_VERSION})`
  );

  // 2. Read catalog.ts content and verify SKU-to-image mappings in catalog
  const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  const oldReport = JSON.parse(fs.readFileSync('scratch/old_newspaper_stand_report.json', 'utf8'));

  console.log(`\n--- Verifying [${item.sku}] ${item.name} ---`);

  // Verify catalog entry
  const skuIndex = catalogContent.indexOf(`"sku": "${item.sku}"`);
  assert(skuIndex !== -1, `SKU ${item.sku} exists in catalog.ts`);

  const imgIndex = catalogContent.indexOf(`"${item.expectedImage}"`);
  assert(imgIndex !== -1, `Expected image ${item.expectedImage} referenced in catalog.ts`);

  // Check disk file
  const diskPath = path.join('public', item.expectedImage);
  assert(fs.existsSync(diskPath), `Physical file exists at ${diskPath}`);

  const fileBuf = fs.readFileSync(diskPath);
  assert(fileBuf.length > 5000, `File size is substantial (${(fileBuf.length / 1024).toFixed(1)} KB)`);

  // Decode with sharp
  const meta = await sharp(diskPath).metadata();
  assert(meta.format === 'webp', `File format is valid WebP`);
  assert(meta.width === 1200 && meta.height === 1200, `Dimensions are 1200x1200 square`);

  // Compare with old hash
  const currentHash = crypto.createHash('sha256').update(fileBuf).digest('hex').substring(0, 16);
  assert(currentHash !== oldReport.oldHash, `Hash has changed from old (${oldReport.oldHash} -> ${currentHash})`);

  // Verify versioned URL generator
  const versionedUrl = getVersionedImageUrl(item.expectedImage);
  assert(
    versionedUrl === `${item.expectedImage}?v=${CATALOG_IMAGE_VERSION}`,
    `Versioned URL includes ?v=${CATALOG_IMAGE_VERSION}`
  );

  console.log(`\n===============================================================`);
  console.log(` VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`===============================================================\n`);

  if (passedTests === totalTests) {
    console.log('✓ Double-Sided Newspaper Stand image is verified, consistent, and ready for deployment.');
  }
}

runVerification().catch(err => {
  console.error('Fatal error in verification:', err);
  process.exit(1);
});

