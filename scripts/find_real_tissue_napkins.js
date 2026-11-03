const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const d of list) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) results = results.concat(walk(full));
    else if (/\.(jpg|jpeg|png|webp)$/i.test(d.name)) {
      results.push({
        rel: path.relative(SOURCE_DIR, full),
        name: d.name
      });
    }
  }
  return results;
}

const all = walk(SOURCE_DIR);
console.log('--- ALL FILES MATCHING NAPKIN ---');
const napkins = all.filter(f => f.name.toLowerCase().includes('napkin'));
napkins.forEach(f => console.log(' ', f.rel));

console.log('\n--- ALL FILES IN Tissue Product FOLDER ---');
const tissues = all.filter(f => f.rel.startsWith('Tissue Product'));
tissues.forEach(f => console.log(' ', f.rel));
