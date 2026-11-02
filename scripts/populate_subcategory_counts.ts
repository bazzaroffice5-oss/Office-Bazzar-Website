import * as fs from 'fs';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

// Calculate exact subcategory counts from INITIAL_PRODUCTS
const subCounts: Record<string, number> = {};
for (const p of INITIAL_PRODUCTS) {
  if (p.subcategoryId) {
    subCounts[p.subcategoryId] = (subCounts[p.subcategoryId] || 0) + 1;
  }
}

console.log('Calculated Subcategory Counts:', subCounts);

let content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// For each subcategory id in subCounts, ensure itemCount is set
for (const [subId, count] of Object.entries(subCounts)) {
  // Regex to match the subcategory block by "id": "subId"
  // and insert "itemCount": count, if not present
  const regex = new RegExp(`("id":\\s*"${subId}",[\\s\\S]*?"imageUrl":\\s*"[^"]+")`, 'g');
  content = content.replace(regex, (match) => {
    if (match.includes('"itemCount":')) {
      return match.replace(/"itemCount":\s*\d+/, `"itemCount": ${count}`);
    }
    return `${match},\n    "itemCount": ${count}`;
  });
}

fs.writeFileSync('src/lib/data/catalog.ts', content, 'utf8');
console.log('Successfully updated src/lib/data/catalog.ts with exact subcategory item counts.');

