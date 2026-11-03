const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const umbrellaFiles = inventory.filter(x => x.rel.startsWith('Umbrella'));

console.log('Total Umbrella files:', umbrellaFiles.length);
umbrellaFiles.slice(0, 20).forEach(u => console.log(' ', u.rel));

