import * as fs from 'fs';
const data = JSON.parse(fs.readFileSync('scripts/audit_383_results.json', 'utf8'));
const watermarked = data.filter((d: any) => d.isWatermarked);

const brands = [
  'jk', 'tnpl', 'rorito', 'montex', 'reynolds', 'camlin', 'natraj', 'apsara', 'cello', 'luxor',
  'diversey', 'taski', 'vim', 'pril', 'exo', 'colgate', 'dettol', 'lifebuoy', 'godrej', 'hit',
  'all out', 'good knight', 'harpic', 'lysol', 'mr muscle', 'scotch', '3m', 'fevicol', 'casio',
  'canon', 'epson', 'hp', 'brother', 'kangaro', 'flair', 'staedtler', 'faber', 'bindex', 'solo',
  'oddy', 'classmate', 'century', 'bindal', 'b2b', 'nilkamal', 'sintex', 'aristo', 'karcher'
];

console.log('Searching for potential brand products among 95 watermarked items:');
const matches: any[] = [];
for (const w of watermarked) {
  const lower = (w.name + ' ' + w.category + ' ' + w.subcategory).toLowerCase();
  for (const b of brands) {
    if (lower.includes(b)) {
      matches.push({ sku: w.sku, name: w.name, brand: b, imagePath: w.imagePath });
      break;
    }
  }
}

console.log(`Found ${matches.length} brand matches:`);
matches.forEach(m => console.log(`- [${m.sku}] ${m.name} (Matched: ${m.brand}) -> ${m.imagePath}`));
