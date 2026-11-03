const fs = require('fs');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync('catalog_products_dump.json', 'utf8'));
const inventory = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8')).filter(i => i.isImage && !i.isCorrupted);

// Clean string helper
function clean(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[_\-\/\(\)\.,&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenize
function tokens(str) {
  return clean(str).split(' ').filter(w => w.length > 1);
}

// Map each image
const imageDb = inventory.map(img => {
  const cName = clean(img.fileName.replace(/\.[^/.]+$/, ''));
  const cRel = clean(img.relPath.replace(/\.[^/.]+$/, ''));
  const tSet = new Set([...tokens(cName), ...tokens(cRel)]);
  return {
    ...img,
    cName,
    cRel,
    tSet
  };
});

// Special specific mappings / keywords for domain terms in Office Bazzar
const SPECIAL_MATCHERS = [
  // Shoe Cover Dispenser
  { test: p => p.name.includes('Shoe Cover Dispenser'), match: img => img.cName.includes('shoe cover') || img.cRel.includes('shoe cover') },
  // Paper Cup Dispenser
  { test: p => p.name.includes('Paper Cup Dispenser'), match: img => img.cName.includes('paper cup') || (img.cName.includes('cup') && img.cRel.includes('dispenser')) },
  // Jet Hand Dryer / Hand Dryer
  { test: p => p.name.toLowerCase().includes('hand dryer'), match: img => img.cName.includes('hand dryer') || img.cRel.includes('hand dryer') },
  // Vacuum Cleaner
  { test: p => p.name.toLowerCase().includes('vacuum cleaner'), match: img => img.cName.includes('vacuum cleaner') },
  // Shoe Polish Machine
  { test: p => p.name.toLowerCase().includes('shoe polish'), match: img => img.cName.includes('shoe polish') },
  // Feather Duster
  { test: p => p.name.toLowerCase().includes('feather duster'), match: img => img.cName.includes('feather duster') || img.cName.includes('duster') },
  // Queue Manager
  { test: p => p.name.toLowerCase().includes('queue manager'), match: img => img.cName.includes('queue') || img.cName.includes('stanchion') },
  // Soap Dispenser
  { test: p => p.name.toLowerCase().includes('soap dispenser'), match: img => img.cName.includes('soap dispenser') || (img.cName.includes('dispenser') && img.cRel.includes('dispenser')) },
  // Tissue Dispenser / Roll Dispenser
  { test: p => p.name.toLowerCase().includes('roll dispenser') || p.name.toLowerCase().includes('tissue dispenser'), match: img => img.cName.includes('dispenser') && (img.cName.includes('tissue') || img.cName.includes('roll') || img.cName.includes('hrt')) },
  // Air Freshener Dispenser
  { test: p => p.name.toLowerCase().includes('air freshener dispenser'), match: img => img.cName.includes('aerosol dispenser') || img.cName.includes('air freshener dispenser') || img.cName.includes('freshmatic') },
  // Caddy Basket
  { test: p => p.name.toLowerCase().includes('caddy basket'), match: img => img.cName.includes('caddy basket') || img.cName.includes('caddy') },
  // Wringer Trolley
  { test: p => p.name.toLowerCase().includes('wringer trolley'), match: img => img.cName.includes('wringer trolley') || img.cName.includes('wringer') },
  // Platform Trolley
  { test: p => p.name.toLowerCase().includes('platform trolley'), match: img => img.cName.includes('platform trolley') || img.cName.includes('trolley') },
  // Janitor Trolley
  { test: p => p.name.toLowerCase().includes('janitor') && p.name.toLowerCase().includes('trolley'), match: img => img.cName.includes('janitor') },
  // Dustbin
  { test: p => p.name.toLowerCase().includes('dustbin') || p.name.toLowerCase().includes('dust bin') || p.name.toLowerCase().includes('waste bin'), match: img => img.cRel.includes('dustbin') || img.cName.includes('dustbin') || img.cName.includes('bin') },
  // Wiper
  { test: p => p.name.toLowerCase().includes('wiper'), match: img => img.cRel.includes('wiper') || img.cName.includes('wiper') },
  // Mop
  { test: p => p.name.toLowerCase().includes('mop'), match: img => img.cRel.includes('mop') || img.cName.includes('mop') },
  // Broom
  { test: p => p.name.toLowerCase().includes('broom'), match: img => img.cRel.includes('broom') || img.cName.includes('broom') },
  // Brush
  { test: p => p.name.toLowerCase().includes('brush'), match: img => img.cRel.includes('brush') || img.cName.includes('brush') },
  // Cloth / Microfiber / Banian
  { test: p => p.name.toLowerCase().includes('cloth') || p.name.toLowerCase().includes('towel'), match: img => img.cRel.includes('cloth') || img.cName.includes('cloth') || img.cName.includes('towel') },
  // Mat
  { test: p => p.name.toLowerCase().includes('mat'), match: img => img.cRel.includes('mat') || img.cName.includes('mat') },
  // Gloves
  { test: p => p.name.toLowerCase().includes('gloves') || p.name.toLowerCase().includes('glove'), match: img => img.cRel.includes('gloves') || img.cName.includes('gloves') },
  // Mask
  { test: p => p.name.toLowerCase().includes('mask') || p.name.toLowerCase().includes('face shield'), match: img => img.cRel.includes('mask') || img.cName.includes('mask') },
  // Garbage Bag
  { test: p => p.name.toLowerCase().includes('garbage bag'), match: img => img.cRel.includes('garbage bag') || img.cName.includes('garbage bag') },
  // Scrubber / Scotch Brite
  { test: p => p.name.toLowerCase().includes('scrubber') || p.name.toLowerCase().includes('pad'), match: img => img.cRel.includes('scrubber') || img.cName.includes('scrubber') || img.cName.includes('pad') },
  // Urinal Screen
  { test: p => p.name.toLowerCase().includes('urinal screen'), match: img => img.cRel.includes('urinal screen') || img.cName.includes('urinal screen') },
  // Sani Cubes / Naphthalene
  { test: p => p.name.toLowerCase().includes('sani') || p.name.toLowerCase().includes('naphthalene') || p.name.toLowerCase().includes('cubes') || p.name.toLowerCase().includes('odonil'), match: img => img.cRel.includes('sani cubes') || img.cName.includes('sani') || img.cName.includes('air freshener') }
];

const results = [];

catalog.forEach(p => {
  const pName = p.name;
  const pBrand = p.brandName || '';
  const pSku = p.sku;
  const cleanName = clean(pName);
  const cleanBrand = clean(pBrand);
  const nameTokens = tokens(pName);

  let candidates = [];

  // 1. Check special category matchers
  for (const sm of SPECIAL_MATCHERS) {
    if (sm.test(p)) {
      for (const img of imageDb) {
        if (sm.match(img)) {
          // Check brand or word match
          let score = 50;
          if (cleanBrand && img.tSet.has(cleanBrand)) score += 30;
          for (const t of nameTokens) {
            if (img.tSet.has(t)) score += 10;
          }
          candidates.push({ img, score, type: 'domain_matcher' });
        }
      }
    }
  }

  // 2. Direct string & brand matching across all images
  for (const img of imageDb) {
    let score = 0;
    if (img.cName.includes(cleanName) && cleanName.length > 5) {
      score += 100;
    }
    let brandFound = false;
    if (cleanBrand && (img.tSet.has(cleanBrand) || img.cName.includes(cleanBrand))) {
      brandFound = true;
      score += 30;
    }
    let overlap = 0;
    for (const t of nameTokens) {
      if (['pack', 'size', 'standard', 'unit', 'all', 'inch', 'with'].includes(t)) continue;
      if (img.tSet.has(t)) {
        overlap++;
        score += 15;
      }
    }
    if (score >= 45) {
      candidates.push({ img, score, type: 'text_matcher' });
    }
  }

  // Deduplicate candidates by relative path
  const seenPaths = new Set();
  const uniqueCandidates = [];
  for (const c of candidates) {
    if (!seenPaths.has(c.img.relPath)) {
      seenPaths.add(c.img.relPath);
      uniqueCandidates.push(c);
    }
  }

  // Sort by score desc, then resolution desc
  uniqueCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.img.width * b.img.height) - (a.img.width * a.img.height);
  });

  const best = uniqueCandidates[0] || null;

  results.push({
    sku: p.sku,
    name: p.name,
    brand: p.brandName,
    category: p.categoryName,
    subcategory: p.subcategoryName,
    isActive: p.isActive !== false,
    oldImage: p.images && p.images[0] ? p.images[0] : '',
    hasMatch: best !== null,
    bestMatch: best ? {
      relPath: best.img.relPath,
      fileName: best.img.fileName,
      score: best.score,
      width: best.img.width,
      height: best.img.height,
      type: best.type
    } : null,
    candidateCount: uniqueCandidates.length,
    candidates: uniqueCandidates.slice(0, 5).map(c => ({
      relPath: c.img.relPath,
      score: c.score
    }))
  });
});

fs.writeFileSync('full_catalog_matching.json', JSON.stringify(results, null, 2), 'utf8');

const matched = results.filter(r => r.hasMatch);
const unmatched = results.filter(r => !r.hasMatch);

console.log(`Matched products: ${matched.length}/${results.length}`);
console.log(`Unmatched products: ${unmatched.length}/${results.length}`);

