import * as fs from 'fs';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

const obCom = INITIAL_PRODUCTS.find(p => p.sku === 'OB-COM-1039');
console.log('=== OB-COM-1039 ===');
console.log(JSON.stringify(obCom, null, 2));

const manifest = fs.readFileSync('scripts/skus_requiring_manual_replacement.txt', 'utf8');
const pendingLines = manifest.split('\n').filter(l => l.startsWith('[PENDING]'));
console.log(`\nTotal Pending Lines: ${pendingLines.length}`);

const pendingSkus = pendingLines.map(l => {
  const m = l.match(/\[PENDING\]\s+([A-Z0-9-]+)\s+\|\s+(.*?)\s+\|\s+(.*?)\s+\|/);
  return m ? { sku: m[1], name: m[2], category: m[3] } : null;
}).filter(Boolean);

fs.writeFileSync('scripts/pending_93_items.json', JSON.stringify(pendingSkus, null, 2), 'utf8');
console.log('Saved scripts/pending_93_items.json');

