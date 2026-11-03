const fs = require('fs');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

function search(terms) {
  const tArr = Array.isArray(terms) ? terms : [terms];
  return validImages.filter(img => {
    const rel = img.rel.toLowerCase();
    return tArr.some(t => rel.includes(t.toLowerCase()));
  });
}

console.log('--- Stapler / Punch ---');
search(['stapler', 'punching', 'punch', 'kangaro']).forEach(m => console.log(' ', m.rel));

console.log('\n--- Tape ---');
search(['tape', 'bopp', 'cello', 'adhesive']).slice(0, 25).forEach(m => console.log(' ', m.rel));

console.log('\n--- Wiper / Floor Wiper ---');
search(['wiper', 'squeegee']).slice(0, 25).forEach(m => console.log(' ', m.rel));

console.log('\n--- Caddy / Organizer ---');
search(['caddy', 'organizer', 'tray']).slice(0, 20).forEach(m => console.log(' ', m.rel));

console.log('\n--- Broom / Hard Broom ---');
search(['hard broom', 'pvc broom', 'broom']).slice(0, 25).forEach(m => console.log(' ', m.rel));
