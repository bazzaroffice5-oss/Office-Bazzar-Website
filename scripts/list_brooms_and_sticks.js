const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const broomFiles = allFiles.filter(f => f.folder.toLowerCase().includes('brooms and sticks') || f.relativePath.toLowerCase().startsWith('brooms and sticks/'));
console.log('Total broom files:', broomFiles.length);
broomFiles.forEach((f, i) => console.log(`${i+1}. ${f.filename}`));

