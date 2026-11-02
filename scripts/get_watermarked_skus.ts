import * as fs from 'fs';
const data = JSON.parse(fs.readFileSync('scripts/audit_383_results.json', 'utf8'));
const watermarkedSkus = data.filter((d: any) => d.isWatermarked).map((d: any) => d.sku);
console.log('Watermarked SKUs:', watermarkedSkus);
