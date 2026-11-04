const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const brushFiles = allFiles.filter(f => f.folder.toLowerCase().includes('cleaning brush') || f.relativePath.toLowerCase().startsWith('cleaning brush/'));
console.log('Total brush files:', brushFiles.length);
brushFiles.forEach((f, i) => console.log(`${i+1}. ${f.filename}`));

