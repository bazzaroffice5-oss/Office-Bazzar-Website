import * as fs from 'fs';
const manifest = JSON.parse(fs.readFileSync('scripts/visual_gate_manifest.json', 'utf8'));

const testSkus = ['OB-005', 'OB-006', 'OB-007', 'OB-104', 'OB-138', 'OB-140', 'OB-141', 'OB-152', 'OB-EQP-87', 'OB-COM-1039'];
for (const sku of testSkus) {
  const item = manifest.find((m: any) => m.sku === sku);
  console.log(sku, item);
}

