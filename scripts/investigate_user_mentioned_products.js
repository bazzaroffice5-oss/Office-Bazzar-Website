const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

const searchTerms = [
  'card', 'folder', 'visiting',
  'scrub', 'pad', 'sponge',
  'cloth', 'checked', 'check', 'kitchen', 'towel',
  'bottle', 'copper', 'water', 'stainless',
  'garbage', 'bag', 'dustbin',
  'adapter', 'cable', 'wire',
  'punch', 'stapler', 'report', 'stick'
];

console.log('Searching Office Bazzar New Images for user mentioned keywords...\n');

for (const term of searchTerms) {
  const matches = validImages.filter(img => img.rel.toLowerCase().includes(term));
  console.log(`=== Term: "${term}" (${matches.length} matches) ===`);
  matches.slice(0, 5).forEach(m => console.log(`   ${m.rel}`));
}
