const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const standFiles = allFiles.filter(f => f.filename.toLowerCase().includes('stand') || f.relativePath.toLowerCase().includes('stand'));
console.log('Total files with "stand":', standFiles.length);
standFiles.forEach((f, i) => console.log(`${i+1}. [${f.folder}] ${f.filename}`));
