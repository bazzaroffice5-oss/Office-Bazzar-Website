import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

async function main() {
  const flaggedSkus = [
    'OB-HOU-1027', 'OB-COM-1039', 'OB-TIS-1101', 'OB-004', 'OB-008', 'OB-020',
    'OB-035', 'OB-073', 'OB-074', 'OB-FIL-19', 'OB-NOT-67', 'OB-NOT-78',
    'OB-NOT-80', 'OB-EQP-89', 'OB-COV-03', 'OB-RDS-03', 'OB-RDS-06', 'OB-RDS-09',
    'OB-RDS-10', 'OB-RDS-11', 'OB-RDS-12', 'OB-RDS-15', 'OB-RDS-18', 'OB-RDS-20',
    'OB-RDS-21', 'OB-RDS-22', 'OB-RDS-23', 'OB-RDS-24', 'OB-RDS-26', 'OB-RDS-28',
    'OB-RDS-29', 'OB-RDS-30', 'OB-RDS-31', 'OB-RDS-34', 'OB-RDS-37', 'OB-RDS-39',
    'OB-RDS-40', 'OB-RDS-41', 'OB-RDS-42', 'OB-RDS-43'
  ];

  console.log(`Inspecting ${flaggedSkus.length} Flagged Images...`);

  for (const sku of flaggedSkus) {
    const prod = INITIAL_PRODUCTS.find((p) => p.sku === sku);
    if (!prod) {
      console.log(`SKU ${sku} not found!`);
      continue;
    }

    const img = prod.images[0];
    if (img.startsWith('http')) {
      console.log(`[REMOTE] ${sku} (${prod.name}): ${img}`);
    } else {
      const fullPath = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        const meta = await sharp(fullPath).metadata();
        const stats = await sharp(fullPath).stats();
        // Check if image is blank white (all channels close to 255 mean and low stdev)
        const isMostlyBlank = stats.channels.every(c => c.mean > 250 && c.stdev < 5);
        console.log(`[LOCAL] ${sku} (${prod.name}): ${img} | Size: ${stat.size} bytes | ${meta.width}x${meta.height} | Format: ${meta.format} | Blank?: ${isMostlyBlank}`);
      } else {
        console.log(`[LOCAL MISSING] ${sku} (${prod.name}): ${img}`);
      }
    }
  }
}

main().catch(console.error);
