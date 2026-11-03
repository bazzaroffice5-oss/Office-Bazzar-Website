const fs = require('fs');
const results = JSON.parse(fs.readFileSync('initial_match_results.json', 'utf8'));
const inv = JSON.parse(fs.readFileSync('audit_2369_inventory.json', 'utf8'));

const unmatched = results.filter(r => !r.topMatch);
console.log('Total unmatched:', unmatched.length);

console.log('\nFirst 20 unmatched catalogue products:');
unmatched.slice(0, 20).forEach(p => {
  console.log(`[${p.sku}] ${p.name} (${p.brand}) -> Category: ${p.category} / ${p.subcategory}`);
});

console.log('\nSearching for keywords for some of these in package:');
const sampleKeywords = ['Cardboard Tag File', 'Punch Folder', 'Stick File', 'Kangaro', 'Stapler', 'Banian', 'Scrubbing Pad', 'Napkin', 'Dustbin'];

sampleKeywords.forEach(kw => {
  const matches = inv.filter(i => i.fileName.toLowerCase().includes(kw.toLowerCase()));
  console.log(`Keyword "${kw}": found ${matches.length} files in package. Sample:`, matches.slice(0, 3).map(m => m.fileName));
});

