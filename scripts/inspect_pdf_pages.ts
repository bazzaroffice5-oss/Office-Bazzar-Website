import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const { createCanvas } = require('@napi-rs/canvas');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

async function inspectRoadSafetyPages() {
  const pdfData = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;

  for (const pageNum of [32, 33, 34, 35]) {
    const page = await doc.getPage(pageNum);
    const vp = page.getViewport({ scale: 1.0 });
    console.log(`Page ${pageNum} viewport: width=${vp.width}, height=${vp.height}`);

    // Render page at scale 1.5 to inspect its layout visually
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const outPath = `public/debug_page_${pageNum}.png`;
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log(`Saved debug render to ${outPath}`);
  }
}

inspectRoadSafetyPages().catch(console.error);

