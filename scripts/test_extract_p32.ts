import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const { createCanvas } = require('@napi-rs/canvas');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

async function testExtractPage32() {
  const pdfData = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await doc.getPage(32);

  const SCALE = 6.0; // High resolution
  const viewport = page.getViewport({ scale: SCALE });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  await page.render({ canvasContext: ctx, viewport }).promise;

  console.log(`Page 32 Rendered canvas size: ${viewport.width} x ${viewport.height}`);

  // In points (viewport scale 1.0):
  // 3 cols, 4 rows
  // Let's define the 3 cols in points:
  const cols = [
    { x: 10, w: 96 },
    { x: 111, w: 96 },
    { x: 212, w: 96 }
  ];
  // 4 rows in points:
  const rows = [
    { y: 62, h: 72 },
    { y: 167, h: 74 },
    { y: 272, h: 72 },
    { y: 377, h: 72 }
  ];

  const items = [
    { r: 0, c: 0, sku: 'OB-RDS-01', name: 'Flexible Traffic Cone' },
    { r: 0, c: 1, sku: 'OB-RDS-02', name: 'Hexagonal Traffic Cone' },
    { r: 0, c: 2, sku: 'OB-RDS-03', name: 'Traffic Cone Rubberized Plastic Base' },
    { r: 1, c: 0, sku: 'OB-RDS-04', name: 'Economical Traffic Cone & Chain' },
    { r: 1, c: 1, sku: 'OB-RDS-05', name: 'Collapsible Traffic Cone' },
    { r: 1, c: 2, sku: 'OB-RDS-06', name: 'Cone Q-manager' },
    { r: 2, c: 0, sku: 'OB-RDS-07', name: 'Cone Connecting Rod' },
    { r: 2, c: 1, sku: 'OB-RDS-08', name: 'Baton Light' },
    { r: 2, c: 2, sku: 'OB-RDS-09', name: 'Convex Mirror' },
    { r: 3, c: 0, sku: 'OB-RDS-10', name: 'Dome Mirror' },
    { r: 3, c: 1, sku: 'OB-RDS-11', name: 'Warning Bollard' },
    { r: 3, c: 2, sku: 'OB-RDS-12', name: 'Spring Post' },
  ];

  for (const it of items) {
    const col = cols[it.c];
    const row = rows[it.r];

    const cropX = Math.round(col.x * SCALE);
    const cropY = Math.round(row.y * SCALE);
    const cropW = Math.round(col.w * SCALE);
    const cropH = Math.round(row.h * SCALE);

    // Extract
    const cropCanvas = createCanvas(cropW, cropH);
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Fit onto 600x600 white square canvas
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

    const buf = outCanvas.toBuffer('image/png');
    const webpBuf = await sharp(buf).webp({ quality: 90 }).toBuffer();
    const stats = await sharp(webpBuf).stats();
    const isBlank = stats.channels.every(c => c.mean > 250 && c.stdev < 5);

    const testPath = `public/test_${it.sku}.webp`;
    fs.writeFileSync(testPath, webpBuf);
    console.log(`[${it.sku}] ${it.name} -> Size: ${webpBuf.length} bytes, Blank?: ${isBlank}`);
  }
}

testExtractPage32().catch(console.error);

