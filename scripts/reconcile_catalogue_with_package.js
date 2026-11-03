const fs = require('fs');
const path = require('path');

const catalogProducts = JSON.parse(fs.readFileSync('catalog_products_dump.json', 'utf8'));
const packageInventory = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8')).filter(i => i.isImage && !i.isCorrupted);

console.log(`Loaded ${catalogProducts.length} catalogue products and ${packageInventory.length} valid images from package.`);

// Tokenizer & normalizer helper
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[_\-\/\(\)\.,&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(str) {
  return normalize(str).split(' ').filter(t => t.length > 1);
}

// Index package images
const indexedImages = packageInventory.map(img => {
  const normName = normalize(img.fileName.replace(/\.[^/.]+$/, ''));
  const normRel = normalize(img.relPath.replace(/\.[^/.]+$/, ''));
  const tokens = new Set([...getTokens(normName), ...getTokens(normRel)]);
  return {
    ...img,
    normName,
    normRel,
    tokens
  };
});

// Match each catalogue product
const matchResults = [];

catalogProducts.forEach(prod => {
  const prodSku = prod.sku.toUpperCase();
  const prodName = prod.name;
  const prodBrand = prod.brandName || '';
  const prodCategory = prod.categoryName || '';
  const prodSubcategory = prod.subcategoryName || '';
  const prodPack = prod.packSize || '';

  const nameTokens = getTokens(prodName);
  const brandTokens = getTokens(prodBrand);
  const allProdTokens = [...nameTokens, ...brandTokens];

  const candidates = [];

  for (const img of indexedImages) {
    let score = 0;
    const matchReasons = [];

    // Check SKU match in filename
    if (img.normName.includes(prodSku.toLowerCase()) || img.normRel.includes(prodSku.toLowerCase())) {
      score += 100;
      matchReasons.push('SKU match');
    }

    // Check exact name substring in filename
    const cleanProdName = normalize(prodName);
    if (cleanProdName.length > 4 && img.normName.includes(cleanProdName)) {
      score += 80;
      matchReasons.push('Exact product name in filename');
    }

    // Check brand match
    let brandMatch = false;
    for (const bt of brandTokens) {
      if (bt.length > 2 && img.tokens.has(bt)) {
        brandMatch = true;
        score += 25;
        matchReasons.push(`Brand match: ${bt}`);
        break;
      }
    }

    // Check token overlaps
    let overlapCount = 0;
    for (const nt of nameTokens) {
      if (nt.length > 2 && img.tokens.has(nt)) {
        overlapCount++;
        score += 10;
      }
    }

    // Category folder alignment bonus
    const normCategory = normalize(prodCategory);
    const normSubcategory = normalize(prodSubcategory);
    if (img.normRel.includes(normCategory) || (normSubcategory && img.normRel.includes(normSubcategory))) {
      score += 15;
      matchReasons.push('Category/Folder alignment');
    }

    // Penalties for conflicting brand or model numbers if detected
    if (score > 30) {
      candidates.push({
        image: img,
        score,
        overlapCount,
        reasons: matchReasons.join(', ')
      });
    }
  }

  // Sort candidates by score descending, then by image resolution
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const resA = (a.image.width || 0) * (a.image.height || 0);
    const resB = (b.image.width || 0) * (b.image.height || 0);
    return resB - resA;
  });

  const topMatch = candidates[0] || null;

  matchResults.push({
    sku: prod.sku,
    name: prod.name,
    brand: prod.brandName,
    category: prod.categoryName,
    subcategory: prod.subcategoryName,
    isActive: prod.isActive !== false,
    oldImage: prod.images && prod.images[0] ? prod.images[0] : '',
    candidateCount: candidates.length,
    topMatch: topMatch ? {
      relPath: topMatch.image.relPath,
      fileName: topMatch.image.fileName,
      score: topMatch.score,
      width: topMatch.image.width,
      height: topMatch.image.height,
      reasons: topMatch.reasons
    } : null,
    alternativeCandidates: candidates.slice(1, 5).map(c => ({
      relPath: c.image.relPath,
      fileName: c.image.fileName,
      score: c.score,
      reasons: c.reasons
    }))
  });
});

fs.writeFileSync('initial_match_results.json', JSON.stringify(matchResults, null, 2), 'utf8');

const matchedCount = matchResults.filter(r => r.topMatch && r.topMatch.score >= 50).length;
const lowScoreCount = matchResults.filter(r => r.topMatch && r.topMatch.score < 50).length;
const unmatchedCount = matchResults.filter(r => !r.topMatch).length;

console.log(`\nReconciliation Results (Threshold >= 50):`);
console.log(`Matched (Score >= 50): ${matchedCount}/${matchResults.length}`);
console.log(`Low Confidence (Score < 50): ${lowScoreCount}/${matchResults.length}`);
console.log(`Unmatched (0 candidates): ${unmatchedCount}/${matchResults.length}`);

