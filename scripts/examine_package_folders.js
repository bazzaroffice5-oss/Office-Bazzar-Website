const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8'));

// Group by top-level subfolder inside "Product Photo (4-3-26)"
const folders = {};

inv.forEach(item => {
  const parts = item.relPath.split('/');
  // parts[0] is "Product Photo (4-3-26)"
  const sub = parts[1] || '(root)';
  if (!folders[sub]) folders[sub] = [];
  folders[sub].push(item.fileName);
});

for (const [sub, fileList] of Object.entries(folders)) {
  console.log(`\n=== FOLDER: ${sub} (${fileList.length} files) ===`);
  console.log('Sample files:', fileList.slice(0, 5));
}

