const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'Office Bazzar New Images');
const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

function searchCandidates(patterns, filterFolder) {
  return validImages.filter(img => {
    if (filterFolder && !img.rel.startsWith(filterFolder)) return false;
    const lower = img.rel.toLowerCase();
    return patterns.some(p => lower.includes(p.toLowerCase()));
  });
}

const staCandidates = [
  { sku: 'OB-BOA-1049', name: 'White Board Duster', patterns: ['White Board Duster', 'Chalk Board and Non Magnetic White Board Duster'], folder: 'Stationery' },
  { sku: 'OB-BOA-1050', name: 'A4 Display Folders', patterns: ['Magnetic Folder A4', 'Display Panel', 'Flip Folder'], folder: 'Stationery' },
  { sku: 'OB-DIS-1060', name: 'Double Sided Newspaper Stand', patterns: ['Magazine Brochure Display Stand Rack'], folder: 'Stationery' },
  { sku: 'OB-FIL-34', name: 'A4 Button File Folder', patterns: ['Button Bag FS', 'Button Bag'], folder: 'Stationery' },
  { sku: 'OB-NOT-71', name: 'Post-it Self Adhesive Sticky Notes Pad', patterns: ['Prompt Sticky Note Pad Multi Color 76x76mm', 'Prompt Sticky Note'], folder: 'Stationery' },
  { sku: 'OB-NOT-68', name: 'Steel Wire Gem Clips Pack', patterns: ['U Clips Triangular 26mm Nickel Plated Box with Clips', 'U Clips'], folder: 'Stationery' },
  { sku: 'OB-PAC-1053', name: 'Floor Marking Tapes', patterns: ['Floor Masking Tape', 'Floor Marking'], folder: 'Stationery' },
  { sku: 'OB-RDS-11', name: 'Warning Bollard Delineator Post', patterns: ['Queue Manager SS', 'Stanchion Post'], folder: 'Safety Items' },
  { sku: 'OB-RDS-08', name: 'LED Traffic Baton Light Rechargeable', patterns: ['Baton', 'Light', 'Flare'], folder: 'Safety Items' },
  { sku: 'OB-RDS-21', name: 'Q-Manager A4 Sign Board Display Frame', patterns: ['Q Manager', 'Specification', 'Sign Board'], folder: 'Safety Items' }
];

console.log('\n--- Stationery & Safety Candidates ---');
for (const c of staCandidates) {
  const matches = searchCandidates(c.patterns, c.folder);
  console.log(`\nSKU: ${c.sku} | ${c.name}`);
  if (matches.length > 0) {
    matches.slice(0, 4).forEach(m => console.log(`   -> ${m.rel}`));
  } else {
    console.log('   (NO MATCH FOUND)');
  }
}
