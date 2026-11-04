const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const keywords = [
  'stand', 'shred', 'gobbler', 'toner', 'cartridge', 'canon', 'board', 'tape', 'cutter',
  'stapler', 'punch', 'brush', 'phenyl', 'dustbin', 'cartoon', 'box', 'cone', 'safety',
  'mirror', 'barrier', 'copier', 'paper', 'jk', 'pen', 'pencil', 'marker', 'eraser',
  'sharpener', 'fevicol', 'gum', 'ruler', 'scale', 'calculator', 'projector', 'storage',
  'thermocol', 'carpet', 'road', 'delineator', 'bollard', 'stud', 'blinker', 'flasher',
  'rumble', 'speed', 'chock', 'stopper', 'scissor', 'barricade', 'baton', 'torch',
  'search light', 'megaphone', 'sign', 'signage', 'post'
];

console.log('--- SEARCHING SUPPLIER ARCHIVE ---');
for (const kw of keywords) {
  const matches = allFiles.filter(f => f.filename.toLowerCase().includes(kw) || f.relativePath.toLowerCase().includes(kw));
  if (matches.length > 0) {
    console.log(`\nKeyword "${kw}": ${matches.length} files found.`);
    matches.slice(0, 5).forEach(m => console.log(`   [${m.folder}] ${m.filename}`));
  }
}
