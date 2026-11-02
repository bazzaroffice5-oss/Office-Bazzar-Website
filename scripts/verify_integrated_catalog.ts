import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { INITIAL_PRODUCTS, CATEGORIES } from '../src/lib/data/catalog';

async function main() {
  console.log('=== VERIFYING INTEGRATED CATALOG ===');
  console.log('Total Products:', INITIAL_PRODUCTS.length);

  // Check unique SKUs and IDs
  const skus = new Set(INITIAL_PRODUCTS.map(p => p.sku));
  const ids = new Set(INITIAL_PRODUCTS.map(p => p.id));
  console.log('Unique SKUs:', skus.size);
  console.log('Unique IDs:', ids.size);

  let preparedCount = 0;
  let remoteCount = 0;
  let localOldCount = 0;
  let brokenCount = 0;

  for (const p of INITIAL_PRODUCTS) {
    const img = p.images[0];
    if (!img) {
      console.error('Empty image for:', p.sku);
      brokenCount++;
      continue;
    }

    if (img.startsWith('/assets/products/prepared_1200/')) {
      preparedCount++;
      const full = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
      if (!fs.existsSync(full)) {
        console.error('File missing:', p.sku, full);
        brokenCount++;
      }
    } else if (img.startsWith('http')) {
      remoteCount++;
    } else {
      localOldCount++;
      const full = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
      if (!fs.existsSync(full)) {
        console.error('File missing:', p.sku, full);
        brokenCount++;
      }
    }
  }

  console.log(`Image breakdown:
  - Integrated 1200x1200 WebP: ${preparedCount}
  - Retained Local Products: ${localOldCount}
  - Retained Remote WordPress CDN: ${remoteCount}
  - Broken / Missing: ${brokenCount}`);

  // Check category counts
  for (const cat of CATEGORIES) {
    const count = INITIAL_PRODUCTS.filter(p => p.categoryId === cat.id).length;
    console.log(`Category [${cat.name}]: expected ${cat.itemCount}, actual ${count}`);
  }
}

main().catch(console.error);
