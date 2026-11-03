const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'Office Bazzar New Images');
const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

const placeholders = JSON.parse(fs.readFileSync('scripts/placeholders_178.json', 'utf8'));

console.log('Searching for matches in specific folders...');

function searchCandidates(patterns, filterFolder) {
  return validImages.filter(img => {
    if (filterFolder && !img.rel.startsWith(filterFolder)) return false;
    const lower = img.rel.toLowerCase();
    return patterns.some(p => lower.includes(p.toLowerCase()));
  });
}

// 1. Housekeeping search
const hkCandidates = [
  { sku: 'OB-GAR-1031', name: 'Garbage Bag - Small', patterns: ['Garbage Bag', 'Clean India'], folder: 'Garbage Bag' },
  { sku: 'OB-108', name: 'Chemical Trigger Spray Bottle', patterns: ['Trigger Spray', 'Plastic Trigger', 'Spray Bottle'], folder: 'Sprayer Pump' },
  { sku: 'OB-130', name: 'Urinal Screen Anti-Splash Mats', patterns: ['Urinal Screen', 'Anti-Splash'], folder: 'Urinal Screen' },
  { sku: 'OB-086', name: 'Rubber Welcome Mat', patterns: ['Mat', 'Rubber Mat'], folder: 'Mat' },
  { sku: 'OB-089', name: 'Plastic Handheld Dustpan', patterns: ['Dustpan'], folder: 'Bucket-Mug-Tray' },
  { sku: 'OB-071', name: 'SS Push Can Dustbin', patterns: ['Push', 'Can', 'Stainless Steel Push'], folder: 'Dustbin' },
  { sku: 'OB-073', name: 'Commercial Glass Wiper', patterns: ['Glass Wiper', 'Window Wiper'], folder: 'Wiper' },
  { sku: 'OB-075', name: 'Kitchen Counter Wiper', patterns: ['Kitchen', 'Counter'], folder: 'Wiper' },
  { sku: 'OB-078', name: 'Table Top Wiper', patterns: ['Table', 'Tabletop'], folder: 'Hygenic Tools and Trolly' },
  { sku: 'OB-058', name: 'Carpet Brush (Hard / Soft)', patterns: ['Carpet Brush'], folder: 'Cleaning Brush' },
  { sku: 'OB-059', name: 'Road Cleaning Brush', patterns: ['Road Cleaning'], folder: 'Cleaning Brush' },
  { sku: 'OB-062', name: 'Cobweb Stick Sunflower', patterns: ['Cobweb', 'Sunflower'], folder: 'Cleaning Brush' },
  { sku: 'OB-083', name: 'Heavy Duty Mop Stick Handle', patterns: ['Mop Stick', 'Mop Handle'], folder: 'Collage' },
  { sku: 'OB-102', name: 'Cleaning Caddy Basket Organizer', patterns: ['Caddy', 'Basket'], folder: 'Bucket-Mug-Tray' },
  { sku: 'OB-109', name: 'Goodknight Mosquito Repellent Machine Set', patterns: ['Good Knight Flash', 'Liquid Vaporiser'], folder: 'Hit and Disinfectant Spray' },
  { sku: 'OB-112', name: 'PVC Hard Broom', patterns: ['PVC', 'Broom'], folder: 'Brooms And Sticks' },
  { sku: 'OB-TIS-1101', name: 'Toilet Roll Big', patterns: ['JRT', 'Jumbo Rolled', 'Toilet Roll'], folder: 'Tissue Product' }
];

console.log('\n--- Housekeeping Candidates ---');
for (const c of hkCandidates) {
  const matches = searchCandidates(c.patterns, c.folder);
  console.log(`\nSKU: ${c.sku} | ${c.name}`);
  if (matches.length > 0) {
    matches.slice(0, 4).forEach(m => console.log(`   -> ${m.rel}`));
  } else {
    console.log('   (NO MATCH FOUND)');
  }
}

