import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';

async function scanAllLocalImages() {
  console.log('--- COMPREHENSIVE VISUAL PIXEL AUDIT (ALL 328 LOCAL IMAGES) ---');

  const localProducts = INITIAL_PRODUCTS.filter(p => !p.images[0].startsWith('http'));
  console.log(`Auditing ${localProducts.length} local images...`);

  const blankImages: any[] = [];
  const lowContrastImages: any[] = [];
  const verySmallImages: any[] = [];
  const normalImages: any[] = [];

  for (const p of localProducts) {
    const relPath = p.images[0].replace(/^\//, '');
    const fullPath = path.join(process.cwd(), 'public', relPath);

    if (!fs.existsSync(fullPath)) {
      blankImages.push({ sku: p.sku, name: p.name, reason: 'FILE_MISSING', path: relPath });
      continue;
    }

    const stat = fs.statSync(fullPath);
    const meta = await sharp(fullPath).metadata();
    const stats = await sharp(fullPath).stats();

    // Check if image is blank white
    // When an image is pure white or 99.9% white, mean of R, G, B > 250 and stdev < 8
    const isWhite = stats.channels.every(c => c.mean > 250 && c.stdev < 8);
    // When stdev is very low (< 12), the image has barely any contrast or content
    const isLowContrast = stats.channels.every(c => c.stdev < 15);

    if (isWhite || stat.size <= 1300) {
      blankImages.push({
        sku: p.sku,
        name: p.name,
        size: stat.size,
        path: relPath,
        category: p.categoryName,
        subcategory: p.subcategoryName,
        stdev: stats.channels.map(c => Math.round(c.stdev)),
        mean: stats.channels.map(c => Math.round(c.mean))
      });
    } else if (stat.size < 4000) {
      verySmallImages.push({
        sku: p.sku,
        name: p.name,
        size: stat.size,
        path: relPath,
        stdev: stats.channels.map(c => Math.round(c.stdev)),
        mean: stats.channels.map(c => Math.round(c.mean))
      });
    } else {
      normalImages.push({
        sku: p.sku,
        name: p.name,
        size: stat.size,
        path: relPath
      });
    }
  }

  console.log(`\nResults:`);
  console.log(`- Completely Blank / Empty Canvas Images: ${blankImages.length}`);
  console.log(`- Very Small (<4KB, low detail): ${verySmallImages.length}`);
  console.log(`- Normal / Good Detail Images: ${normalImages.length}`);

  console.log('\n--- BLANK / EMPTY CANVAS SKUS ---');
  blankImages.forEach((b, i) => {
    console.log(`${i + 1}. [${b.sku}] ${b.name} (${b.size} bytes) -> ${b.path}`);
  });

  console.log('\n--- VERY SMALL (<4KB) SKUS ---');
  verySmallImages.forEach((v, i) => {
    console.log(`${i + 1}. [${v.sku}] ${v.name} (${v.size} bytes) -> stdev: ${v.stdev.join(',')} mean: ${v.mean.join(',')}`);
  });

  fs.writeFileSync('scripts/pixel_audit_results.json', JSON.stringify({ blankImages, verySmallImages, normalImages }, null, 2));
}

scanAllLocalImages().catch(console.error);
