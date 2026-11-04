const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const dustbinFiles = allFiles.filter(f => f.folder.toLowerCase().includes('dustbin'));
console.log('Total dustbin files:', dustbinFiles.length);

const cartoon = dustbinFiles.filter(f => {
  const n = f.filename.toLowerCase();
  return n.includes('cartoon') || n.includes('character') || n.includes('penguin') || n.includes('animal') || n.includes('frog') || n.includes('panda') || n.includes('duck') || n.includes('bear') || n.includes('kid') || n.includes('child');
});

console.log('Cartoon/Character dustbin matches:', cartoon.length);
cartoon.forEach(c => console.log(`  ${c.folder} / ${c.filename}`));

console.log('\nSample other dustbin files:');
dustbinFiles.slice(0, 15).forEach(d => console.log(`  ${d.folder} / ${d.filename}`));

