const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. Decode PNG to raw RGBA
function decodePng(filePath) {
  const buf = fs.readFileSync(filePath);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  let pos = 8;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idats.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 4;
  const stride = 1 + w * bpp;
  const pixels = Buffer.alloc(w * h * 4);
  let prevLine = Buffer.alloc(w * bpp);

  for (let y = 0; y < h; y++) {
    const lineOffset = y * stride;
    const filter = raw[lineOffset];
    const currentLine = Buffer.alloc(w * bpp);
    for (let x = 0; x < w * bpp; x++) {
      const rawByte = raw[lineOffset + 1 + x];
      const a = (x >= bpp) ? currentLine[x - bpp] : 0;
      const b = prevLine[x];
      const c = (x >= bpp) ? prevLine[x - bpp] : 0;
      let val = 0;
      if (filter === 0) val = rawByte;
      else if (filter === 1) val = (rawByte + a) & 0xff;
      else if (filter === 2) val = (rawByte + b) & 0xff;
      else if (filter === 3) val = (rawByte + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (rawByte + pr) & 0xff;
      }
      currentLine[x] = val;
    }
    currentLine.copy(pixels, y * w * 4);
    prevLine = currentLine;
  }
  return { w, h, pixels };
}

// 2. Encode raw RGBA to PNG buffer
function encodePng(w, h, pixels) {
  const bpp = 4;
  const stride = 1 + w * bpp;
  const raw = Buffer.alloc(h * stride);

  for (let y = 0; y < h; y++) {
    const lineOffset = y * stride;
    raw[lineOffset] = 0; // Filter 0 (None)
    pixels.copy(raw, lineOffset + 1, y * w * bpp, (y + 1) * w * bpp);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, toCrc, crc]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// 3. High quality supersampling / area-averaging resizer
function resizeImage(src, targetW, targetH, alphaBoost = 1.0) {
  const sw = src.w;
  const sh = src.h;
  const sp = src.pixels;
  const out = Buffer.alloc(targetW * targetH * 4);
  const xRatio = sw / targetW;
  const yRatio = sh / targetH;

  for (let dy = 0; dy < targetH; dy++) {
    const syStart = dy * yRatio;
    const syEnd = (dy + 1) * yRatio;
    for (let dx = 0; dx < targetW; dx++) {
      const sxStart = dx * xRatio;
      const sxEnd = (dx + 1) * xRatio;
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
      let totalWeight = 0;
      const yMin = Math.floor(syStart);
      const yMax = Math.min(sh, Math.ceil(syEnd));
      const xMin = Math.floor(sxStart);
      const xMax = Math.min(sw, Math.ceil(sxEnd));

      for (let sy = yMin; sy < yMax; sy++) {
        const yWeight = Math.min(sy + 1, syEnd) - Math.max(sy, syStart);
        if (yWeight <= 0) continue;
        for (let sx = xMin; sx < xMax; sx++) {
          const xWeight = Math.min(sx + 1, sxEnd) - Math.max(sx, sxStart);
          if (xWeight <= 0) continue;
          const weight = xWeight * yWeight;
          const idx = (sy * sw + sx) * 4;
          const a = sp[idx + 3] / 255;
          sumR += sp[idx] * a * weight;
          sumG += sp[idx + 1] * a * weight;
          sumB += sp[idx + 2] * a * weight;
          sumA += sp[idx + 3] * weight;
          totalWeight += weight;
        }
      }

      const outIdx = (dy * targetW + dx) * 4;
      if (totalWeight > 0 && sumA > 0) {
        let finalA = sumA / totalWeight;
        if (alphaBoost !== 1.0) {
          finalA = Math.pow(finalA / 255, alphaBoost) * 255;
        }
        const normA = (sumA / totalWeight) / 255;
        out[outIdx] = Math.min(255, Math.round(sumR / totalWeight / (normA || 1)));
        out[outIdx + 1] = Math.min(255, Math.round(sumG / totalWeight / (normA || 1)));
        out[outIdx + 2] = Math.min(255, Math.round(sumB / totalWeight / (normA || 1)));
        out[outIdx + 3] = Math.min(255, Math.round(finalA));
      }
    }
  }
  return { w: targetW, h: targetH, pixels: out };
}

// 4. Build standard multi-resolution ICO file with PNG payloads
function buildIco(entries) {
  const count = entries.length;
  const headerSize = 6 + count * 16;
  let totalSize = headerSize;
  for (const item of entries) {
    totalSize += item.buffer.length;
  }

  const icoBuf = Buffer.alloc(totalSize);
  icoBuf.writeUInt16LE(0, 0); // reserved
  icoBuf.writeUInt16LE(1, 2); // icon type
  icoBuf.writeUInt16LE(count, 4); // count

  let currentOffset = headerSize;
  for (let i = 0; i < count; i++) {
    const { w, h, buffer } = entries[i];
    const entryOffset = 6 + i * 16;
    icoBuf[entryOffset] = w >= 256 ? 0 : w;
    icoBuf[entryOffset + 1] = h >= 256 ? 0 : h;
    icoBuf[entryOffset + 2] = 0; // palette
    icoBuf[entryOffset + 3] = 0; // reserved
    icoBuf.writeUInt16LE(1, entryOffset + 4); // color planes
    icoBuf.writeUInt16LE(32, entryOffset + 6); // bpp
    icoBuf.writeUInt32LE(buffer.length, entryOffset + 8); // size
    icoBuf.writeUInt32LE(currentOffset, entryOffset + 12); // offset

    buffer.copy(icoBuf, currentOffset);
    currentOffset += buffer.length;
  }
  return icoBuf;
}

// 5. Generate clean vector SVG
function buildSvg(clean) {
  const { w, h, pixels } = clean;

  function traceRuns(matchFn) {
    let d = '';
    for (let y = 0; y < h; y++) {
      let startX = -1;
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2], a = pixels[idx+3];
        const isMatch = a > 80 && matchFn(r, g, b, a);
        if (isMatch) {
          if (startX === -1) startX = x;
        } else {
          if (startX !== -1) {
            d += `M${startX} ${y}h${x - startX}v1h-${x - startX}z `;
            startX = -1;
          }
        }
      }
      if (startX !== -1) {
        d += `M${startX} ${y}h${w - startX}v1h-${w - startX}z `;
      }
    }
    return d.trim();
  }

  const cartD = traceRuns((r,g,b) => r < 70 && g < 70 && b < 70);
  const blueD = traceRuns((r,g,b) => b > 100 && b > r + 25 && b > g + 25);
  const greenD = traceRuns((r,g,b) => g > 90 && g > r + 15 && g > b + 15);
  const orangeD = traceRuns((r,g,b) => r > 90 && r > b + 30 && !(g > 90 && g > r + 15));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <title>OfficeBazzar Favicon</title>
  <!-- OfficeBazzar Official Emblem -->
  <path id="ob-pens" fill="#1e40af" d="${blueD}" />
  <path id="ob-apple-leaf" fill="#16a34a" d="${greenD}" />
  <path id="ob-swoosh" fill="#ea580c" d="${orangeD}" />
  <path id="ob-cart" fill="#0f172a" d="${cartD}" />
