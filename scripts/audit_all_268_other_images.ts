import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

async function main() {
  console.log('Auditing the 268 other images (not in the 115 flagged list)...');

  const old115 = new Set(
    fs.readFileSync('scripts/skus_requiring_manual_replacement.txt', 'utf8')
      .split('\n')
      .filter(l => l.includes('['))
      .map(l => {
        const m = l.match(/\[(?:REPLACED|PENDING)\]\s+([A-Z0-9-]+)/);
        return m ? m[1] : '';
      })
      .filter(Boolean)
  );

  console.log(`Loaded ${old115.size} SKUs from previous 115 list.`);

  const otherProducts = INITIAL_PRODUCTS.filter(p => !old115.has(p.sku));
  console.log(`Found ${otherProducts.length} other products to audit.`);

  const auditReport: any[] = [];

  for (const p of otherProducts) {
    const img = p.images[0] || '';
    const isRemote = img.startsWith('http');
    let width = 0;
    let height = 0;
    let sizeBytes = 0;
    let isBlank = false;
    let isCorrupt = false;
    let notes = '';
    let status = 'PASS';

    if (isRemote) {
      // Test remote image
      try {
        const res = await fetch(img, { method: 'HEAD' });
        if (!res.ok) {
          status = 'FAIL_REMOTE_404';
          notes = `HTTP ${res.status}`;
        } else {
          sizeBytes = parseInt(res.headers.get('content-length') || '0', 10);
          notes = 'Remote CDN Asset (HTTP 200)';
        }
      } catch (err: any) {
        status = 'FAIL_REMOTE_ERROR';
        notes = err.message;
      }
    } else {
      const full = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
      if (!fs.existsSync(full)) {
        status = 'FAIL_FILE_NOT_FOUND';
        notes = 'Local file does not exist';
      } else {
        const stat = fs.statSync(full);
        sizeBytes = stat.size;
        try {
          const meta = await sharp(full).metadata();
          width = meta.width || 0;
          height = meta.height || 0;

          if (stat.size < 1500) {
            const stats = await sharp(full).stats();
            const allWhite = stats.channels.every(c => c.mean > 250 && c.stdev < 3);
            if (allWhite) {
              isBlank = true;
              status = 'FAIL_BLANK_CANVAS';
              notes = 'Pure blank canvas';
            }
          }
          if (width < 300 || height < 300) {
            status = 'WARN_LOW_RES';
            notes = `Low resolution: ${width}x${height}`;
          }
        } catch (err: any) {
          isCorrupt = true;
          status = 'FAIL_CORRUPT';
          notes = err.message;
        }
      }
    }

    auditReport.push({
      sku: p.sku,
      name: p.name,
      category: p.categoryName,
      subcategory: p.subcategoryName,
      image: img,
      isRemote,
      width,
      height,
      sizeBytes,
      status,
      notes
    });
  }

  const failures = auditReport.filter(a => a.status.startsWith('FAIL'));
  const warnings = auditReport.filter(a => a.status.startsWith('WARN'));
  const passes = auditReport.filter(a => a.status === 'PASS');

  console.log('=== AUDIT OF 268 OTHER PRODUCTS ===');
  console.log(`Total Inspected: ${auditReport.length}`);
  console.log(`Passed: ${passes.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (failures.length > 0) {
    console.log('FAILURES:');
    failures.forEach(f => console.log(`- [${f.sku}] ${f.name}: ${f.status} (${f.notes})`));
  }
  if (warnings.length > 0) {
    console.log('WARNINGS:');
    warnings.forEach(w => console.log(`- [${w.sku}] ${w.name}: ${w.status} (${w.notes})`));
  }

  fs.writeFileSync('scripts/audit_268_others.json', JSON.stringify(auditReport, null, 2), 'utf8');
}

main().catch(console.error);

