import * as fs from 'fs';
const items = JSON.parse(fs.readFileSync('scripts/pending_93_items.json', 'utf8'));

console.log(`Analyzing ${items.length} pending items:`);
const byCategory: Record<string, any[]> = {};
for (const it of items) {
  byCategory[it.category] = byCategory[it.category] || [];
  byCategory[it.category].push(it);
}

for (const [cat, list] of Object.entries(byCategory)) {
  console.log(`\n=== ${cat} (${list.length} items) ===`);
  list.forEach(i => console.log(`  [${i.sku}] ${i.name}`));
}

