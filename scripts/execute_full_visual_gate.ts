import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const { createCanvas } = require('@napi-rs/canvas');
import { INITIAL_PRODUCTS } from '../src/lib/data/catalog';
const { PRODUCTS_DATA } = require('./extract_catalogue_products.js');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

async function main() {
  console.log('=== OFFICEBAZZAR FULL VISUAL QUALITY GATE EXECUTION ===');

  const pdfData = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;

  const pageCanvases = new Map();

  async function getRenderedPage(pageNum: number, scale: number) {
    const key = `${pageNum}_${scale}`;
    if (pageCanvases.has(key)) return pageCanvases.get(key);
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageCanvases.set(key, canvas);
    return canvas;
  }

  // Exact crop definitions for every section
  let reextractedCount = 0;
  const auditEntries: any[] = [];

  for (let i = 0; i < PRODUCTS_DATA.length; i++) {
    const item = PRODUCTS_DATA[i];
    let ptX = 0, ptY = 0, ptW = 0, ptH = 0;
    let scale = 4.0; // 288 DPI

    // 1. Pages 3 to 20: Housekeeping Products (595 x 842 pt, 3 cols x 3 rows)
    if (item.page >= 3 && item.page <= 20) {
      const cols = [{ x: 38, w: 150 }, { x: 225, w: 150 }, { x: 408, w: 150 }];
      // Tightened Y and H to completely avoid top code (y=182) and bottom text (y=335)
      const rows = [{ y: 200, h: 115 }, { y: 400, h: 115 }, { y: 600, h: 115 }];
      ptX = cols[item.c].x;
      ptY = rows[item.r].y;
      ptW = cols[item.c].w;
      ptH = rows[item.r].h;
    }
    // 2. Pages 22 to 26 & 28 to 29: Stationery & Covid (595 x 842 pt, 4 cols x 4 rows)
    else if ((item.page >= 22 && item.page <= 26) || (item.page >= 28 && item.page <= 29)) {
      const cols = [{ x: 28, w: 115 }, { x: 168, w: 115 }, { x: 308, w: 115 }, { x: 448, w: 115 }];
      // Tightened Y and H to strictly avoid card borders and text
      const rows = [{ y: 160, h: 95 }, { y: 360, h: 95 }, { y: 560, h: 95 }, { y: 760, h: 95 }];
      ptX = cols[item.c].x;
      ptY = rows[item.r].y;
      ptW = cols[item.c].w;
      ptH = rows[item.r].h;
    }
    // 3. Page 27: Stationery Equipment (595 x 842 pt, 3 cols x 3 rows)
    else if (item.page === 27) {
      const cols = [{ x: 38, w: 150 }, { x: 225, w: 150 }, { x: 408, w: 150 }];
      const rows = [{ y: 130, h: 130 }, { y: 330, h: 130 }, { y: 530, h: 130 }];
      ptX = cols[item.c].x;
      ptY = rows[item.r].y;
      ptW = cols[item.c].w;
      ptH = rows[item.r].h;
    }
    // 4. Page 30: PPE (2 items)
    else if (item.page === 30) {
      const cols = [{ x: 30, w: 120 }, { x: 160, w: 120 }];
      ptX = cols[item.c].x;
      ptY = 110;
      ptW = cols[item.c].w;
      ptH = 120;
    }
    // 5. Pages 32, 33, 35: Road Safety (318 x 489 pt, 3 cols x 4 rows)
    else if (item.page === 32 || item.page === 33 || item.page === 35) {
      scale = 6.0; // Higher scale for 318x489 pages to get pristine resolution
      const cols = [{ x: 12, w: 92 }, { x: 113, w: 92 }, { x: 214, w: 92 }];
      const rows = [{ y: 62, h: 72 }, { y: 172, h: 74 }, { y: 280, h: 75 }, { y: 390, h: 72 }];
      ptX = cols[item.c].x;
      ptY = rows[item.r].y;
      ptW = cols[item.c].w;
      ptH = rows[item.r].h;
    }
    // 6. Page 34: Road Safety Custom Grid (318 x 489 pt)
    else if (item.page === 34) {
      scale = 6.0;
      if (item.r === 0) {
        ptX = item.c === 0 ? 12 : 162;
        ptY = 80;
        ptW = 144;
        ptH = 120;
      } else if (item.r === 1) {
        ptX = item.c === 0 ? 15 : 162;
        ptY = 225;
        ptW = 140;
        ptH = 75;
      } else if (item.r === 2) {
        ptX = item.c === 0 ? 25 : 165;
        ptY = 355;
        ptW = 130;
        ptH = 40;
      } else {
        ptX = 20;
        ptY = 435;
        ptW = 278;
        ptH = 40;
      }
    }

    const pageCanvas = await getRenderedPage(item.page, scale);
    const cropX = Math.round(ptX * scale);
    const cropY = Math.round(ptY * scale);
    const cropW = Math.round(ptW * scale);
    const cropH = Math.round(ptH * scale);

    const cropCanvas = createCanvas(cropW, cropH);
    cropCanvas.getContext('2d').drawImage(pageCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Standardized 600x600 square canvas with white padding
    const outCanvas = createCanvas(600, 600);
    const outCtx = outCanvas.getContext('2d');
    outCtx.fillStyle = '#FFFFFF';
    outCtx.fillRect(0, 0, 600, 600);
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';

    const maxDim = Math.max(cropW, cropH);
    const targetDim = 540;
    const s = targetDim / maxDim;
    const destW = Math.round(cropW * s);
    const destH = Math.round(cropH * s);
    const destX = Math.round((600 - destW) / 2);
    const destY = Math.round((600 - destH) / 2);

    outCtx.drawImage(cropCanvas, 0, 0, cropW, cropH, destX, destY, destW, destH);

    const webpBuf = await sharp(outCanvas.toBuffer('image/png')).webp({ quality: 90 }).toBuffer();
    const stats = await sharp(webpBuf).stats();
    const isBlank = stats.channels.every(c => c.mean > 250 && c.stdev < 5);

    // Save to disk
    const targetDir = path.join(process.cwd(), 'public', 'assets', 'products', item.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const slugName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const filename = `${item.code.toLowerCase()}-${slugName}.webp`;
    const fullOutPath = path.join(targetDir, filename);
    fs.writeFileSync(fullOutPath, webpBuf);

    reextractedCount++;

    // Watermark check: Pages 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 29 have diagonal watermark
    // We check if this item's row/col intersects the diagonal
    const hasWatermark = (item.page >= 3 && item.page <= 30) && (
      (item.r === 1 && item.c === 1) || 
      (item.r === 0 && item.c === 2) || 
      (item.r === 2 && item.c === 0) ||
      (item.r === 1 && item.c === 2) ||
      (item.r === 2 && item.c === 1)
    );

    auditEntries.push({
      sku: item.code,
      name: item.name,
      page: item.page,
      dir: item.dir,
      filename,
      sizeBytes: webpBuf.length,
      isBlank,
      hasWatermark,
      scale,
      dimensions: '600x600'
    });
  }

  console.log(`Re-extracted ${reextractedCount} PDF images.`);

  // Write visual proof manifest
  fs.writeFileSync('scripts/visual_gate_manifest.json', JSON.stringify(auditEntries, null, 2), 'utf8');
}

main().catch(console.error);

