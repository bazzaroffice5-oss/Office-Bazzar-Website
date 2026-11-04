const fs = require('fs');
const path = require('path');

// Run curated matching engine and apply updates
const scriptBase = fs.readFileSync('scripts/test_curated_matching.js', 'utf8');

const applyScript = `
${scriptBase}

// 1. Update src/lib/data/catalog.ts
let catalogRaw = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// Find RAW_PRODUCTS section
const rawStart = catalogRaw.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = catalogRaw.indexOf('export const INITIAL_PRODUCTS: Product[] =');

if (rawStart === -1 || rawEnd === -1) {
  console.error('Could not locate RAW_PRODUCTS in catalog.ts');
  process.exit(1);
}

// Update each product's images array
let updatedProductsCount = 0;
products.forEach(p => {
  const pEntry = productMap.get(p.sku);
  if (!pEntry) return;

  const newImages = pEntry.images;
  // If images changed from original
  const oldImages = p.images || [];
  if (JSON.stringify(newImages) !== JSON.stringify(oldImages)) {
    updatedProductsCount++;
  }
  p.images = newImages;
});

console.log(\`Products with updated image galleries: \${updatedProductsCount}\`);

// Reconstruct RAW_PRODUCTS string
const newRawProductsStr = 'const RAW_PRODUCTS: Product[] = ' + JSON.stringify(products, null, 2) + ';\\n\\n';
catalogRaw = catalogRaw.slice(0, rawStart) + newRawProductsStr + catalogRaw.slice(rawEnd);

fs.writeFileSync('src/lib/data/catalog.ts', catalogRaw, 'utf8');
console.log('Successfully updated src/lib/data/catalog.ts!');

// 2. Generate updated master manifests (2369 rows total: 2365 webp + 4 non-image)
const nonImageManifestItems = manifest.filter(m => !m.webPath || !m.webPath.endsWith('.webp'));

const masterRows = [];

webpManifest.forEach(m => {
  const info = assetStatus.get(m.webPath);
  masterRows.push({
    originalFilename: m.originalFilename,
    originalFolder: m.originalFolder,
    processedFilename: m.processedFilename,
    webPath: m.webPath,
    fileSize: m.fileSize,
    processingStatus: m.processingStatus,
    sku: info ? info.sku : 'N/A',
    productName: info ? info.productName : 'Uncatalogued Supplier Stock',
    category: info ? info.category : 'N/A',
    role: info ? info.role : 'APPROVED_UNUSED_IMAGE',
    status: info ? info.status : 'APPROVED_UNUSED_IMAGE',
    productMapping: info && info.status === 'MAPPED_TO_PRODUCT' 
      ? \`Mapped to \${info.sku} - \${info.productName} (\${info.role})\` 
      : (info ? info.role : 'Approved Unused')
  });
});

nonImageManifestItems.forEach(m => {
  masterRows.push({
    originalFilename: m.originalFilename,
    originalFolder: m.originalFolder,
    processedFilename: m.processedFilename,
    webPath: m.webPath,
    fileSize: m.fileSize,
    processingStatus: m.processingStatus,
    sku: 'N/A',
    productName: 'Preserved Non-Image Asset',
    category: 'Archive Documentation',
    role: 'PRESERVED_ARCHIVE_FILE',
    status: 'PRESERVED_NON_IMAGE',
    productMapping: 'Preserved Archive Documentation (Non-Image / Corrupted)'
  });
});

fs.writeFileSync('scripts/supplier_images_master_manifest.json', JSON.stringify(masterRows, null, 2), 'utf8');

// Generate CSV
const csvHeaders = ['Original filename', 'Original folder', 'Processed filename', 'Web Path', 'File size (bytes)', 'Processing status', 'Product mapping', 'SKU', 'Product Name', 'Category', 'Role'];
const csvLines = [csvHeaders.join(',')];

masterRows.forEach(row => {
  const escapeCsv = val => '"' + String(val || '').replace(/"/g, '""') + '"';
  csvLines.push([
    escapeCsv(row.originalFilename),
    escapeCsv(row.originalFolder),
    escapeCsv(row.processedFilename),
    escapeCsv(row.webPath),
    row.fileSize,
    escapeCsv(row.processingStatus),
    escapeCsv(row.productMapping),
    escapeCsv(row.sku),
    escapeCsv(row.productName),
    escapeCsv(row.category),
    escapeCsv(row.role)
  ].join(','));
});

fs.writeFileSync('scripts/supplier_images_master_manifest.csv', csvLines.join('\\n'), 'utf8');
console.log('Successfully saved scripts/supplier_images_master_manifest.json and .csv (2,369 rows)!');

// 3. Generate updated 383 product mapping report
const productAuditReport = products.map(p => {
  const pEntry = productMap.get(p.sku);
  const imgs = pEntry ? pEntry.images : [];
  const hasImages = imgs.length > 0;
  return {
    sku: p.sku,
    productName: p.name,
    category: p.categoryName || p.categoryId,
    subcategory: p.subcategoryName || p.subcategoryId,
    brand: p.brandName || p.brandId,
    totalImages: imgs.length,
    primaryImage: hasImages ? imgs[0] : '/assets/placeholder-product.svg',
    galleryImages: hasImages ? imgs.slice(1) : [],
    status: hasImages ? 'Verified Supplier Photography' : 'Approved Neutral Placeholder',
    isMultiImageGallery: imgs.length > 1
  };
});

fs.writeFileSync('scripts/master_383_product_image_mapping_report.json', JSON.stringify(productAuditReport, null, 2), 'utf8');

const prodCsvHeaders = ['SKU', 'Product Name', 'Category', 'Subcategory', 'Brand', 'Total Images', 'Primary Image', 'Gallery Count', 'Status'];
const prodCsvLines = [prodCsvHeaders.join(',')];

productAuditReport.forEach(row => {
  const escapeCsv = val => '"' + String(val || '').replace(/"/g, '""') + '"';
  prodCsvLines.push([
    escapeCsv(row.sku),
    escapeCsv(row.productName),
    escapeCsv(row.category),
    escapeCsv(row.subcategory),
    escapeCsv(row.brand),
    row.totalImages,
    escapeCsv(row.primaryImage),
    row.galleryImages.length,
    escapeCsv(row.status)
  ].join(','));
});

fs.writeFileSync('scripts/master_383_product_image_mapping_report.csv', prodCsvLines.join('\\n'), 'utf8');
console.log('Successfully saved scripts/master_383_product_image_mapping_report.json and .csv (383 rows)!');
`;

fs.writeFileSync('scripts/apply_all_catalog_integrations.js', applyScript, 'utf8');

