const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const mappingPath = path.join(__dirname, '..', 'complete_master_mapping.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const outDir = path.join(__dirname, '..', 'public', 'assets', 'products', 'catalog_2026');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Starting image generation for ${mapping.length} products...`);
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < mapping.length; i++) {
    const item = mapping[i];
    let src = item.sourceFile;
    if (!fs.existsSync(src)) {
      src = path.join('D:/temp_2369_package', item.sourceFile);
    }

    if (!fs.existsSync(src)) {
      console.error(`[FAIL] Source not found for SKU ${item.sku}: ${src}`);
      failCount++;
      results.push({
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        sourceFile: src,
        destFile: null,
        status: 'FAILED_MISSING_SOURCE',
        migrationSource: item.migrationSource
      });
      continue;
    }

    const destFileName = `${item.sku}.webp`;
    const destFilePath = path.join(outDir, destFileName);
    const relativeDestPath = `/assets/products/catalog_2026/${destFileName}`;

    try {
      await sharp(src)
        .resize(1200, 1200, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .flatten({ background: '#ffffff' })
        .webp({ quality: 90 })
        .toFile(destFilePath);

      const stat = fs.statSync(destFilePath);
      successCount++;
      const is2369 = item.sourceFile.includes('Product Photo');

      results.push({
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        oldImage: item.oldImage,
        newImageRelative: relativeDestPath,
        sourceFile: src,
        destFile: destFilePath,
        sizeBytes: stat.size,
        sizeKb: (stat.size / 1024).toFixed(1),
        width: 1200,
        height: 1200,
        status: 'SUCCESS',
        migrationSource: is2369 ? 'Supplier_Package_2369' : 'Verified_OEM_Master'
      });

      if ((i + 1) % 50 === 0 || i === mapping.length - 1) {
        console.log(`Processed ${i + 1}/${mapping.length} products (${successCount} succeeded, ${failCount} failed)...`);
      }
    } catch (err) {
      console.error(`[ERROR] Processing error on ${item.sku} (${src}):`, err.message);
      failCount++;
      results.push({
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        category: item.category,
        sourceFile: src,
        destFile: null,
        status: `FAILED_SHARP_ERROR: ${err.message}`,
        migrationSource: item.migrationSource
      });
    }
  }

  console.log(`\n========================================`);
  console.log(`IMAGE GENERATION COMPLETE!`);
  console.log(`Total Products: ${mapping.length}`);
  console.log(`Successfully Generated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`========================================\n`);

  fs.writeFileSync(
    path.join(__dirname, 'generation_results.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log('Results saved to scripts/generation_results.json');
}

main().catch(console.error);

