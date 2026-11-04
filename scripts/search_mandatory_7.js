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

function searchTerms(terms) {
  const qList = terms.map(t => t.toLowerCase());
  return all.filter(f => {
    const nameLower = f.name.toLowerCase();
    const relLower = f.rel.toLowerCase();
    return qList.some(q => nameLower.includes(q) || relLower.includes(q));
  });
}

console.log('--- 1. Lamination / Kent ---');
console.log(searchTerms(['lamination', 'laminate', 'ks12', 'ks-12', 'kent']));

console.log('--- 2. Adaptor / Cable ---');
console.log(searchTerms(['adaptor', 'adapter', 'cable', 'hdmi']));

console.log('--- 3. Notice / Pin Up / Board ---');
console.log(searchTerms(['pin up', 'pinup', 'notice', 'soft board', 'bulletin', 'display board']));

console.log('--- 4. Wooden Stand / Board Stand ---');
console.log(searchTerms(['wooden stand', 'board stand', 'easel', 'tripod stand']));

console.log('--- 5. Gobbler / Shredder ---');
console.log(searchTerms(['gobbler', 'shredder', 'shredding', 'a2326']));

console.log('--- 6. Canon / Toner / EP 303 ---');
console.log(searchTerms(['canon', 'ep 303', 'ep303', 'toner']));

console.log('--- 7. Samsung / MLT / Cartridge ---');
console.log(searchTerms(['samsung', 'mlt', 'd116s', '116s']));

