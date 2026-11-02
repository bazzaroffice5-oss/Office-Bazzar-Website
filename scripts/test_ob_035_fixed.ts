import * as fs from 'fs';
import sharp from 'sharp';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const { createCanvas } = require('@napi-rs/canvas');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

async function testCropOb35() {
  const pdfData = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await doc.getPage(6);

  const SCALE = 4.0;
  const viewport = page.getViewport({ scale: SCALE });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  await page.render({ canvasContext: ctx, viewport }).promise;

  // col 1 (OB-35 is col 1, row 2: OB-34 is col 0, OB-35 is col 1, OB-36 is col 2)
  const x = 228;
  const y = 675;
  const w = 142;
  const h = 105;

  const cropX = Math.round(x * SCALE);
  const cropY = Math.round(y * SCALE);
  const cropW = Math.round(w * SCALE);
  const cropH = Math.round(h * SCALE);

  const cropCanvas = createCanvas(cropW, cropH);
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

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
  fs.writeFileSync('public/test_ob_035_fixed.webp', webpBuf);
  console.log('Saved public/test_ob_035_fixed.webp, size:', webpBuf.length);
}

testCropOb35().catch(console.error);
