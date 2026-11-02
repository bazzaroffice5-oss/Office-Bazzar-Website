import * as fs from 'fs';
const data = JSON.parse(fs.readFileSync('scripts/audit_383_results.json', 'utf8'));
const watermarked = data.filter((d: any) => d.isWatermarked);
console.log('Watermarked items count:', watermarked.length);
watermarked.forEach((w: any, idx: number) => {
  console.log(`${idx + 1}. [${w.sku}] ${w.name} | ${w.category} | ${w.subcategory} | ${w.imagePath}`);
});

