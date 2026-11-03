const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'Office Bazzar New Images');

// Load catalog
const catalogContent = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'data', 'catalog.ts'), 'utf8');

// Parse products
const products = [];
const regex = /\{\s*id:\s*['"]([^'"]+)['"],\s*sku:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*subcategory:\s*['"]([^'"]+)['"],[\s\S]*?images:\s*\[([\s\S]*?)\],/g;

let m;
while ((m = regex.exec(catalogContent)) !== null) {
  const [_, id, sku, name, category, subcategory, imgsRaw] = m;
  const imgs = imgsRaw.split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  products.push({ id, sku, name, category, subcategory, images: imgs });
}

console.log('Total catalog products:', products.length);
const missing = products.filter(p => p.images.length === 0);
console.log('Missing images products:', missing.length);

// Scan all images in Office Bazzar New Images
function scanDir(dir) {
  let list = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      list = list.concat(scanDir(full));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext) && st.size > 0) {
        list.push({ full, rel: path.relative(srcDir, full), name: item, ext, size: st.size });
      }
    }
  }
  return list;
}

const archiveImages = scanDir(srcDir);
console.log('Valid archive images:', archiveImages.length);

// Let us check categories of missing products
const missingByCat = {};
for (const p of missing) {
  const cat = `${p.category} > ${p.subcategory}`;
  missingByCat[cat] = (missingByCat[cat] || 0) + 1;
}
console.log('\nMissing products by category:');
for (const [k, v] of Object.entries(missingByCat).sort((a,b) => b[1] - a[1])) {
  console.log('  ' + k.padEnd(50) + ': ' + v);
}
