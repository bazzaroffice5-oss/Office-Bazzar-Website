const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function autoTrimDir(dirPath) {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.webp') || f.endsWith('.png'));
  console.log(`Auditing and optimizing directory: ${dirPath} (${files.length} images)...`);

  let processedCount = 0;
  let skippedCount = 0;

  for (const f of files) {
    const p = path.join(dirPath, f);
    try {
      const buf = fs.readFileSync(p);
      const meta = await sharp(buf).metadata();
      
      // If already small or transparent, analyze
      const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
      const w = info.width, h = info.height, ch = info.channels;

      let minX = w, maxX = 0, minY = h, maxY = 0;
      let whiteCount = 0;
      const totalPixels = w * h;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * ch;
          const r = data[idx], g = data[idx+1], b = data[idx+2];
          const a = ch === 4 ? data[idx+3] : 255;

          const isWhite = a < 20 || (r > 242 && g > 242 && b > 242);
          if (isWhite) {
            whiteCount++;
          } else {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Check if product is found and has significant white padding (>12% margin)
      if (minX < maxX && minY < maxY) {
        const contentW = maxX - minX + 1;
        const contentH = maxY - minY + 1;
        const whiteRatio = whiteCount / totalPixels;

        // If product has more than 15% empty white space around it
        const padXRatio = (w - contentW) / w;
        const padYRatio = (h - contentH) / h;

        if (padXRatio > 0.15 || padYRatio > 0.15 || whiteRatio > 0.25) {
          // Safe 4% breathing room
          const padX = Math.round(contentW * 0.04);
          const padY = Math.round(contentH * 0.04);
          const cropX = Math.max(0, minX - padX);
          const cropY = Math.max(0, minY - padY);
          const cropW = Math.min(w - cropX, contentW + padX * 2);
          const cropH = Math.min(h - cropY, contentH + padY * 2);

          // Extract content
          const cropped = await sharp(buf)
            .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
            .raw()
            .toBuffer({ resolveWithObject: true });

          const cw = cropped.info.width, c_h = cropped.info.height;
          const cData = cropped.data;
          const outBuf = Buffer.alloc(cw * c_h * 4);

          for (let y = 0; y < c_h; y++) {
            for (let x = 0; x < cw; x++) {
              const inIdx = (y * cw + x) * cropped.info.channels;
              const outIdx = (y * cw + x) * 4;
              const r = cData[inIdx], g = cData[inIdx+1], b = cData[inIdx+2];
              const a = cropped.info.channels === 4 ? cData[inIdx+3] : 255;

              // Transparent if near white
              let isBg = false;
              if (a < 20) isBg = true;
              else if (r > 244 && g > 244 && b > 244) isBg = true;
              else if (r > 238 && g > 238 && b > 238 && Math.abs(r-g) < 5 && Math.abs(g-b) < 5) {
                // Outer edges light grey
                if (x < cw * 0.08 || x > cw * 0.92 || y < c_h * 0.08 || y > c_h * 0.92) {
                  isBg = true;
                }
              }

              outBuf[outIdx] = r;
              outBuf[outIdx+1] = g;
              outBuf[outIdx+2] = b;
              outBuf[outIdx+3] = isBg ? 0 : 255;
            }
          }

          // Composite onto 800x800 transparent canvas resting naturally on podium
          const targetH = Math.min(720, Math.round(c_h * (720 / Math.max(cw, c_h))));
          const targetW = Math.round(cw * (targetH / c_h));

          const resized = await sharp(outBuf, { raw: { width: cw, height: c_h, channels: 4 } })
            .resize(targetW, targetH, { kernel: 'lanczos3' })
            .png()
            .toBuffer();

          const canvasW = 800, canvasH = 800;
          const left = Math.round((canvasW - targetW) / 2);
          const top = canvasH - targetH - 45; // grounded directly on podium platform

          const finalWebp = await sharp({
            create: {
              width: canvasW,
              height: canvasH,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
          })
          .composite([{ input: resized, left: left, top: top }])
          .webp({ quality: 95 })
          .toBuffer();

          fs.writeFileSync(p, finalWebp);
          processedCount++;
          continue;
        }
      }
      skippedCount++;
    } catch (e) {
      skippedCount++;
    }
  }

  console.log(`Finished ${dirPath}: Optimized & Trimmed: ${processedCount}, Already optimal: ${skippedCount}`);
  return { processedCount, skippedCount };
}

async function run() {
  const res1 = await autoTrimDir('public/assets/products/catalog_2026');
  console.log('Catalogue auto-trim results:', res1);
}

run().catch(console.error);

