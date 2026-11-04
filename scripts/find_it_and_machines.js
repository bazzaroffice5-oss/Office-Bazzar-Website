const fs = require('fs');

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

const targets = ['toner', 'cartridge', 'ep', '303', 'canon', 'hp', 'samsung', 'print', 'shred', 'machine', 'stand', 'cable', 'board', 'disk', 'pen drive', 'calculator', 'projector'];

const found = [];
allFiles.forEach(f => {
  const lower = (f.folder + ' ' + f.filename).toLowerCase();
  for (const t of targets) {
    if (lower.includes(t)) {
      found.push({ target: t, folder: f.folder, filename: f.filename, path: f.relativePath });
      break;
    }
  }
});

console.log('Total matches found:', found.length);
found.forEach(m => console.log(`[${m.target}] ${m.folder} / ${m.filename}`));

