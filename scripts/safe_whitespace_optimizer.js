const sharp = require('sharp');
const fs = require('fs');

async function safeTrimWhite(filePath) {
  const inputBuffer = fs.readFileSync(filePath);
  const meta = await sharp(inputBuffer).metadata();
  
  // Trim pure white borders
  const trimmed = await sharp(inputBuffer)
    .trim({ threshold: 10, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer({ resolveWithObject: true });
    
  console.log(filePath, 'original:', meta.width, 'x', meta.height, 'trimmed:', trimmed.info.width, 'x', trimmed.info.height);
  
  // If the trimmed image is significantly smaller (meaning huge whitespace existed)
  if (trimmed.info.width < meta.width * 0.85 || trimmed.info.height < meta.height * 0.85) {
    const maxDim = Math.max(trimmed.info.width, trimmed.info.height);
    const padDim = Math.round(maxDim * 1.15); // 7.5% padding on each side for breathing room
    
    const outBuffer = await sharp(trimmed.data)
      .extend({
        top: Math.round((padDim - trimmed.info.height) / 2),
        bottom: padDim - trimmed.info.height - Math.round((padDim - trimmed.info.height) / 2),
        left: Math.round((padDim - trimmed.info.width) / 2),
        right: padDim - trimmed.info.width - Math.round((padDim - trimmed.info.width) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: 95 })
      .toBuffer();
      
    fs.writeFileSync(filePath, outBuffer);
    console.log('Successfully optimized whitespace for', filePath);
  } else {
    console.log('Whitespace is already optimal for', filePath);
  }
}

async function run() {
  await safeTrimWhite('public/assets/products/catalog_2026/OB-COM-1036.webp');
  await safeTrimWhite('public/assets/products/catalog_2026/OB-COM-1041.webp');
}
run();

