import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const base = path.join(process.cwd(), 'temp_prepared_383', 'OfficeBazzar_Product_Images');
const csvFile = path.join(base, 'prepared-image-mapping.csv');
const missingCsv = path.join(base, 'missing-or-error.csv');
const readmeFile = path.join(base, 'README.txt');
const imagesDir = path.join(base, 'images');

interface Row {
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

function parseCsv(text: string): Row[] {
  const lines = text.trim().split('\n');
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const tokens: string[] = [];
    let cur = '';
    let inQ = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        if (inQ && line[c + 1] === '"') {
          cur += '"';
          c++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        tokens.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    tokens.push(cur);
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

async function verifyStep2() {
  console.log('=== STEP 2: EXTRACT AND VALIDATE ZIP ===');

  console.log('1. Checking file existence:');
  console.log(' - prepared-image-mapping.csv:', fs.existsSync(csvFile));
  console.log(' - missing-or-error.csv:', fs.existsSync(missingCsv));
  console.log(' - README.txt:', fs.existsSync(readmeFile));
  console.log(' - images/:', fs.existsSync(imagesDir));

  const rows = parseCsv(fs.readFileSync(csvFile, 'utf8'));
  console.log(`\n2. CSV Row Count: ${rows.length}`);

  // Check unique SKUs
  const skuSet = new Set(rows.map(r => r.sku));
  console.log(`3. Unique SKUs in CSV: ${skuSet.size} (Duplicates: ${rows.length - skuSet.size})`);

  // Check unique image filenames
  const fileSet = new Set(rows.map(r => r.prepFile));
  console.log(`4. Unique Image Filenames in CSV: ${fileSet.size} (Duplicates: ${rows.length - fileSet.size})`);

  // Check disk files
  const diskFiles = fs.readdirSync(imagesDir);
  console.log(`5. Files in images/ directory: ${diskFiles.length}`);

  // Check all CSV paths exist on disk, are 1200x1200 WebP, and can be decoded
  let allExist = true;
  let all1200 = true;
  let allWebp = true;
  let allDecodable = true;
  let invalidImages: any[] = [];

  for (const r of rows) {
    const full = path.join(base, r.prepFile);
    if (!fs.existsSync(full)) {
      allExist = false;
      invalidImages.push({ sku: r.sku, error: 'File does not exist' });
      continue;
    }

    try {
      const meta = await sharp(full).metadata();
      if (meta.width !== 1200 || meta.height !== 1200) {
        all1200 = false;
        invalidImages.push({ sku: r.sku, error: `Invalid dimensions: ${meta.width}x${meta.height}` });
      }
      if (meta.format !== 'webp') {
        allWebp = false;
        invalidImages.push({ sku: r.sku, error: `Invalid format: ${meta.format}` });
      }
    } catch (err: any) {
      allDecodable = false;
      invalidImages.push({ sku: r.sku, error: `Cannot decode: ${err.message}` });
    }
  }

  console.log(`6. All CSV image paths exist on disk: ${allExist}`);
  console.log(`7. All images can be decoded: ${allDecodable}`);
  console.log(`8. Every prepared image is 1200 x 1200 WebP: ${all1200 && allWebp}`);
  console.log(`9. Invalid images count: ${invalidImages.length}`);

  fs.writeFileSync('scripts/step2_validation_report.json', JSON.stringify({
    totalRows: rows.length,
    uniqueSkus: skuSet.size,
    uniqueFiles: fileSet.size,
    diskFiles: diskFiles.length,
    allExist,
    all1200,
    allWebp,
    allDecodable,
    invalidImages
  }, null, 2), 'utf8');
  console.log('Saved scripts/step2_validation_report.json');
}

verifyStep2().catch(console.error);
