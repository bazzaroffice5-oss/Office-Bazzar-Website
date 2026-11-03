const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));

const matches = inv.filter(f => /adapter|cable|cord|lead|power/i.test(f.rel));
console.log('Matches for adapter/cable/cord/lead/power:', matches.length);
matches.forEach(m => console.log(' - ' + m.rel));