</svg>
`;
}

// Main execution
const srcPath = path.resolve(__dirname, '../public/images/officebazzar-favicon-clean.png');
console.log('Loading clean source:', srcPath);
const clean = decodePng(srcPath);

console.log('Resizing assets...');
const r16 = resizeImage(clean, 16, 16, 0.75); // slight boost for 16x16 sharpness
const r32 = resizeImage(clean, 32, 32, 0.85); // slight boost for 32x32 sharpness
const r48 = resizeImage(clean, 48, 48);
const r180 = resizeImage(clean, 180, 180);
const r192 = resizeImage(clean, 192, 192);

const png16 = encodePng(16, 16, r16.pixels);
const png32 = encodePng(32, 32, r32.pixels);
const png48 = encodePng(48, 48, r48.pixels);
const png180 = encodePng(180, 180, r180.pixels);
const png192 = encodePng(192, 192, r192.pixels);
const png512 = fs.readFileSync(srcPath); // Full-res 512x512

const icoBuf = buildIco([
  { w: 16, h: 16, buffer: png16 },
  { w: 32, h: 32, buffer: png32 },
  { w: 48, h: 48, buffer: png48 }
]);

const svgContent = buildSvg(clean);

const outputs = [
  // 1. Root/public favicon files
  { path: 'public/favicon.ico', buffer: icoBuf },
  { path: 'public/favicon.png', buffer: png512 },
  { path: 'public/favicon-16x16.png', buffer: png16 },
  { path: 'public/favicon-32x32.png', buffer: png32 },
  { path: 'public/apple-touch-icon.png', buffer: png180 },
  { path: 'public/android-chrome-192x192.png', buffer: png192 },
  { path: 'public/android-chrome-512x512.png', buffer: png512 },
  { path: 'public/icon.svg', string: svgContent },
  { path: 'public/icon.png', buffer: png32 },

  // 2. App Router convention files in src/app/
  { path: 'src/app/favicon.ico', buffer: icoBuf },
  { path: 'src/app/icon.png', buffer: png32 },
  { path: 'src/app/apple-icon.png', buffer: png180 },
  { path: 'src/app/icon.svg', string: svgContent },
];

console.log('Writing output files...');
for (const out of outputs) {
  const fullPath = path.resolve(__dirname, '..', out.path);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (out.buffer) {
    fs.writeFileSync(fullPath, out.buffer);
    console.log(`- Wrote ${out.path} (${out.buffer.length} bytes)`);
  } else if (out.string) {
    fs.writeFileSync(fullPath, out.string, 'utf8');
    console.log(`- Wrote ${out.path} (${out.string.length} bytes)`);
  }
}

console.log('All favicon files generated successfully!');
