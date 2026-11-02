import * as fs from 'fs';
const data = JSON.parse(fs.readFileSync('scripts/audit_383_results.json', 'utf8'));
const watermarked = data.filter((d: any) => d.isWatermarked);

const lines = watermarked.map((w: any, i: number) => `${i + 1}. [${w.sku}] ${w.name}`);
fs.writeFileSync('scripts/all_95_watermarked_names.txt', lines.join('\n'), 'utf8');
console.log('Wrote 95 names to scripts/all_95_watermarked_names.txt');
