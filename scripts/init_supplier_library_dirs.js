const fs = require('fs');
const path = require('path');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const allFiles = JSON.parse(fs.readFileSync('scripts/all_2369_supplier_files_index.json', 'utf8'));

console.log('Total files loaded:', allFiles.length);

const targetBaseDir = 'public/assets/supplier-library';
if (!fs.existsSync(targetBaseDir)) {
  fs.mkdirSync(targetBaseDir, { recursive: true });
}

// Let's create category subfolders
const folders = new Set(allFiles.map(f => f.folder));
for (const folder of folders) {
  const folderSlug = slugify(folder);
  const dir = path.join(targetBaseDir, folderSlug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

console.log(`Created ${folders.size} subdirectories in ${targetBaseDir}`);

