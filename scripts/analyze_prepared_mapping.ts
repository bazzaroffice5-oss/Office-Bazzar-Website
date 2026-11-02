import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

interface CsvRow {
  sku: string;
  name: string;
  category: string;
  origDimensions: string;
  prepDimensions: string;
  origFormat: string;
  prepFile: string;
  origAuditStatus: string;
  prepStatus: string;
  note: string;
}

function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText.trim().split('\n');
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // CSV parser taking quotes into account
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        if (inQuotes && line[c + 1] === '"') {
          current += '"';
          c++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        tokens.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    tokens.push(current);

    if (tokens.length >= 10) {
      rows.push({
        sku: tokens[0].trim(),
        name: tokens[1].trim(),
        category: tokens[2].trim(),
        origDimensions: tokens[3].trim(),
        prepDimensions: tokens[4].trim(),
        origFormat: tokens[5].trim(),
        prepFile: tokens[6].trim(),
        origAuditStatus: tokens[7].trim(),
        prepStatus: tokens[8].trim(),
        note: tokens[9].trim(),
      });
    }
  }
  return rows;
}

async function main() {
  const base = path.join(process.cwd(), 'temp_prepared_383', 'OfficeBazzar_Product_Images');
  const csvPath = path.join(base, 'prepared-image-mapping.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvContent);

  console.log(`Parsed ${rows.length} rows from prepared-image-mapping.csv.`);

  // 1. Group by Prepared Status
  const statusCounts: Record<string, number> = {};
  for (const r of rows) {
    statusCounts[r.prepStatus] = (statusCounts[r.prepStatus] || 0) + 1;
  }
  console.log('Prepared Status Counts:', statusCounts);

  // 2. Verify all image files exist and can be decoded
  let missingFiles = 0;
  let non1200Count = 0;
  let corruptCount = 0;

  for (const r of rows) {
    const fullImgPath = path.join(base, r.prepFile);
    if (!fs.existsSync(fullImgPath)) {
      console.error(`Missing image file for SKU ${r.sku}: ${fullImgPath}`);
      missingFiles++;
      continue;
    }

    try {
      const meta = await sharp(fullImgPath).metadata();
      if (meta.width !== 1200 || meta.height !== 1200) {
        console.warn(`Non-1200x1200 image for SKU ${r.sku}: ${meta.width}x${meta.height}`);
        non1200Count++;
      }
      if (meta.format !== 'webp') {
        console.warn(`Non-webp image for SKU ${r.sku}: ${meta.format}`);
      }
    } catch (err: any) {
      console.error(`Corrupt image for SKU ${r.sku}: ${err.message}`);
      corruptCount++;
    }
  }

  console.log(`Image Validation: Missing=${missingFiles}, Non-1200x1200=${non1200Count}, Corrupt=${corruptCount}`);

  // 3. Match against catalog
  const catalogSkuMap = new Map(INITIAL_PRODUCTS.map(p => [p.sku, p]));
  let catalogMismatches = 0;
  for (const r of rows) {
    if (!catalogSkuMap.has(r.sku)) {
      console.error(`SKU not in catalog: ${r.sku}`);
      catalogMismatches++;
    }
  }
  console.log(`Catalog SKU mismatches: ${catalogMismatches} (Catalog total: ${INITIAL_PRODUCTS.length})`);

  // 4. Detail the 13 MANUAL_VISUAL_REVIEW_REQUIRED items
  const manualItems = rows.filter(r => r.prepStatus === 'MANUAL_VISUAL_REVIEW_REQUIRED');
  console.log('\n=== MANUAL_VISUAL_REVIEW_REQUIRED (13 SKUs) ===');
  manualItems.forEach(m => console.log(`[${m.sku}] ${m.name} (${m.category}) -> ${m.prepFile}`));

  // 5. Detail the 22 BRAND_REPLACEMENT_CANDIDATE_VISUAL_RECHECK items
  const brandItems = rows.filter(r => r.prepStatus === 'BRAND_REPLACEMENT_CANDIDATE_VISUAL_RECHECK');
  console.log(`\n=== BRAND_REPLACEMENT_CANDIDATE_VISUAL_RECHECK (${brandItems.length} SKUs) ===`);
  brandItems.forEach(b => console.log(`[${b.sku}] ${b.name} (${b.category}) -> ${b.prepFile}`));

  fs.writeFileSync('scripts/prepared_parsed_rows.json', JSON.stringify(rows, null, 2), 'utf8');
}

main().catch(console.error);
