const fs = require('fs');
const path = require('path');

const catalogProducts = JSON.parse(fs.readFileSync('catalog_products_dump.json', 'utf8'));
const packageInventory = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8')).filter(i => i.isImage && !i.isCorrupted);

console.log(`Starting deep matching for ${catalogProducts.length} catalogue products against ${packageInventory.length} package images...`);

// Clean helper
function cleanText(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getWords(str) {
  return cleanText(str).split(' ').filter(w => w.length > 1);
}

// Extract volume / capacity numbers like 500ml, 5l, 5 litre, 120 ltr, 19mm, r1, etc.
function extractSpecs(str) {
  const s = str.toLowerCase();
  const specs = new Set();
  
  // Litres / ml
  const litMatch = s.match(/(\d+)\s*(ltr|litre|litres|l\b)/);
  if (litMatch) specs.add(`${litMatch[1]}l`);

  const mlMatch = s.match(/(\d+)\s*ml\b/);
  if (mlMatch) specs.add(`${mlMatch[1]}ml`);

  // mm / inch
  const mmMatch = s.match(/(\d+)\s*mm\b/);
  if (mmMatch) specs.add(`${mmMatch[1]}mm`);

  const inchMatch = s.match(/(\d+)\s*inch\b/);
  if (inchMatch) specs.add(`${inchMatch[1]}inch`);

  // Codes like R1, R2, R3... R9, R20
  const rMatch = s.match(/\br(\d+)\b/);
  if (rMatch) specs.add(`r${rMatch[1]}`);

  // Model numbers like 3025, 403, 101, 10d, dp 600, etc.
  const modelMatch = s.match(/\b(3025|403|600|10d|1100|660|120|70|45|240|110)\b/);
  if (modelMatch) specs.add(modelMatch[1]);

  return Array.from(specs);
}

const preparedImages = packageInventory.map(img => {
  const normName = cleanText(img.fileName.replace(/\.[^/.]+$/, ''));
  const normRel = cleanText(img.relPath.replace(/\.[^/.]+$/, ''));
  const words = new Set([...getWords(normName), ...getWords(normRel)]);
  const specs = extractSpecs(img.fileName + ' ' + img.relPath);
  return {
    ...img,
    normName,
    normRel,
    words,
    specs
  };
});

const matchedProducts = [];

catalogProducts.forEach(prod => {
  const prodSku = prod.sku.toUpperCase();
  const prodName = prod.name;
  const prodBrand = prod.brandName || '';
  const prodCat = prod.categoryName || '';
  const prodSub = prod.subcategoryName || '';
  const prodPack = prod.packSize || '';

  const prodWords = getWords(prodName);
  const brandWords = getWords(prodBrand);
  const prodSpecs = extractSpecs(prodName + ' ' + prodPack + ' ' + (prod.description || ''));

  const candidates = [];

  for (const img of preparedImages) {
    let score = 0;
    const notes = [];

    // 1. Direct SKU match
    if (img.normName.includes(prodSku.toLowerCase()) || img.normRel.includes(prodSku.toLowerCase())) {
      score += 200;
      notes.push('Exact SKU match');
    }

    // 2. Exact name phrase match
    const cleanPName = cleanText(prodName);
    if (cleanPName.length > 5 && img.normName.includes(cleanPName)) {
      score += 120;
      notes.push('Exact product name match');
    }

    // 3. Spec alignment (e.g. 5l, 500ml, r1, 3025, etc.)
    let specMatches = 0;
    for (const sp of prodSpecs) {
      if (img.specs.includes(sp) || img.normName.includes(sp)) {
        specMatches++;
        score += 35;
        notes.push(`Spec match: ${sp}`);
      }
    }

    // 4. Brand match
    let hasBrand = false;
    for (const bw of brandWords) {
      if (bw.length > 2 && img.words.has(bw)) {
        hasBrand = true;
        score += 30;
        notes.push(`Brand match: ${bw}`);
        break;
      }
    }

    // Special brand synonyms:
    if (!hasBrand) {
      const pBrandLower = prodBrand.toLowerCase();
      if ((pBrandLower.includes('diversey') || pBrandLower.includes('taski')) && (img.words.has('diversey') || img.words.has('taski'))) {
        hasBrand = true;
        score += 30;
        notes.push('Brand synonym: Diversey/Taski');
      } else if (pBrandLower.includes('hi-clean') && (img.normRel.includes('hi clean') || img.normRel.includes('hiclean'))) {
        hasBrand = true;
        score += 30;
        notes.push('Brand synonym: Hi-Clean');
      } else if (pBrandLower.includes('aristo') && img.words.has('aristo')) {
        hasBrand = true;
        score += 30;
        notes.push('Brand match: Aristo');
      }
    }

    // 5. Significant word overlap
    let wordOverlap = 0;
    for (const pw of prodWords) {
      // Exclude generic stopwords
      if (['the', 'and', 'with', 'for', 'pcs', 'box', 'pack', 'set', 'size', 'standard', 'unit'].includes(pw)) continue;
      if (pw.length > 2 && img.words.has(pw)) {
        wordOverlap++;
        score += 15;
      }
    }

    // 6. Category alignment bonus
    const normCat = cleanText(prodCat);
    if (img.normRel.includes('dustbin') && normCat.includes('dustbin')) score += 20;
    if (img.normRel.includes('chemical') && (normCat.includes('cleaning') || normCat.includes('hygiene'))) score += 15;
    if (img.normRel.includes('tissue') && (prodName.toLowerCase().includes('tissue') || prodName.toLowerCase().includes('napkin'))) score += 25;
    if (img.normRel.includes('stationery') && normCat.includes('stationery')) score += 15;
    if (img.normRel.includes('wiper') && prodName.toLowerCase().includes('wiper')) score += 25;
    if (img.normRel.includes('dispenser') && prodName.toLowerCase().includes('dispenser')) score += 25;

    // Quality check: prefer images that are not collages or multiple items if single item is needed
    if (img.normRel.includes('collage') && !prodName.toLowerCase().includes('set')) {
      score -= 20;
    }

    if (score >= 45) {
      candidates.push({
        image: img,
        score,
        wordOverlap,
        notes: notes.join('; ')
      });
    }
  }

  // Sort candidates
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Prefer higher resolution
    const resA = (a.image.width || 0) * (a.image.height || 0);
    const resB = (b.image.width || 0) * (b.image.height || 0);
    return resB - resA;
  });

  const best = candidates[0] || null;

  matchedProducts.push({
    sku: prodSku,
    name: prodName,
    brand: prodBrand,
    category: prodCat,
    subcategory: prodSub,
    isActive: prod.isActive !== false,
    oldImage: prod.images && prod.images[0] ? prod.images[0] : '',
    matchFound: best !== null && best.score >= 50,
    matchConfidence: !best ? 'NONE' : best.score >= 90 ? 'VERY_HIGH' : best.score >= 65 ? 'HIGH' : best.score >= 50 ? 'MEDIUM' : 'LOW',
    bestMatch: best ? {
      relPath: best.image.relPath,
      fileName: best.image.fileName,
      score: best.score,
      width: best.image.width,
      height: best.image.height,
      notes: best.notes
    } : null,
    alternativeCount: candidates.length > 1 ? candidates.length - 1 : 0,
    galleryImages: candidates.slice(1, 4).map(c => ({
      relPath: c.image.relPath,
      score: c.score
    }))
  });
});

fs.writeFileSync('deep_match_results.json', JSON.stringify(matchedProducts, null, 2), 'utf8');

const veryHigh = matchedProducts.filter(p => p.matchConfidence === 'VERY_HIGH').length;
const high = matchedProducts.filter(p => p.matchConfidence === 'HIGH').length;
const med = matchedProducts.filter(p => p.matchConfidence === 'MEDIUM').length;
const none = matchedProducts.filter(p => p.matchConfidence === 'NONE').length;

console.log('\n--- MATCHING SUMMARY ---');
console.log(`Total Products: ${matchedProducts.length}`);
console.log(`VERY_HIGH Confidence (Score >= 90): ${veryHigh}`);
console.log(`HIGH Confidence (65 <= Score < 90): ${high}`);
console.log(`MEDIUM Confidence (50 <= Score < 65): ${med}`);
console.log(`Total Matched (Score >= 50): ${veryHigh + high + med}`);
console.log(`No match in package (NONE): ${none}`);

