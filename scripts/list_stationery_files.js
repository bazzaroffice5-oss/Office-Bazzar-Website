const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const stationeryFiles = allFiles.filter(f => f.folder === 'Stationery' || f.relativePath.startsWith('Stationery/'));
console.log('Total files in Stationery:', stationeryFiles.length);

stationeryFiles.forEach((f, i) => {
  console.log(`${i+1}. ${f.filename}`);
});
