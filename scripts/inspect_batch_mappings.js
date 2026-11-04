const fs = require('fs');

const b1 = fs.readFileSync('scripts/process_and_map_batch_16.js', 'utf8');
const b2 = fs.readFileSync('scripts/process_and_map_batch_safety.js', 'utf8');

console.log('--- Batch 16 sample ---');
const m1 = b1.match(/const mappings = (\[[\s\S]*?\n\];)/);
if (m1) {
  const arr = eval(m1[1]);
  console.log('Batch 16 entries:', arr.length);
  arr.forEach(x => console.log(x.sku, x.images.map(i => i.out + ' <- ' + i.file).join(', ')));
}

console.log('--- Batch Safety sample ---');
const m2 = b2.match(/const mappings = (\[[\s\S]*?\n\];)/);
if (m2) {
  const arr2 = eval(m2[1]);
  console.log('Batch Safety entries:', arr2.length);
  arr2.forEach(x => console.log(x.sku, x.images.map(i => i.out + ' <- ' + i.file).join(', ')));
}

