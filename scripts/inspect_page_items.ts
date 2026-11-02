import * as fs from 'fs';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

async function inspectTextAndOperators(pageNum: number) {
  const pdfData = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await doc.getPage(pageNum);
  const textContent = await page.getTextContent();

  console.log(`=== PAGE ${pageNum} (W=${Math.round(page.getViewport({scale:1}).width)}, H=${Math.round(page.getViewport({scale:1}).height)}) ===`);
  for (const item of textContent.items) {
    if ('str' in item && item.str.trim()) {
      const tx = Math.round(item.transform[4]);
      const ty = Math.round(page.getViewport({scale:1}).height - item.transform[5]);
      console.log(`[x=${tx}, y=${ty}] "${item.str.trim()}"`);
    }
  }
}

async function run() {
  for (const p of [32, 33, 34, 35]) {
    await inspectTextAndOperators(p);
  }
}

run().catch(console.error);
