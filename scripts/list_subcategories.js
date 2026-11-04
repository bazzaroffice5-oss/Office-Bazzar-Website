const fs = require('fs');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/export const ALL_SUBCATEGORIES: Subcategory\[\] = (\[[\s\S]*?\n\];)/);
if (match) {
  const subs = eval(match[1]);
  console.log('Subcategories count:', subs.length);
  subs.forEach(s => console.log(`[${s.categoryId}] ${s.id} -> ${s.name}`));
}

