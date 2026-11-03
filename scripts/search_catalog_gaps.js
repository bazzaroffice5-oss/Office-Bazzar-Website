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

console.log('--- Paper / Copier / JK / TNPL ---');
search(['copier', 'paper', 'jk', 'tnpl']).forEach(m => console.log(' ', m.rel));

console.log('\n--- Pen / Pencil / Marker / Nataraj / Cello ---');
search(['pen', 'pencil', 'marker', 'nataraj', 'reynolds']).forEach(m => console.log(' ', m.rel));

console.log('\n--- Road Safety / Traffic / Cone / Mirror ---');
search(['cone', 'traffic', 'barrier', 'speed breaker', 'mirror', 'bollard', 'road']).forEach(m => console.log(' ', m.rel));
