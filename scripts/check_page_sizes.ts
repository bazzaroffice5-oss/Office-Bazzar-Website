import * as fs from 'fs';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

async function checkAllPages() {
  const pdfData = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;

  console.log(`Total Pages: ${doc.numPages}`);
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1.0 });
    console.log(`Page ${p}: width=${Math.round(vp.width)}, height=${Math.round(vp.height)}`);
  }
}

checkAllPages().catch(console.error);
