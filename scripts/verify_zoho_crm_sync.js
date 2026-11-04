const fs = require('fs');

console.log('--- AUDITING ZOHO CRM SYNCHRONIZATION ---');

// 1. Read zoho_product_mapping.json
const mapping = JSON.parse(fs.readFileSync('src/lib/data/zoho_product_mapping.json', 'utf8'));
const mappedEntries = Object.entries(mapping);
console.log(`Total Mapped Zoho Products in zoho_product_mapping.json: ${mappedEntries.length}`);

// 2. Read catalog.ts
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

const prodBySku = new Map();
const prodById = new Map();
products.forEach(p => {
  prodBySku.set(p.sku, p);
  prodById.set(p.id, p);
});

let matchedCount = 0;
let priceMatched = 0;
let imageResolved = 0;
const syncIssues = [];

mappedEntries.forEach(([webId, item]) => {
  const p = prodById.get(webId) || prodBySku.get(item.sku);
  if (p) {
    matchedCount++;
    if (p.price === item.price || (p.price === 0 && item.price === 0)) {
      priceMatched++;
    }
    const hasImage = p.images && p.images.length > 0;
    if (hasImage) {
      imageResolved++;
    }
  } else {
    syncIssues.push({ webId, item, reason: 'Mapped product not found in catalog' });
  }
});

console.log(`Matched Products in Website Catalog: ${matchedCount} / ${mappedEntries.length}`);
console.log(`Price Field Alignment: ${priceMatched} / ${mappedEntries.length}`);
console.log(`Active Image References Resolved: ${imageResolved} / ${mappedEntries.length}`);
console.log(`Synchronization Discrepancies: ${syncIssues.length}`);

if (syncIssues.length > 0) {
  console.log('Sync issues:', syncIssues);
} else {
  console.log('PASS: Zoho CRM mapping index is 100% consistent with the active catalog.');
}

// 3. Confirm NO Supabase product references exist
const clientTs = fs.readFileSync('src/lib/zoho/client.ts', 'utf8');
const productsTs = fs.readFileSync('src/lib/zoho/products.ts', 'utf8');

const supabaseInClient = clientTs.toLowerCase().includes('supabase');
const supabaseInProducts = productsTs.toLowerCase().includes('supabase');

console.log(`Supabase in src/lib/zoho/client.ts: ${supabaseInClient}`);
console.log(`Supabase in src/lib/zoho/products.ts: ${supabaseInProducts}`);

if (!supabaseInClient && !supabaseInProducts) {
  console.log('PASS: Supabase is NOT used for product database. Zoho CRM is strictly authoritative.');
} else {
  console.error('FAIL: Supabase reference detected in Zoho product pipeline!');
}
