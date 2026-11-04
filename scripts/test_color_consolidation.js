const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

const unmapped = webpManifest.filter(m => m.sku === 'N/A' || m.status === 'APPROVED_UNUSED_IMAGE' || m.status === 'PENDING_MANUAL_MATCHING');

const COLOR_KEYWORDS = [
  'red', 'blue', 'green', 'yellow', 'pink', 'black', 'white', 'gray', 'grey',
  'orange', 'purple', 'violet', 'cyan', 'brown', 'peach', 'gold', 'silver', 'multicolor', 'multi color'
];

function cleanTitleWithColors(filename) {
  let name = filename.replace(/\.webp$|\.jpg$|\.jpeg$|\.png$/i, '');
  name = name.replace(/\(\d+\)/g, '').trim();
  name = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

  // Strip colors as variants
  for (const c of COLOR_KEYWORDS) {
    name = name.replace(new RegExp(`\\b${c}\\b`, 'gi'), ' ');
  }

  // Strip view phrases
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

  for (const phrase of VIEW_PHRASES) {
    name = name.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), ' ');
  }

  name = name.replace(/\b\d\b/g, ' ').replace(/\s+/g, ' ').trim();
  return name.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

const groups = new Map();
unmapped.forEach(img => {
  const base = cleanTitleWithColors(img.originalFilename);
  const key = `${img.originalFolder}:::${base}`;
  if (!groups.has(key)) groups.set(key, { folder: img.originalFolder, base, images: [] });
  groups.get(key).images.push(img);
});

console.log(`With color variant consolidation: ${groups.size} distinct product groups.`);

