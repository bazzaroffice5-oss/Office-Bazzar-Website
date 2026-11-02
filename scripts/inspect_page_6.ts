import * as fs from 'fs';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const { createCanvas } = require('@napi-rs/canvas');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

async function inspectPage6() {
  const pdfData = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await doc.getPage(6);

  const scale = 1.5;
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  fs.writeFileSync('public/debug_page_6.png', canvas.toBuffer('image/png'));
  console.log('Saved public/debug_page_6.png');
}

inspectPage6().catch(console.error);
