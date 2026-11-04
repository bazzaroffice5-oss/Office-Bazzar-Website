const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

const unmappedImages = webpManifest.filter(m => {
  return m.sku === 'N/A' || m.status === 'APPROVED_UNUSED_IMAGE' || m.status === 'PENDING_MANUAL_MATCHING';
});

console.log(`Processing ${unmappedImages.length} unmapped images...`);

// View / angle phrases to strip
const VIEW_PHRASES = [
  'front and back view', 'front and back', 'front and rear view', 'front and rear',
  'closed and open views', 'closed and open', 'front view', 'back view', 'side view',
  'top view', 'rear view', 'angled view', 'isometric view', 'diagonal view',
  'standing view', 'full view', 'close-up view', 'closeup view', 'perspective view',
  'flat view', 'whatsapp view', 'inside view', 'outdoor view', 'display view',
  'with packaging box', 'with product box', 'with 100 pcs box', 'with 50 pcs box',
  'with 12 pcs box', 'with box', 'with pouch', 'with refill', 'with clips',
  'pack of 10 boxes shrink wrapped', 'shrink wrapped close-up', 'shrink wrapped',
  'on digital weighing scale', 'on adjustable floor tripod stand', 'mounted on wall',
  'set of 4 colors', 'set of 4 piece', 'set of 4', 'set of 3', 'set of 5',
  '4-piece set', '5-piece set', '3-piece set', '2-piece set',
  'front', 'back', 'side', 'top', 'rear', 'angled', 'angle', 'closed', 'open',
  'inside', 'closeup', 'close up', 'pair', 'trio', 'stack', 'row', 'collage'
];

function extractBaseProductName(filename) {
  let name = filename.replace(/\.webp$|\.jpg$|\.jpeg$|\.png$/i, '');
  // remove (1), (2), etc.
  name = name.replace(/\(\d+\)/g, '').trim();
  
  // Clean punctuation
  name = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

  // Strip view phrases case-insensitively
  for (const phrase of VIEW_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    name = name.replace(regex, ' ');
  }

  // Remove trailing numbers or isolated single digits
  name = name.replace(/\b\d\b/g, ' ').replace(/\s+/g, ' ').trim();

  // Capitalize properly
  return name;
}

// Group images by folder + extracted base name
const groups = new Map();

unmappedImages.forEach(img => {
  const baseName = extractBaseProductName(img.originalFilename);
  const key = `${img.originalFolder}:::${baseName}`;

  if (!groups.has(key)) {
    groups.set(key, {
      folder: img.originalFolder,
      baseName,
      images: []
    });
  }
  groups.get(key).images.push(img);
});

console.log(`Grouped into ${groups.size} distinct product candidates.`);

// Distribution of image counts per group
const countDist = {};
groups.forEach(g => {
  const c = g.images.length;
  countDist[c] = (countDist[c] || 0) + 1;
});
console.log('Image count distribution per candidate product:', countDist);

// Print sample groups
console.log('\n--- 15 Sample Distinct Groups ---');
Array.from(groups.values()).slice(0, 15).forEach((g, idx) => {
  console.log(`[${idx + 1}] [${g.folder}] "${g.baseName}" -> ${g.images.length} images`);
  g.images.forEach(i => console.log(`      * ${i.originalFilename}`));
});

