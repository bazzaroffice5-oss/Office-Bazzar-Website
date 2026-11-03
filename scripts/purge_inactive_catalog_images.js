const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');
const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));

const activeFiles = new Set();
for (const m of manifest) {
  activeFiles.add(`${m.sku}.webp`);
  m.altRelatives.forEach((_, idx) => {
    activeFiles.add(`${m.sku}-alt-${idx + 1}.webp`);
  });
}

console.log(`Active required files: ${activeFiles.size}`);

const onDisk = fs.readdirSync(dir);
console.log(`Files currently on disk: ${onDisk.length}`);

let purged = 0;
for (const f of onDisk) {
  if (!activeFiles.has(f)) {
    fs.unlinkSync(path.join(dir, f));
    purged++;
    console.log(`Purged inactive file: ${f}`);
  }
}

console.log(`Purged ${purged} inactive files. Directory now contains exactly ${fs.readdirSync(dir).length} files.`);

