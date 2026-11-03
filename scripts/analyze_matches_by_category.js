const fs = require('fs');

const matches = JSON.parse(fs.readFileSync('deep_match_results.json', 'utf8'));

const catStats = {};

matches.forEach(m => {
  const cat = m.category || 'Unknown';
  if (!catStats[cat]) {
    catStats[cat] = { total: 0, matched: 0, none: 0 };
  }
  catStats[cat].total++;
  if (m.matchFound) catStats[cat].matched++;
  else catStats[cat].none++;
});

console.log('Category breakdown:');
console.table(catStats);

console.log('\nSample 15 Matched Products:');
matches.filter(m => m.matchFound).slice(0, 15).forEach(m => {
  console.log(`[${m.sku}] ${m.name} (${m.brand})`);
  console.log(`   -> Match (${m.matchConfidence}): ${m.bestMatch.relPath} (Score: ${m.bestMatch.score})`);
  console.log(`   -> Notes: ${m.bestMatch.notes}\n`);
});

