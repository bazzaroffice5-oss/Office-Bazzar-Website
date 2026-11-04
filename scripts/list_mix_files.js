const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const mix = allFiles.filter(f => f.folder === 'Mix' || f.relativePath.startsWith('Mix/'));
console.log('Total files in Mix:', mix.length);

mix.forEach((f, i) => console.log(`${i+1}. [${f.folder}] ${f.filename}`));
