const fs = require('fs');

const unmapped143 = JSON.parse(fs.readFileSync('scripts/current_unmapped_164.json', 'utf8'));
// We already mapped 21 of them, let's get the currently unmapped ones from catalog.ts
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const rawStart = cat.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = cat.indexOf('export const INITIAL_PRODUCTS: Product[] =');
const rawStr = cat.slice(rawStart, rawEnd);

const prods = [];
const blocks = rawStr.split(/\n\s*\{\s*\n\s*"id":/);

for (let i = 1; i < blocks.length; i++) {
  const b = '{\n    "id":' + blocks[i];
  const skuM = b.match(/"sku":\s*"([^"]+)"/);
  const nameM = b.match(/"name":\s*"([^"]+)"/);
  const catM = b.match(/"categoryName":\s*"([^"]+)"/);
  const imgM = b.match(/"images":\s*\[([\s\S]*?)\]/);

  const images = [];
  if (imgM) {
    const lines = imgM[1].split('\n');
    lines.forEach(l => {
      const im = l.match(/"([^"]+)"/);
      if (im) images.push(im[1]);
    });
  }

  if (images.length === 0 || images[0].includes('placeholder')) {
    prods.push({
      sku: skuM ? skuM[1] : '',
      name: nameM ? nameM[1] : '',
      category: catM ? catM[1] : ''
    });
  }
}

console.log(`Currently unmapped catalog products: ${prods.length}`);

const distinctData = JSON.parse(fs.readFileSync('scripts/distinct_uncatalogued_groups.json', 'utf8'));
const groupKeys = Object.keys(distinctData.groups);

// Compare prods with groupKeys
const potentialMatches = [];
prods.forEach(p => {
  const pNameLower = p.name.toLowerCase();
  const words = pNameLower.split(/\s+/).filter(w => w.length > 3 && !['pack', 'suppliers', 'chennai', 'with', 'inch', 'piece', 'size'].includes(w));
  
  const matchedGroups = groupKeys.filter(gk => {
    const gkLower = gk.toLowerCase();
    return words.some(w => gkLower.includes(w));
  });

  if (matchedGroups.length > 0) {
    potentialMatches.push({
      sku: p.sku,
      name: p.name,
      matchedCount: matchedGroups.length,
      sample: matchedGroups.slice(0, 3)
    });
  }
});

console.log(`Potential name-overlap matches found in uncatalogued groups: ${potentialMatches.length}`);
potentialMatches.slice(0, 25).forEach(m => {
  console.log(`[${m.sku}] ${m.name} -> matches:`);
  m.sample.forEach(s => console.log(`    ${s}`));
});

