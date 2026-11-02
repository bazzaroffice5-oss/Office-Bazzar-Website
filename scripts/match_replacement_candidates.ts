import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';
import * as fs from 'fs';

const skusText = fs.readFileSync('scripts/skus_requiring_manual_replacement.txt', 'utf8');
const replacementSkus = skusText.trim().split('\n').map(l => {
  const [sku, name, cat, reason] = l.split(' | ');
  return { sku, name, cat, reason };
});

console.log(`Checking 115 SKUs against existing catalog and assets...`);

// First 101 products are the original WordPress / Zoho products
const legacyProducts = INITIAL_PRODUCTS.slice(0, 101);

const directMatches: any[] = [];
for (const rep of replacementSkus) {
  // Check if any legacy product has exact/very close name or brand
  for (const lp of legacyProducts) {
    const repWords = rep.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const lpWords = lp.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const common = repWords.filter(w => lpWords.includes(w));
    if (common.length >= 2 && lp.images?.[0]?.startsWith('http')) {
      directMatches.push({
        sku: rep.sku,
        name: rep.name,
        legacySku: lp.sku,
        legacyName: lp.name,
        legacyImg: lp.images[0]
      });
      break;
    }
  }
}

console.log(`Found ${directMatches.length} candidate matches from legacy WordPress CDN assets:`);
directMatches.forEach(m => console.log(`[${m.sku}] "${m.name}" <---> [${m.legacySku}] "${m.legacyName}": ${m.legacyImg}`));
