const fs = require('fs');
const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));

const tech = inventory.filter(f => /toner|cartridge|epson|canon|samsung|sandisk|hard disk|projector|barcode/i.test(f.rel));
console.log('Tech matches in Office Bazzar New Images:', tech.length);
tech.forEach(t => console.log(' - ' + t.rel));
