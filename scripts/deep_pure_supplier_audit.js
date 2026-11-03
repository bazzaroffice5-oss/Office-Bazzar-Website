const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/supplier_inventory_complete.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);
console.log(`Total valid supplier images: ${validImages.length}`);

// Load raw catalog dump or catalog products
const rawCatalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// Extract products
const regex = /\{\s*\"id\":\s*\"([^\"]+)\"[\s\S]*?\"name\":\s*\"([^\"]+)\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"categoryId\":\s*\"([^\"]+)\"[\s\S]*?\"brandName\":\s*\"([^\"]+)\"/g;

const catalogProducts = [];
let match;
while ((match = regex.exec(rawCatalogContent)) !== null) {
  catalogProducts.push({
    id: match[1],
    name: match[2],
    sku: match[3],
    categoryId: match[4],
    brand: match[5]
  });
}
console.log(`Extracted ${catalogProducts.length} catalogue products.`);

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getTokens(s) {
  return normalize(s).split(/\s+/).filter(t => t.length > 2);
}

// Perform deep matching of each catalogue product against ONLY the 2,365 supplier images
const matched = [];
const missing = [];

for (const prod of catalogProducts) {
  const pTokens = getTokens(prod.name);
  const pSku = prod.sku.toLowerCase();
  const pSkuNum = pSku.replace(/[^0-9]/g, '');

  let bestMatch = null;
  let bestScore = 0;

  for (const img of validImages) {
    const fn = img.fileName.toLowerCase();
    const rel = img.relPath.toLowerCase();
    const fnNorm = normalize(fn);
    const fnTokens = getTokens(fn);

    // 1. Direct SKU match in filename
    if (fn.includes(pSku)) {
      bestMatch = { img, reason: 'EXACT_SKU_IN_FILENAME', score: 100 };
      break;
    }

    // 2. Specific OB number matching (e.g. ob-001 -> ob-001 or ob 001)
    if (pSku.startsWith('ob-') && pSku.length <= 6) {
      const code = pSku.replace('ob-', '');
      // If code appears as whole word or with OB
      if (new RegExp(`\\bob[ -]?0*${parseInt(code, 10)}\\b`, 'i').test(fn)) {
        bestMatch = { img, reason: 'EXACT_OB_CODE_MATCH', score: 95 };
        break;
      }
    }

    // 3. Brand + Product specific name matching
    // Check key tokens overlap
    const commonTokens = pTokens.filter(t => fnTokens.includes(t));
    const tokenScore = commonTokens.length / Math.max(pTokens.length, 1);

    // Require critical brand or model match if present
    const brandLower = prod.brand.toLowerCase();
    const hasBrand = brandLower !== 'officebazzar' && (fn.includes(brandLower) || rel.includes(brandLower));

    let score = tokenScore * 10;
    if (hasBrand) score += 5;

    // Specific volume check (e.g. 500ml, 5 litre)
    const volMatch = prod.name.match(/\b(\d+)\s*(ml|ltr|litre|l|gm|kg)\b/i);
    if (volMatch) {
      const volStr = volMatch[0].toLowerCase().replace(/\s+/, '');
      if (fn.includes(volStr) || fn.includes(volMatch[1])) {
        score += 3;
      } else {
        score -= 5; // Volume mismatch penalty!
      }
    }

    if (score > bestScore && tokenScore >= 0.6) {
      bestScore = score;
      bestMatch = { img, reason: `TOKEN_MATCH (${commonTokens.join(' ')})`, score };
    }
  }

  // Acceptance threshold: must be high confidence
  if (bestMatch && bestScore >= 8) {
    matched.push({
      product: prod,
      supplierImage: bestMatch.img.relPath,
      reason: bestMatch.reason,
      score: bestMatch.score
    });
  } else {
    missing.push({
      product: prod,
      reason: 'NO_VERIFIED_SUPPLIER_IMAGE_IN_ARCHIVE'
    });
  }
}

console.log(`\n========================================`);
console.log(`PURE SUPPLIER ARCHIVE MATCHING RESULTS:`);
console.log(`Total Products Checked: ${catalogProducts.length}`);
console.log(`Matched from 2,365 Supplier Archive: ${matched.length}`);
console.log(`Missing from Supplier Archive: ${missing.length}`);
console.log(`========================================\n`);

fs.writeFileSync('scripts/pure_supplier_matched.json', JSON.stringify(matched, null, 2), 'utf8');
fs.writeFileSync('scripts/pure_supplier_missing.json', JSON.stringify(missing, null, 2), 'utf8');

