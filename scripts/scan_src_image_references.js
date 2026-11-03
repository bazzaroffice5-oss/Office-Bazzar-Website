const fs = require('fs');
const path = require('path');

function searchSrc(dir) {
  let references = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      references = references.concat(searchSrc(full));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.json')) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.match(/['"]\/(?:assets|images|uploads)\/[^'"]+\.(?:webp|jpg|jpeg|png|svg)['"]/g);
      if (matches) {
        references.push({ file: path.relative(process.cwd(), full), matches });
      }
    }
  }
  return references;
}

const refs = searchSrc(path.join(process.cwd(), 'src'));
console.log('Total files in src referencing assets/images/uploads:', refs.length);
refs.forEach(r => {
  const productRefs = r.matches.filter(m => m.includes('/products/') || m.includes('copier') || m.includes('stationery') || m.includes('packaging'));
  if (productRefs.length > 0) {
    console.log(r.file, ':', productRefs.slice(0, 5));
  }
});
