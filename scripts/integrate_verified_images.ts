import * as fs from 'fs';
import * as path from 'path';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

async function main() {
  console.log('=== STEP 4: INTEGRATING VERIFIED IMAGES ===');

  const sourceImagesDir = path.join(process.cwd(), 'temp_prepared_383', 'OfficeBazzar_Product_Images', 'images');
  const targetImagesDir = path.join(process.cwd(), 'public', 'assets', 'products', 'prepared_1200');

  // 1. Create target directory and copy all 383 prepared images
  fs.mkdirSync(targetImagesDir, { recursive: true });
  const preparedFiles = fs.readdirSync(sourceImagesDir);
  console.log(`Copying ${preparedFiles.length} prepared 1200x1200 images to ${targetImagesDir}...`);

  for (const f of preparedFiles) {
    fs.copyFileSync(path.join(sourceImagesDir, f), path.join(targetImagesDir, f));
  }
  console.log('All prepared 1200x1200 images copied successfully.');

  // 2. Load audit results
  const auditRows: any[] = JSON.parse(fs.readFileSync('scripts/detailed_image_audit_report.json', 'utf8'));
  const auditMap = new Map<string, any>(auditRows.map(r => [r.sku, r]));

  // 3. Load catalog backup mapping
  const backupMapping: any[] = JSON.parse(fs.readFileSync('scripts/catalog_image_mapping_backup.json', 'utf8'));
  const backupMap = new Map<string, any>(backupMapping.map(b => [b.sku, b]));

  // 4. Update catalog.ts in place
  const catalogFilePath = path.join(process.cwd(), 'src', 'lib', 'data', 'catalog.ts');
  const catalogContent = fs.readFileSync(catalogFilePath, 'utf8');

  // We can update the RAW_PRODUCTS array by reading and modifying INITIAL_PRODUCTS,
  // or updating the file content safely. Let's inspect catalog.ts structure.
  console.log('Inspecting catalog.ts structure...');

  let verifiedCount = 0;
  let pendingCount = 0;
  const beforeAfterReport: any[] = [];

  // Update product image mapping
  const updatedProducts = INITIAL_PRODUCTS.map(p => {
    const audit = auditMap.get(p.sku);
    const oldImage = p.images[0];
    let newImage = oldImage;
    let integrationStatus = 'RETAINED_EXISTING';

    if (audit && audit.validationResult === 'VERIFIED_PUBLISHABLE') {
      const filename = path.basename(audit.preparedFile);
      newImage = `/assets/products/prepared_1200/${filename}`;
      integrationStatus = 'INTEGRATED_1200_WEBP';
      verifiedCount++;
    } else {
      integrationStatus = audit ? audit.validationResult : 'RETAINED_EXISTING';
      pendingCount++;
    }

    beforeAfterReport.push({
      sku: p.sku,
      name: p.name,
      category: p.categoryName,
      oldImage,
      newImage,
      integrationStatus,
      auditStatus: audit ? audit.preparedStatus : 'UNKNOWN'
    });

    return {
      ...p,
      images: [newImage],
      requiresManualReview: integrationStatus !== 'INTEGRATED_1200_WEBP'
    };
  });

  console.log(`Integration Summary: Verified & Integrated = ${verifiedCount}, Retained & Pending = ${pendingCount}`);

  // Re-serialize catalog.ts properly preserving imports, types, CATEGORIES, etc.
  // Let's inspect where RAW_PRODUCTS starts and ends in catalog.ts.
  const rawProductsMarker = 'const RAW_PRODUCTS: Product[] = ';
  const markerIdx = catalogContent.indexOf(rawProductsMarker);
  if (markerIdx === -1) {
    throw new Error('Could not find RAW_PRODUCTS in catalog.ts');
  }

  const prefix = catalogContent.slice(0, markerIdx + rawProductsMarker.length);
  // Find where RAW_PRODUCTS ends (after the array closing '];')
  // We can search for '\nexport const INITIAL_PRODUCTS' or similar
  const endMarker = '\nexport const INITIAL_PRODUCTS';
  const endMarkerIdx = catalogContent.indexOf(endMarker, markerIdx);
  if (endMarkerIdx === -1) {
    throw new Error('Could not find end marker in catalog.ts');
  }

  const suffix = catalogContent.slice(endMarkerIdx);
  const formattedJson = JSON.stringify(updatedProducts, null, 2);
  const newCatalogContent = prefix + formattedJson + ';' + suffix;

  fs.writeFileSync(catalogFilePath, newCatalogContent, 'utf8');
  console.log('Successfully updated src/lib/data/catalog.ts with verified images!');

  // Save before/after CSV report
  const csvHeaders = ['SKU', 'Product Name', 'Category', 'Before Image Path', 'After Image Path', 'Integration Status', 'Audit Prepared Status'];
  const csvLines = beforeAfterReport.map(r => [
    `"${r.sku}"`,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.category}"`,
    `"${r.oldImage}"`,
    `"${r.newImage}"`,
    `"${r.integrationStatus}"`,
    `"${r.auditStatus}"`
  ].join(','));

  fs.writeFileSync('scripts/before_after_integration_report.csv', [csvHeaders.join(','), ...csvLines].join('\n'), 'utf8');
  console.log('Saved scripts/before_after_integration_report.csv');
}

main().catch(console.error);
