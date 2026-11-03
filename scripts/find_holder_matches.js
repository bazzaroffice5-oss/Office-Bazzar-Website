const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));

const matches = inv.filter(f => /holder|case|album|pocket|wallet/i.test(f.rel));
console.log('Matches for holder/case/album/pocket/wallet:', matches.length);
matches.forEach(m => console.log(' - ' + m.rel));

