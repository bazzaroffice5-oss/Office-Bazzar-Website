const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BASE_PACKAGE_DIR = 'D:/temp_2369_package';
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'products', 'catalog_2026');

async function main() {
  const anglesData = JSON.parse(fs.readFileSync('scripts/multiple_angles_found.json', 'utf8'));
  console.log(`Processing ${anglesData.length} alternate angle images...`);

  const processedAngles = [];
  const skuToGalleryImages = new Map(); // sku -> array of relative paths

  for (let i = 0; i < anglesData.length; i++) {
    const item = anglesData[i];
    const srcPath = path.join(BASE_PACKAGE_DIR, item.alternateImage);

    if (!fs.existsSync(srcPath)) {
      console.error(`[MISSING] Angle source not found: ${srcPath}`);
      continue;
    }

    if (!skuToGalleryImages.has(item.sku)) {
      skuToGalleryImages.set(item.sku, []);
    }
    const currentList = skuToGalleryImages.get(item.sku);
    const angleIndex = currentList.length + 1;
    const destFileName = `${item.sku}-alt-${angleIndex}.webp`;
    const destFilePath = path.join(OUT_DIR, destFileName);
    const relDestPath = `/assets/products/catalog_2026/${destFileName}`;

    try {
      await sharp(srcPath)
        .resize(1200, 1200, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .flatten({ background: '#ffffff' })
        .webp({ quality: 90 })
        .toFile(destFilePath);

      const stat = fs.statSync(destFilePath);
      currentList.push(relDestPath);

      processedAngles.push({
        sku: item.sku,
        productName: item.productName,
        category: item.category,
        primaryImage: `/assets/products/catalog_2026/${item.sku}.webp`,
        alternateImage: relDestPath,
        originalFile: item.alternateImage,
        angleDescription: item.detectedAngle,
        sizeBytes: stat.size,
        sizeKb: (stat.size / 1024).toFixed(1),
        dimensions: '1200x1200'
      });

      if ((i + 1) % 20 === 0 || i === anglesData.length - 1) {
        console.log(`Processed ${i + 1}/${anglesData.length} gallery angle images...`);
      }
    } catch (err) {
      console.error(`[ERROR] Processing ${item.sku} angle (${srcPath}):`, err.message);
    }
  }

  console.log(`\nSuccessfully processed ${processedAngles.length} alternate angle images!`);
  fs.writeFileSync('scripts/processed_gallery_angles.json', JSON.stringify(processedAngles, null, 2), 'utf8');

  // Now update src/lib/data/catalog.ts with the new gallery images
  console.log('Updating catalog.ts with gallery images...');
  let catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

  let updatedProductsCount = 0;
  for (const [sku, altList] of skuToGalleryImages.entries()) {
    // Locate the product in catalogContent
    // regex matching sku and images array
    const skuRegex = new RegExp(`(\"sku\":\\s*\"${sku}\"[\\s\\S]*?\"images\":\\s*\\[)([\\s\\S]*?)(\\])`, 'g');
    catalogContent = catalogContent.replace(skuRegex, (match, prefix, inner, suffix) => {
      updatedProductsCount++;
      const primary = `/assets/products/catalog_2026/${sku}.webp`;
      const allImgs = [primary, ...altList];
      const formatted = allImgs.map(img => `\n      "${img}"`).join(',');
      return `${prefix}${formatted}\n    ${suffix}`;
    });
  }

  fs.writeFileSync('src/lib/data/catalog.ts', catalogContent, 'utf8');
  console.log(`Updated catalog.ts for ${updatedProductsCount} products with multiple angles!`);
}

main().catch(console.error);

