const fs = require('fs');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const mixFiles = inventory.filter(x => x.rel.startsWith('Mix'));

console.log('Total Mix files:', mixFiles.length);
mixFiles.slice(0, 30).forEach(m => console.log(' ', m.rel));
