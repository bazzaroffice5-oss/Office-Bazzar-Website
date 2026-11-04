const fs = require('fs');
const path = require('path');

console.log('--- GENERATING ZOHO CRM DRY-RUN MIGRATION REPORT ---');

// 1. Read catalog.ts
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

// 2. Read live Zoho CRM products fetched from API
const liveZoho = JSON.parse(fs.readFileSync('scripts/live_zoho_products.json', 'utf8'));
const liveZohoByCode = new Map();
const liveZohoById = new Map();
liveZoho.forEach(z => {
  if (z.Product_Code) liveZohoByCode.set(z.Product_Code.trim(), z);
  if (z.id) liveZohoById.set(z.id, z);
});

// 3. Read zoho_product_mapping.json
const mapping = JSON.parse(fs.readFileSync('src/lib/data/zoho_product_mapping.json', 'utf8'));

// 4. Audit catalogue integrity
const skus = new Set();
const duplicateSkus = [];
products.forEach(p => {
  if (skus.has(p.sku)) duplicateSkus.push(p.sku);
  skus.add(p.sku);
});

// 5. Partition products: Synchronized vs Missing
const existingInZoho = [];
const missingFromZoho = [];
const mismatched = [];

products.forEach(p => {
  const z = liveZohoByCode.get(p.sku);
  const mapped = mapping[p.id] || mapping[p.sku];

  if (z) {
    const isPriceMatch = Number(z.Unit_Price) === Number(p.price);
    const isNameMatch = z.Product_Name.trim().toLowerCase() === p.name.trim().toLowerCase() || z.Product_Name.includes(p.name);

    if (!isPriceMatch || !isNameMatch) {
      mismatched.push({ sku: p.sku, name: p.name, zohoName: z.Product_Name, price: p.price, zohoPrice: z.Unit_Price });
    }

    existingInZoho.push({
      sku: p.sku,
      name: p.name,
      zohoId: z.id,
      category: p.categoryName,
      status: 'SYNCHRONIZED_IN_ZOHO',
      imageCount: (p.images || []).length
    });
  } else {
    missingFromZoho.push({
      sku: p.sku,
      name: p.name,
      category: p.categoryName,
      subcategory: p.subcategoryName,
      price: p.price,
      status: 'PENDING_MIGRATION',
      imageCount: (p.images || []).length,
      primaryImage: (p.images && p.images[0]) || '/assets/placeholder-product.svg'
    });
  }
});

console.log(`1. Total Active Catalog Products: ${products.length}`);
console.log(`2. Total Existing Zoho CRM Products: ${liveZoho.length}`);
console.log(`3. Synchronized Products: ${existingInZoho.length}`);
console.log(`4. Missing Products Pending Migration: ${missingFromZoho.length}`);
console.log(`5. Duplicate SKUs in Catalog: ${duplicateSkus.length}`);
console.log(`6. Data Mismatches: ${mismatched.length}`);

// Category breakdown of missing products
const missingByCat = {};
missingFromZoho.forEach(p => {
  missingByCat[p.category] = (missingByCat[p.category] || 0) + 1;
});
console.log('\nMissing Products Breakdown by Category:', missingByCat);

// Batch migration planning
const chunkSize = 100;
const totalBatches = Math.ceil(missingFromZoho.length / chunkSize);
console.log(`\nMigration Plan: ${missingFromZoho.length} products to be upserted in ${totalBatches} batches of up to ${chunkSize} items.`);

// Output dry run reports
const dryRunSummary = {
  totalActiveCatalogProducts: products.length,
  totalExistingZohoProducts: liveZoho.length,
  totalSynchronized: existingInZoho.length,
  totalPendingMigration: missingFromZoho.length,
  duplicateSkusCount: duplicateSkus.length,
  dataMismatchesCount: mismatched.length,
  missingByCategory: missingByCat,
  migrationBatchCount: totalBatches,
  batchSize: chunkSize,
  apiEndpoint: '/crm/v2/Products/upsert',
  duplicateCheckField: 'Product_Code',
  existingInZoho,
  missingFromZoho
};

fs.writeFileSync('scripts/zoho_crm_dry_run_migration_report.json', JSON.stringify(dryRunSummary, null, 2));

const csvHeader = 'SKU,Product Name,Category,Subcategory,Price,Status,Image Count,Primary Image\n';
const csvRows = missingFromZoho.map(p => `"${p.sku}","${p.name.replace(/"/g, '""')}","${p.category}","${p.subcategory || ''}",${p.price},"${p.status}",${p.imageCount},"${p.primaryImage}"`).join('\n');
fs.writeFileSync('scripts/zoho_crm_dry_run_migration_report.csv', csvHeader + csvRows);

console.log('Saved dry-run report to scripts/zoho_crm_dry_run_migration_report.json and .csv');
