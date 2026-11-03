const fs = require('fs');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

const staImages = validImages.filter(x => x.rel.toLowerCase().startsWith('stationery') || x.rel.toLowerCase().startsWith('folders'));

console.log(`Stationery images: ${staImages.length}`);
staImages.forEach(m => console.log(' ', m.rel));
