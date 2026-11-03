const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignore = ['node_modules', '.next', '.git'];

function scan(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir)) {
    if (ignore.includes(item)) continue;
    const full = path.join(dir, item);
    const st = fs.statSync(full);
    const rel = path.relative(root, full);
    if (st.isDirectory()) {
      results.push({ type: 'dir', rel, full, size: 0 });
      results = results.concat(scan(full));
    } else {
      results.push({ type: 'file', rel, full, size: st.size, ext: path.extname(item).toLowerCase() });
    }
  }
  return results;
}

const all = scan(root);
console.log('Total files and folders (excluding node_modules/.next/.git):', all.length);

const dirs = all.filter(x => x.type === 'dir');
console.log('\n--- DIRECTORIES LIST ---');
dirs.forEach(d => console.log(' - ' + d.rel));

const zips = all.filter(x => x.ext === '.zip' || x.ext === '.tar' || x.ext === '.gz' || x.ext === '.rar');
console.log('\n--- ARCHIVE FILES ---');
zips.forEach(z => console.log(` - ${z.rel} (${(z.size / 1024 / 1024).toFixed(2)} MB)`));

