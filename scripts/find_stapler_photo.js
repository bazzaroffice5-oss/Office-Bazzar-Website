const fs = require('fs');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

const matches = validImages.filter(img => {
  const rel = img.rel.toLowerCase();
  return rel.includes('staple') || rel.includes('kangaro') || rel.includes('hd 10') || rel.includes('hd-10');
});

console.log('Stapler / Kangaro matches:', matches.length);
matches.forEach(m => console.log(' ', m.rel));

