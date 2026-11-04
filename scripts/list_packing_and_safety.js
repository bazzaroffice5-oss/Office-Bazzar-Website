const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

console.log('=== PACKING PRODUCT FILES ===');
const packing = allFiles.filter(f => f.folder === 'Packing Product' || f.relativePath.startsWith('Packing Product/'));
packing.forEach((f, i) => console.log(`${i+1}. ${f.filename}`));

console.log('\n=== SAFETY ITEMS FILES ===');
const safety = allFiles.filter(f => f.folder === 'Safety Items' || f.relativePath.startsWith('Safety Items/'));
safety.forEach((f, i) => console.log(`${i+1}. ${f.filename}`));

