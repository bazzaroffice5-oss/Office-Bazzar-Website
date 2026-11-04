const fs = require('fs');
const path = require('path');

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(full));
    } else if (entry.isFile()) {
      results.push({
        relativePath: path.relative('Office Bazzar New Images', full).replace(/\\/g, '/'),
        filename: entry.name,
        fullPath: full,
        folder: path.basename(dir),
        size: fs.statSync(full).size
      });
    }
  }
  return results;
}

const files = getAllFiles('Office Bazzar New Images');
console.log('Total files in Office Bazzar New Images:', files.length);

// Group by folder
const folders = {};
files.forEach(f => {
  const parts = f.relativePath.split('/');
  const topFolder = parts[0];
  folders[topFolder] = (folders[topFolder] || 0) + 1;
});

console.log('Folders breakdown:');
for (const [f, count] of Object.entries(folders)) {
  console.log(`- ${f}: ${count} files`);
}

fs.writeFileSync('scripts/all_2369_supplier_files_index.json', JSON.stringify(files, null, 2), 'utf8');
console.log('Wrote scripts/all_2369_supplier_files_index.json');
