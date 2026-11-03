const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

function search(terms) {
  const tArr = Array.isArray(terms) ? terms : [terms];
  return validImages.filter(img => {
    const rel = img.rel.toLowerCase();
    return tArr.some(t => rel.includes(t.toLowerCase()));
  });
}

console.log('--- 1. Scrubbing Pad / Scrub Pad ---');
search(['scrub pad', 'scouring pad', 'cleaning pad', 'sponge pad']).forEach(m => console.log(' ', m.rel));

console.log('\n--- 2. Cloth (Checked, Banian, Towel) ---');
search(['check', 'banian', 'cotton', 'kitchen check', 'duster cloth']).forEach(m => console.log(' ', m.rel));

console.log('\n--- 3. Housekeeping Chemicals ---');
search(['chemical', 'cif', 'diversey', 'taski', 'colin', 'harpic', 'lizol', 'hi-clean']).slice(0, 15).forEach(m => console.log(' ', m.rel));

console.log('\n--- 4. Bottles ---');
search(['bottle', 'water bottle']).forEach(m => console.log(' ', m.rel));

console.log('\n--- 5. Garbage Bags ---');
search(['garbage bag']).forEach(m => console.log(' ', m.rel));

console.log('\n--- 6. Folder / File / Visiting Card ---');
search(['card', 'visiting', 'report', 'stick file', 'punch folder', 'display panel', 'binder']).forEach(m => console.log(' ', m.rel));

console.log('\n--- 7. Punching Machine / Stapler / Kangaro ---');
search(['punch', 'staple', 'kangaro', 'dp 600', '10d', 'hd-10']).forEach(m => console.log(' ', m.rel));

console.log('\n--- 8. Keyboard / Tray / Cable / Adapter ---');
search(['keyboard', 'tray', 'cable', 'adapter', 'wire']).forEach(m => console.log(' ', m.rel));
