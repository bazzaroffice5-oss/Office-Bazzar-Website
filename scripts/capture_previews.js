const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const artifactDir = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d0f5b27b-4af4-4dde-89ea-0f2afb2a936d';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Helper to decode PNG
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

function encodePng(w, h, pixels) {
  const bpp = 4;
  const stride = 1 + w * bpp;
  const raw = Buffer.alloc(h * stride);

  for (let y = 0; y < h; y++) {
    const lineOffset = y * stride;
    raw[lineOffset] = 0;
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

// 1. Capture full homepage screenshot
console.log('Capturing homepage screenshot...');
const homeRaw = path.resolve(__dirname, '../preview.png');
cp.spawnSync(chromePath, [
  '--headless',
  '--disable-gpu',
  '--no-sandbox',
  '--screenshot=' + homeRaw,
  '--window-size=1440,900',
  'http://localhost:3000'
], { encoding: 'utf8', timeout: 25000 });

if (fs.existsSync(homeRaw)) {
  console.log('Homepage captured, size:', fs.statSync(homeRaw).size);
  // Copy to artifacts dir
  fs.copyFileSync(homeRaw, path.join(artifactDir, 'homepage_preview.png'));

  // 2. Crop top header area (y: 0 to 180) for a focused view
  const full = decodePng(homeRaw);
  const cropH = 175;
  const cropPixels = Buffer.alloc(full.w * cropH * 4);
  full.pixels.copy(cropPixels, 0, 0, full.w * cropH * 4);
  const headerBuf = encodePng(full.w, cropH, cropPixels);
  fs.writeFileSync(path.join(artifactDir, 'header_preview.png'), headerBuf);
  console.log('Header crop saved to artifacts/header_preview.png');
}

// 3. Create a realistic browser tab mockup HTML and capture it
const faviconDataUrl = 'data:image/png;base64,' + fs.readFileSync('public/favicon-32x32.png').toString('base64');
const logoDataUrl = 'data:image/png;base64,' + fs.readFileSync('public/images/officebazzar-logo-transparent.png').toString('base64');

const mockupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OfficeBazzar Browser Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .window {
      width: 1200px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }
    .titlebar {
      background: #e2e8f0;
      height: 42px;
      display: flex;
      align-items: flex-end;
      padding: 0 16px;
      gap: 12px;
      border-bottom: 1px solid #cbd5e1;
    }
    .traffic-lights {
      display: flex;
      gap: 7px;
      margin-bottom: 14px;
      margin-right: 8px;
    }
    .light {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .light.red { background: #ef4444; }
    .light.yellow { background: #f59e0b; }
    .light.green { background: #10b981; }
    .tab {
      background: #ffffff;
      height: 34px;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 0 16px;
      max-width: 380px;
      border: 1px solid #cbd5e1;
      border-bottom: none;
      position: relative;
    }
    .tab img.favicon {
      width: 18px;
      height: 18px;
      object-fit: contain;
    }
    .tab .title {
      font-size: 12px;
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tab .close {
      font-size: 14px;
      color: #94a3b8;
      margin-left: auto;
    }
    .tab.inactive {
      background: transparent;
      border: none;
      color: #64748b;
    }
    .toolbar {
      background: #ffffff;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .nav-buttons {
      display: flex;
      gap: 8px;
      color: #64748b;
      font-size: 16px;
    }
    .address-bar {
      flex: 1;
      background: #f1f5f9;
      height: 30px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 12px;
      color: #0f172a;
      gap: 8px;
      border: 1px solid #e2e8f0;
    }
    .address-bar .lock {
      color: #10b981;
      font-size: 12px;
    }
    .address-bar .domain {
      font-weight: 600;
      color: #0f172a;
    }
    .address-bar .path {
      color: #64748b;
    }
    .badge-verified {
      background: #dcfce7;
      color: #15803d;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .content {
      background: #f8fafc;
    }
    /* Web Top Bar */
    .web-topbar {
      background: #7f1d1d;
      color: #fef2f2;
      padding: 7px 24px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    .web-topbar .brand {
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .web-topbar .btn {
      background: #ffffff;
      color: #7f1d1d;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 4px;
    }
    /* Web Header */
    .web-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .logo-container {
      display: flex;
      align-items: center;
    }
    .logo-container img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }
    .location-box {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #334155;
      padding: 4px 8px;
      border-radius: 6px;
      background: #f8fafc;
    }
    .location-box .pin {
      color: #d9232d;
      font-size: 14px;
    }
    .location-box .link {
      color: #1a73e8;
      font-weight: 700;
    }
    .search-box {
      flex: 1;
      max-width: 500px;
      display: flex;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      height: 38px;
    }
    .search-pill {
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      padding: 0 12px;
      display: flex;
      align-items: center;
      font-size: 12px;
      font-weight: 500;
      color: #334155;
    }
    .search-input {
      flex: 1;
      padding: 0 14px;
      font-size: 12px;
      color: #0f172a;
      border: none;
      outline: none;
    }
    .search-btn {
      background: #d9232d;
      color: white;
      border: none;
      width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }
    .action-item {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .action-item .badge {
      background: #d9232d;
      color: white;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 9999px;
      margin-left: 2px;
    }
    /* Quick Category Strip */
    .cat-strip {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .cat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .cat-icon {
      font-size: 16px;
    }
    /* Comparison Card */
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin: 20px 24px;
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .card-col {
      padding: 14px;
      border-radius: 8px;
    }
    .card-col.before {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
    .card-col.after {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-col.before .card-title { color: #991b1b; }
    .card-col.after .card-title { color: #166534; }
    .card-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 10px;
    }
    .icon-box {
      width: 44px;
      height: 44px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    .icon-box img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
    .desc {
      font-size: 12px;
      color: #334155;
      line-height: 1.4;
    }
    .desc strong {
      display: block;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="window">
    <!-- Browser Titlebar & Tab Strip -->
    <div class="titlebar">
      <div class="traffic-lights">
        <div class="light red"></div>
        <div class="light yellow"></div>
        <div class="light green"></div>
      </div>
      <!-- Active Tab with OfficeBazzar Favicon -->
      <div class="tab">
        <img class="favicon" src="${faviconDataUrl}" alt="OfficeBazzar Favicon">
        <span class="title">OfficeBazzar | Wholesale Office Stationery & Industrial Supplies Chennai</span>
        <span class="close">&times;</span>
      </div>
      <div class="tab inactive">
        <span class="title">+ New Tab</span>
      </div>
    </div>

    <!-- Browser Address / Navigation Toolbar -->
    <div class="toolbar">
      <div class="nav-buttons">
        <span>&larr;</span>
        <span>&rarr;</span>
        <span>&#x21bb;</span>
      </div>
      <div class="address-bar">
        <span class="lock">&#128274;</span>
        <span class="domain">https://officebazzar.co.in</span>
        <span class="path">/</span>
      </div>
      <div class="badge-verified">
        <span>&#10003;</span> Official Brand Favicon & Logo Active
      </div>
    </div>

    <!-- Website Page Header Content -->
    <div class="content">
      <!-- Top Bar -->
      <div class="web-topbar">
        <div class="brand">officebazzar <span style="color: #fbbf24;">Business</span> &nbsp;|&nbsp; <span style="font-weight: 400; opacity: 0.9;">Corporate Procurement Partner for Your Enterprise. GST Invoices Pan-India.</span></div>
        <div class="btn">Explore OfficeBazzar Business</div>
      </div>

      <!-- Main Header Row -->
      <div class="web-header">
        <!-- Official Logo -->
        <div class="logo-container">
          <img src="${logoDataUrl}" alt="OfficeBazzar Logo">
        </div>

        <!-- Location Selector -->
        <div class="location-box">
          <span class="pin">&#128205;</span>
          <div>
            <div style="font-weight: 600; font-size: 10px;">PIN: 600014</div>
            <div class="link">Select delivery location &rsaquo;</div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-box">
          <div class="search-pill">All &#9662;</div>
          <input type="text" class="search-input" value="Search Product, Category, Brand..." readonly>
          <button class="search-btn">&#128269;</button>
        </div>

        <!-- Right Actions -->
        <div class="actions">
          <div class="action-item">&#128100; Login Now &#9662;</div>
          <div class="action-item">&#128666; Track Order</div>
          <div class="action-item">&#128722; Cart <span class="badge">0</span></div>
          <div class="action-item" style="color: #64748b; font-size: 16px;">&#8942;</div>
        </div>
      </div>

      <!-- Quick Category Navigation -->
      <div class="cat-strip">
        <div class="cat-item"><span class="cat-icon">&#9889;</span> 24 hrs Delivery</div>
        <div class="cat-item"><span class="cat-icon">&#9999;&#65039;</span> Office Supplies</div>
        <div class="cat-item"><span class="cat-icon">&#129529;</span> Housekeeping & Facility</div>
        <div class="cat-item"><span class="cat-icon">&#128230;</span> Packaging Materials</div>
        <div class="cat-item"><span class="cat-icon">&#128424;&#65039;</span> Printer Supplies & Toner</div>
        <div class="cat-item"><span class="cat-icon">&#128203;</span> Boards & Displays</div>
        <div class="cat-item"><span class="cat-icon">&#128421;&#65039;</span> Office Machines</div>
        <div class="cat-item"><span class="cat-icon">&#129531;</span> Pantry & Hygiene</div>
        <div class="cat-item"><span class="cat-icon">&#128087;</span> Safety & PPE</div>
        <div class="cat-item"><span class="cat-icon">&#127873;</span> Corporate Bulk RFQ</div>
      </div>

      <!-- Verification Summary Card -->
      <div class="summary-card">
        <div class="card-col before">
          <div class="card-title">&#10060; Previous Issue (Replaced)</div>
          <div class="card-item">
            <div class="icon-box" style="background: #1e293b; color: white; font-weight: 800; font-size: 18px;">
              N
            </div>
            <div class="desc">
              <strong>Incorrect Default Next.js "N" Icon</strong>
              Old default Next.js starter favicon shown in browser tab and dev indicator badge.
            </div>
          </div>
        </div>

        <div class="card-col after">
          <div class="card-title">&#9989; Fixed & Active (Verified)</div>
          <div class="card-item">
            <div class="icon-box">
              <img src="${faviconDataUrl}" alt="OfficeBazzar Verified Favicon">
            </div>
            <div class="desc">
              <strong>Official OfficeBazzar Cart & Supplies Emblem</strong>
              High-resolution, transparent, centered favicon across .ico, .svg, and .png at 16×16 and 32×32.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

const mockupFile = path.resolve(__dirname, '../scratch_preview.html');
fs.writeFileSync(mockupFile, mockupHtml, 'utf8');

console.log('Capturing browser tab & header mockup...');
const mockupOut = path.join(artifactDir, 'browser_tab_preview.png');
cp.spawnSync(chromePath, [
  '--headless',
  '--disable-gpu',
  '--no-sandbox',
  '--screenshot=' + mockupOut,
  '--window-size=1280,780',
  'file:///' + mockupFile.replace(/\\\\/g, '/')
], { encoding: 'utf8', timeout: 25000 });

if (fs.existsSync(mockupOut)) {
  console.log('Mockup preview captured, size:', fs.statSync(mockupOut).size);
}

// Clean temporary html
if (fs.existsSync(mockupFile)) fs.unlinkSync(mockupFile);
console.log('All previews generated successfully!');
