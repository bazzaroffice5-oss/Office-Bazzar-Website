const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const targets = ['wood', 'easel', 'board', 'display', 'tripod', 'alkosign', 'notice'];
for (const t of targets) {
  const matches = allFiles.filter(f => f.filename.toLowerCase().includes(t) || f.relativePath.toLowerCase().includes(t));
  console.log(`\nMatches for "${t}": ${matches.length}`);
  matches.forEach(m => console.log(`  [${m.folder}] ${m.filename}`));
}
