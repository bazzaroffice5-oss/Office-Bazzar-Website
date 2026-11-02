import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const base = path.join(process.cwd(), 'temp_prepared_383', 'OfficeBazzar_Product_Images');
const manualSkus = [
  'OB-STA-1008', 'OB-GAR-1033', 'OB-COM-1039', 'OB-PAC-1053',
  'OB-PAP-13', 'OB-PAP-14', 'OB-PAP-15', 'OB-PAP-16', 'OB-FIL-29',
  'OB-COV-13', 'OB-COV-14', 'OB-COV-15', 'OB-COV-16'
];

async function inspectManual() {
  const rows = JSON.parse(fs.readFileSync('scripts/prepared_parsed_rows.json', 'utf8'));
  const manualRows = rows.filter((r: any) => manualSkus.includes(r.sku));

  console.log(`Inspecting ${manualRows.length} MANUAL_VISUAL_REVIEW_REQUIRED images:`);

  for (const r of manualRows) {
    const p = path.join(base, r.prepFile);
    const meta = await sharp(p).metadata();
    const stat = fs.statSync(p);
    console.log(`\nSKU: ${r.sku} | Name: ${r.name}`);
    console.log(`  File: ${r.prepFile}`);
    console.log(`  Dimensions: ${meta.width}x${meta.height}, Size: ${(stat.size / 1024).toFixed(1)} KB`);
    console.log(`  Original Dimensions: ${r.origDimensions}, Format: ${r.origFormat}`);
    console.log(`  Original Audit Status: ${r.origAuditStatus}`);
    console.log(`  Note: ${r.note}`);
  }
}

inspectManual().catch(console.error);
