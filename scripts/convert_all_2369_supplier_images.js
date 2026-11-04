const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function runFullConversion() {
  const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));
  console.log(`Starting conversion of ${allFiles.length} supplier files...`);

  const targetBaseDir = 'public/assets/supplier-library';
  if (!fs.existsSync(targetBaseDir)) {
    fs.mkdirSync(targetBaseDir, { recursive: true });
  }

  // Pre-index existing product mappings from catalog.ts
  const catContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
  const startIdx = catContent.indexOf('const RAW_PRODUCTS: Product[] = [');
  const endIdx = catContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
  const block = catContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim().replace(/;\s*$/, '');
  const products = JSON.parse(block);

  const productLookupBySku = new Map();
  const productLookupByName = new Map();
  products.forEach(p => {
    productLookupBySku.set(p.sku.toLowerCase(), p);
    productLookupByName.set(p.name.toLowerCase(), p);
  });

  const manifest = [];
  const usedSlugsPerFolder = new Map();

  const CONCURRENCY = 8;
  let activeWorkers = 0;
  let processedCount = 0;
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const queue = [...allFiles];
  const t0 = Date.now();

  return new Promise((resolve) => {
    function next() {
      if (queue.length === 0 && activeWorkers === 0) {
        console.log(`\nConversion complete in ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
        console.log(`Total accounted: ${manifest.length} / ${allFiles.length}`);
        console.log(`Successfully converted WebP: ${successCount}`);
        console.log(`Skipped / Catalogued non-images: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

        // Save manifest files
        fs.writeFileSync('scripts/supplier_images_master_manifest.json', JSON.stringify(manifest, null, 2), 'utf8');

        // CSV export
        function toCsvValue(val) {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }
        const headers = ['Original filename', 'Original folder', 'Processed filename', 'Web Path', 'File size (bytes)', 'Processing status', 'Product mapping'];
        const csvLines = [headers.join(',')];
        manifest.forEach(row => {
          csvLines.push([
            toCsvValue(row.originalFilename),
            toCsvValue(row.originalFolder),
            toCsvValue(row.processedFilename),
            toCsvValue(row.webPath),
            toCsvValue(row.fileSize),
            toCsvValue(row.processingStatus),
            toCsvValue(row.productMapping || 'Unmatched (Available in Supplier Library)')
          ].join(','));
        });
        fs.writeFileSync('scripts/supplier_images_master_manifest.csv', csvLines.join('\n'), 'utf8');
        console.log('Saved scripts/supplier_images_master_manifest.json and .csv');

        resolve(manifest);
        return;
      }

      while (activeWorkers < CONCURRENCY && queue.length > 0) {
        const fileItem = queue.shift();
        activeWorkers++;

        processItem(fileItem).finally(() => {
          activeWorkers--;
          processedCount++;
          if (processedCount % 100 === 0 || processedCount === allFiles.length) {
            process.stdout.write(`Progress: ${processedCount}/${allFiles.length} (${Math.round((processedCount/allFiles.length)*100)}%)\r`);
          }
          next();
        });
      }
    }

    async function processItem(fileItem) {
      const ext = path.extname(fileItem.filename).toLowerCase();
      const folderSlug = slugify(fileItem.folder);
      const folderDir = path.join(targetBaseDir, folderSlug);
      if (!fs.existsSync(folderDir)) {
        fs.mkdirSync(folderDir, { recursive: true });
      }

      // Check product association
      let mappedProduct = null;
      // 1. Direct SKU check in filename
      for (const [skuLower, prod] of productLookupBySku.entries()) {
        if (fileItem.filename.toLowerCase().includes(skuLower)) {
          mappedProduct = `${prod.sku} - ${prod.name}`;
          break;
        }
      }

      // 0-byte or non-image handling
      if (fileItem.size === 0) {
        skippedCount++;
        manifest.push({
          originalFilename: fileItem.filename,
          originalFolder: fileItem.folder,
          processedFilename: 'N/A',
          webPath: 'N/A',
          fileSize: 0,
          processingStatus: '0-byte source file (Preserved & catalogued in manifest)',
          productMapping: mappedProduct || 'Unmatched'
        });
        return;
      }

      if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        skippedCount++;
        manifest.push({
          originalFilename: fileItem.filename,
          originalFolder: fileItem.folder,
          processedFilename: fileItem.filename,
          webPath: fileItem.relativePath,
          fileSize: fileItem.size,
          processingStatus: `Non-image file (${ext.toUpperCase()}) catalogued in library`,
          productMapping: mappedProduct || 'Unmatched'
        });
        return;
      }

      // Generate clean unique filename in folder
      const baseSlug = slugify(path.parse(fileItem.filename).name) || 'image';
      if (!usedSlugsPerFolder.has(folderSlug)) {
        usedSlugsPerFolder.set(folderSlug, new Map());
      }
      const folderMap = usedSlugsPerFolder.get(folderSlug);
      let count = folderMap.get(baseSlug) || 0;
      let finalSlug = baseSlug;
      if (count > 0) {
        finalSlug = `${baseSlug}-${count}`;
      }
      folderMap.set(baseSlug, count + 1);

      const webpFilename = `${finalSlug}.webp`;
      const destPath = path.join(folderDir, webpFilename);
      const webPath = `/assets/supplier-library/${folderSlug}/${webpFilename}`;

      try {
        await sharp(fileItem.fullPath)
          .resize({
            width: 1200,
            height: 1200,
            fit: 'contain',
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .webp({ quality: 80 })
          .toFile(destPath);

        const outSize = fs.statSync(destPath).size;
        successCount++;

        manifest.push({
          originalFilename: fileItem.filename,
          originalFolder: fileItem.folder,
          processedFilename: webpFilename,
          webPath,
          fileSize: outSize,
          processingStatus: 'Converted to WebP (Optimized 1200px contain)',
          productMapping: mappedProduct || 'Available in Supplier Library'
        });
      } catch (err) {
        errorCount++;
        console.error(`Error processing ${fileItem.relativePath}:`, err.message);
        manifest.push({
          originalFilename: fileItem.filename,
          originalFolder: fileItem.folder,
          processedFilename: 'Error',
          webPath: 'Error',
          fileSize: fileItem.size,
          processingStatus: `Failed: ${err.message}`,
          productMapping: mappedProduct || 'Unmatched'
        });
      }
    }

    next();
  });
}

runFullConversion().catch(console.error);

