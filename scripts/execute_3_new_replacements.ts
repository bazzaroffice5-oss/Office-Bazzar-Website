import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

interface Target {
  sku: string;
  name: string;
  brand: string;
  url: string;
  targetPath: string;
  sourceType: string;
}

const TARGETS: Target[] = [
  {
    sku: 'OB-PAP-06',
    name: 'JK Cedar Copier Paper (80/100 GSM) A4',
    brand: 'JK Paper',
    url: 'https://www.jkpaper.com/product-jk-cedar.png',
    targetPath: 'public/assets/products/copier-papers/ob-pap-06-jk-cedar-copier-paper-80-100-gsm-a4.webp',
    sourceType: 'JK Paper Official Manufacturer Master Asset'
  },
  {
    sku: 'OB-PAP-10',
    name: 'TNPL Platinum Copier Paper 75 GSM A4',
    brand: 'TNPL',
    url: 'https://cdn.moglix.com/p/TXYnpr6whlSad-xxlarge.jpg',
    targetPath: 'public/assets/products/copier-papers/ob-pap-10-tnpl-platinum-copier-paper-75-gsm-a4.webp',
    sourceType: 'TNPL Platinum Authorized Catalog Photography'
  },
  {
    sku: 'OB-PEN-39',
    name: 'Rorito Flymax Gel Pen',
    brand: 'Rorito',
    url: 'https://www.roritoworld.com/wp-content/uploads/2024/11/flymax-gx-blue-cone-2.png',
    targetPath: 'public/assets/products/stationery/ob-pen-39-rorito-flymax-gel-pen.webp',
    sourceType: 'Rorito Official Manufacturer Website Asset'
  }
];

async function main() {
  console.log('Downloading and standardizing 3 new verified brand master assets...');

  for (const t of TARGETS) {
    console.log(`Fetching [${t.sku}] from ${t.url}...`);
    const res = await fetch(t.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      console.error(`Failed to download ${t.sku}: HTTP ${res.status}`);
      continue;
    }

    const rawBuffer = Buffer.from(await res.arrayBuffer());
    const originalMeta = await sharp(rawBuffer).metadata();
    console.log(`Original: ${originalMeta.width}x${originalMeta.height}, format: ${originalMeta.format}, size: ${rawBuffer.length} bytes`);

    // Target dimension: 1000x1000 (within 800-1200 range)
    // Scale product to 900x900 inside 1000x1000 with 50px margins
    const targetDimension = 1000;
    const contentDimension = 900;
    const margin = 50;

    const standardized = await sharp(rawBuffer)
      .resize({
        width: contentDimension,
        height: contentDimension,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .extend({
        top: margin,
        bottom: margin,
        left: margin,
        right: margin,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: 92 })
      .toBuffer();

    const fullTarget = path.join(process.cwd(), t.targetPath);
    fs.writeFileSync(fullTarget, standardized);
    const resultMeta = await sharp(standardized).metadata();
    console.log(`Saved ${t.sku} to ${t.targetPath} (${standardized.length} bytes, ${resultMeta.width}x${resultMeta.height} WebP)`);
  }
}

main().catch(console.error);
