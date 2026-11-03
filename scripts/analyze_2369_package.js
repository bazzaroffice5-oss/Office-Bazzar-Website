const fs = require('fs');
const path = require('path');

const entries = fs.readFileSync('all_2369_zip_entries.txt', 'utf8').split(/\r?\n/).filter(Boolean);

const extensions = {};
const folders = {};
let nonImageFiles = [];

entries.forEach(entry => {
  const ext = path.extname(entry).toLowerCase();
  extensions[ext || '(no ext)'] = (extensions[ext || '(no ext)'] || 0) + 1;

  const parts = entry.split('/');
  if (parts.length > 1) {
    const folder = parts.slice(0, parts.length - 1).join('/');
    folders[folder] = (folders[folder] || 0) + 1;
  } else {
    folders['(root)'] = (folders['(root)'] || 0) + 1;
  }

  if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext)) {
    nonImageFiles.push(entry);
  }
});

console.log('--- EXTENSIONS ---');
console.log(extensions);

console.log('\n--- TOP FOLDERS ---');
const sortedFolders = Object.entries(folders).sort((a, b) => b[1] - a[1]);
sortedFolders.slice(0, 30).forEach(([f, count]) => {
  console.log(`${f}: ${count}`);
});

console.log('\n--- NON IMAGE FILES ---');
console.log(nonImageFiles);

