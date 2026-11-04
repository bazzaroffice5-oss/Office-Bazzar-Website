const fs = require('fs');
const path = require('path');

console.log('--- STARTING INDEPENDENT AUDIT VERIFICATION ---');

// 1. Read catalog.ts
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

console.log(`Total Products in catalog.ts: ${products.length}`);

// 2. Read audit JSON
const auditRows = JSON.parse(fs.readFileSync('scripts/complete_product_image_integration_audit.json', 'utf8'));
console.log(`Total Rows in audit.json: ${auditRows.length}`);

// 3. Physical file verification
let missingPhysical = 0;
const missingSamples = [];
const imageUsageCount = new Map(); // imagePath -> [skus]

products.forEach(p => {
  (p.images || []).forEach(img => {
    // Physical check
    const pOnDisk = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
    if (!fs.existsSync(pOnDisk)) {
      missingPhysical++;
      if (missingSamples.length < 5) missingSamples.push({ sku: p.sku, img, pOnDisk });
    }

    // Usage count
    if (!imageUsageCount.has(img)) imageUsageCount.set(img, []);
    imageUsageCount.get(img).push(p.sku);
  });
});

console.log(`Missing Physical Files on Disk: ${missingPhysical}`);
if (missingPhysical > 0) {
  console.error('Samples missing:', missingSamples);
}

// 4. Shared / Cross-product image usage
let sharedImages = 0;
const sharedSamples = [];
imageUsageCount.forEach((skus, img) => {
  if (skus.length > 1) {
    sharedImages++;
    if (sharedSamples.length < 15) {
      sharedSamples.push({ img, count: skus.length, skus });
    }
  }
});
console.log(`Images shared across multiple products: ${sharedImages}`);
console.log('Samples of shared images:', sharedSamples);

// 5. Semantic Check: Category / Keyword mismatch
const suspiciousMappings = [];
products.forEach(p => {
  (p.images || []).forEach(img => {
    const parts = img.split('/');
    const folder = parts[3]; // e.g. brooms-and-sticks, chemical-product, dispenser, dustbin
    const file = parts[4] || '';
    const pName = p.name.toLowerCase();
    const pCat = (p.categoryName || '').toLowerCase();

    // Specific severe cross-category mismatches
    if (folder === 'dustbin' && !pName.includes('bin') && !pName.includes('dustbin') && !pName.includes('waste') && !pName.includes('ash') && !pName.includes('pedal')) {
      suspiciousMappings.push({ sku: p.sku, name: p.name, img, reason: 'Dustbin image on non-dustbin product' });
    } else if (folder === 'brooms-and-sticks' && !pName.includes('broom') && !pName.includes('stick') && !pName.includes('handle') && !pName.includes('wiper') && !pName.includes('mop') && !pName.includes('kharata')) {
      suspiciousMappings.push({ sku: p.sku, name: p.name, img, reason: 'Broom/Stick image on non-broom product' });
    } else if (folder === 'stationery' && pCat.includes('housekeeping')) {
      suspiciousMappings.push({ sku: p.sku, name: p.name, img, reason: 'Stationery image on Housekeeping product' });
    } else if (folder === 'chemical-product' && pCat.includes('stationery')) {
      suspiciousMappings.push({ sku: p.sku, name: p.name, img, reason: 'Chemical image on Stationery product' });
    }
  });
});

console.log(`Suspicious / Potential Semantic Mismatches: ${suspiciousMappings.length}`);
if (suspiciousMappings.length > 0) {
  console.log('Suspicious samples (first 10):', suspiciousMappings.slice(0, 10));
}
