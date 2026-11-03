const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BASE_PACKAGE_DIR = 'D:/temp_2369_package';
const CATALOG_DIR = path.join(__dirname, '..', 'public', 'assets', 'products', 'catalog_2026');

async function main() {
  const verifiedList = JSON.parse(fs.readFileSync('scripts/final_verified_supplier_products.json', 'utf8'));
  const verifiedSkuSet = new Set(verifiedList.map(x => x.sku));

  const allAngles = JSON.parse(fs.readFileSync('scripts/processed_gallery_angles.json', 'utf8'));
  const verifiedAngles = allAngles.filter(a => verifiedSkuSet.has(a.sku));

  console.log(`Verified Products from Supplier Archive: ${verifiedList.length}`);
  console.log(`Verified Alternate Angles from Supplier Archive: ${verifiedAngles.length}`);

  // Build map of SKU -> [primaryUrl, ...altUrls]
  const skuToImages = new Map();
  for (const item of verifiedList) {
    skuToImages.set(item.sku, [`/assets/products/catalog_2026/${item.sku}.webp`]);
  }
  for (const angle of verifiedAngles) {
    const list = skuToImages.get(angle.sku);
    if (list && !list.includes(angle.alternateImage)) {
      list.push(angle.alternateImage);
    }
  }

  // Generate / Ensure all 171 primary images are processed strictly from BASE_PACKAGE_DIR
  console.log('Generating / Verifying 171 primary supplier images...');
  for (let i = 0; i < verifiedList.length; i++) {
    const item = verifiedList[i];
    const srcPath = path.join(BASE_PACKAGE_DIR, item.supplierSource);
    const destPath = path.join(CATALOG_DIR, `${item.sku}.webp`);

    await sharp(srcPath)
      .resize(1200, 1200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: '#ffffff' })
      .webp({ quality: 90 })
      .toFile(destPath);
  }

  // Generate / Verify 80 alternate angle images strictly from BASE_PACKAGE_DIR
  console.log('Generating / Verifying 80 alternate angle supplier images...');
  for (let i = 0; i < verifiedAngles.length; i++) {
    const item = verifiedAngles[i];
    const srcPath = path.join(BASE_PACKAGE_DIR, item.originalFile);
    const destFileName = path.basename(item.alternateImage);
    const destPath = path.join(CATALOG_DIR, destFileName);

    await sharp(srcPath)
      .resize(1200, 1200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: '#ffffff' })
      .webp({ quality: 90 })
      .toFile(destPath);
  }

  // Purge any file in CATALOG_DIR that is NOT in verified list or verified angles
  console.log('Purging non-supplier files from catalog_2026 directory...');
  const activeAllowedFiles = new Set([
    ...verifiedList.map(v => `${v.sku}.webp`),
    ...verifiedAngles.map(a => path.basename(a.alternateImage))
  ]);

  const existingFiles = fs.readdirSync(CATALOG_DIR);
  let purgedCount = 0;
  for (const f of existingFiles) {
    if (!activeAllowedFiles.has(f)) {
      fs.unlinkSync(path.join(CATALOG_DIR, f));
      purgedCount++;
    }
  }
  console.log(`Purged ${purgedCount} non-supplier files from catalog_2026 directory.`);
  console.log(`Remaining verified files in catalog_2026: ${fs.readdirSync(CATALOG_DIR).length}`);

  // Now update src/lib/data/catalog.ts
  console.log('Updating catalog.ts with pure supplier image mappings and empty arrays for missing products...');
  let catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

  // Match each product's sku and images array
  const regex = /(\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"images\":\s*\[)([\s\S]*?)(\])/g;

  let totalUpdated = 0;
  let populatedCount = 0;
  let emptyCount = 0;

  catalogContent = catalogContent.replace(regex, (match, prefix, sku, inner, suffix) => {
    totalUpdated++;
    if (skuToImages.has(sku)) {
      populatedCount++;
      const imgs = skuToImages.get(sku);
      const formatted = imgs.map(img => `\n      "${img}"`).join(',');
      return `${prefix}${formatted}\n    ${suffix}`;
    } else {
      emptyCount++;
      return `${prefix}\n    ${suffix}`; // Empty array: []
    }
  });

  fs.writeFileSync('src/lib/data/catalog.ts', catalogContent, 'utf8');
  console.log(`Updated catalog.ts: ${totalUpdated} products processed (${populatedCount} populated with pure supplier images, ${emptyCount} marked missing).`);

  // Category card image updates
  // Category cards should use confirmed supplier image URLs
  // OB-STA-1002 (3025 Box File), OB-026 (Single bucket wringer), OB-141 (Platform trolley), OB-003, etc. are verified!
}

main().catch(console.error);

