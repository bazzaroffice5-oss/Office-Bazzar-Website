import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const { createCanvas } = require('@napi-rs/canvas');

const PDF_PATH = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/.user_uploaded/media_1793451033088_4cd3125b.pdf';

const ROAD_SAFETY_PRODUCTS = [
  // PAGE 32
  { page: 32, sku: 'OB-RDS-01', name: 'Flexible Traffic Cone 750mm', filename: 'ob-rds-01-flexible-traffic-cone-750mm.webp', x: 12, y: 62, w: 92, h: 83 },
  { page: 32, sku: 'OB-RDS-02', name: 'Hexagonal Traffic Cone (750mm / 1000mm)', filename: 'ob-rds-02-hexagonal-traffic-cone-750mm-1000mm.webp', x: 113, y: 62, w: 92, h: 68 },
  { page: 32, sku: 'OB-RDS-03', name: 'Traffic Cone with Rubberized Plastic Base', filename: 'ob-rds-03-traffic-cone-with-rubberized-plastic-base.webp', x: 214, y: 62, w: 92, h: 68 },
  { page: 32, sku: 'OB-RDS-04', name: 'Economical Traffic Cone and Chain Set', filename: 'ob-rds-04-economical-traffic-cone-and-chain-set.webp', x: 12, y: 172, w: 92, h: 73 },
  { page: 32, sku: 'OB-RDS-05', name: 'Collapsible Pop-Up Traffic Cone 650mm', filename: 'ob-rds-05-collapsible-pop-up-traffic-cone-650mm.webp', x: 113, y: 175, w: 92, h: 70 },
  { page: 32, sku: 'OB-RDS-06', name: 'Retractable Cone Q-Manager Ribbon', filename: 'ob-rds-06-retractable-cone-q-manager-ribbon.webp', x: 214, y: 172, w: 92, h: 83 },
  { page: 32, sku: 'OB-RDS-07', name: 'Telescopic Cone Connecting Rod (1.3m to 2.1m)', filename: 'ob-rds-07-telescopic-cone-connecting-rod-1-3m-to-2-1m.webp', x: 12, y: 282, w: 92, h: 80 },
  { page: 32, sku: 'OB-RDS-08', name: 'LED Traffic Baton Light Rechargeable', filename: 'ob-rds-08-led-traffic-baton-light-rechargeable.webp', x: 113, y: 280, w: 92, h: 82 },
  { page: 32, sku: 'OB-RDS-09', name: 'Outdoor Convex Security Mirror (18/24/32/40 inch)', filename: 'ob-rds-09-outdoor-convex-security-mirror-18-24-32-40-inch.webp', x: 214, y: 280, w: 92, h: 45 },
  { page: 32, sku: 'OB-RDS-10', name: 'Acrylic Dome Safety Mirror (Full / Half / Quarter)', filename: 'ob-rds-10-acrylic-dome-safety-mirror-full-half-quarter.webp', x: 12, y: 390, w: 92, h: 70 },
  { page: 32, sku: 'OB-RDS-11', name: 'Warning Bollard Delineator Post', filename: 'ob-rds-11-warning-bollard-delineator-post.webp', x: 113, y: 390, w: 92, h: 70 },
  { page: 32, sku: 'OB-RDS-12', name: 'Flexible Polyurethane Spring Post 750mm', filename: 'ob-rds-12-flexible-polyurethane-spring-post-750mm.webp', x: 214, y: 390, w: 92, h: 70 },

  // PAGE 33
  { page: 33, sku: 'OB-RDS-13', name: 'Floor Stand Warning Sign 600mm', filename: 'ob-rds-13-floor-stand-warning-sign-600mm.webp', x: 12, y: 62, w: 92, h: 73 },
  { page: 33, sku: 'OB-RDS-14', name: 'Heavy Duty Road Rumble Strips', filename: 'ob-rds-14-heavy-duty-road-rumble-strips.webp', x: 113, y: 62, w: 92, h: 48 },
  { page: 33, sku: 'OB-RDS-15', name: 'Heavy Duty Rubber Wheel Chock', filename: 'ob-rds-15-heavy-duty-rubber-wheel-chock.webp', x: 214, y: 62, w: 92, h: 43 },
  { page: 33, sku: 'OB-RDS-16', name: 'Rubber Cable Protector Ramp (2/3/4/5 Channel)', filename: 'ob-rds-16-rubber-cable-protector-ramp-2-3-4-5-channel.webp', x: 12, y: 172, w: 92, h: 73 },
  { page: 33, sku: 'OB-RDS-17', name: 'High Visibility Reflective Safety Jacket', filename: 'ob-rds-17-high-visibility-reflective-safety-jacket.webp', x: 113, y: 172, w: 92, h: 88 },
  { page: 33, sku: 'OB-RDS-18', name: 'Aluminum Road Stud and Solar LED Stud', filename: 'ob-rds-18-aluminum-road-stud-and-solar-led-stud.webp', x: 214, y: 172, w: 92, h: 73 },
  { page: 33, sku: 'OB-RDS-19', name: 'Handheld Metal Detector Wand Scanner', filename: 'ob-rds-19-handheld-metal-detector-wand-scanner.webp', x: 12, y: 280, w: 92, h: 80 },
  { page: 33, sku: 'OB-RDS-20', name: 'Stainless Steel Retractable Belt Stanchion (3m)', filename: 'ob-rds-20-stainless-steel-retractable-belt-stanchion-3m.webp', x: 113, y: 280, w: 92, h: 85 },
  { page: 33, sku: 'OB-RDS-21', name: 'Q-Manager A4 Sign Board Display Frame', filename: 'ob-rds-21-q-manager-a4-sign-board-display-frame.webp', x: 214, y: 280, w: 92, h: 85 },
  { page: 33, sku: 'OB-RDS-22', name: 'Classic Velvet Rope Stanchion Post (Gold / SS)', filename: 'ob-rds-22-classic-velvet-rope-stanchion-post-gold-ss.webp', x: 12, y: 390, w: 92, h: 70 },
  { page: 33, sku: 'OB-RDS-23', name: 'Plastic Chain Q-Manager Barrier Post 1000mm', filename: 'ob-rds-23-plastic-chain-q-manager-barrier-post-1000mm.webp', x: 113, y: 390, w: 92, h: 75 },
  { page: 33, sku: 'OB-RDS-24', name: 'Microprismatic Reflective Warning Tape (50mm x 50m)', filename: 'ob-rds-24-microprismatic-reflective-warning-tape-50mm-x-50m.webp', x: 214, y: 390, w: 92, h: 70 },

  // PAGE 34
  { page: 34, sku: 'OB-RDS-25', name: 'Heavy Duty Rubber Speed Breakers', filename: 'ob-rds-25-heavy-duty-rubber-speed-breakers.webp', x: 12, y: 80, w: 144, h: 120 },
  { page: 34, sku: 'OB-RDS-26', name: 'Plastic Modular Speed Breakers', filename: 'ob-rds-26-plastic-modular-speed-breakers.webp', x: 162, y: 80, w: 144, h: 120 },
  { page: 34, sku: 'OB-RDS-27', name: 'Rubber Corner Guards Square Edge', filename: 'ob-rds-27-rubber-corner-guards-square-edge.webp', x: 15, y: 225, w: 140, h: 75 },
  { page: 34, sku: 'OB-RDS-28', name: 'Rubber Corner Guards Curved Edge', filename: 'ob-rds-28-rubber-corner-guards-curved-edge.webp', x: 162, y: 225, w: 144, h: 75 },
  { page: 34, sku: 'OB-RDS-29', name: 'Rubber Car Wheel Stopper 600mm', filename: 'ob-rds-29-rubber-car-wheel-stopper-600mm.webp', x: 25, y: 355, w: 130, h: 40 },
  { page: 34, sku: 'OB-RDS-30', name: 'Rubber Car Wheel Stopper 500mm', filename: 'ob-rds-30-rubber-car-wheel-stopper-500mm.webp', x: 165, y: 355, w: 130, h: 40 },
  { page: 34, sku: 'OB-RDS-31', name: 'Rubber Car Wheel Stopper Commercial 1650mm', filename: 'ob-rds-31-rubber-car-wheel-stopper-commercial-1650mm.webp', x: 20, y: 435, w: 278, h: 40 },

  // PAGE 35
  { page: 35, sku: 'OB-RDS-32', name: 'Solar Warning Blinker Light', filename: 'ob-rds-32-solar-warning-blinker-light.webp', x: 12, y: 65, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-33', name: 'Solar Traffic Flasher Light', filename: 'ob-rds-33-solar-traffic-flasher-light.webp', x: 113, y: 65, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-34', name: 'Solar Chevron Directional Warning Board', filename: 'ob-rds-34-solar-chevron-directional-warning-board.webp', x: 214, y: 65, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-35', name: 'Under Vehicle Search Inspection Mirror (UVSM)', filename: 'ob-rds-35-under-vehicle-search-inspection-mirror-uvsm.webp', x: 12, y: 175, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-36', name: 'Heavy Duty Anti-Theft Car Wheel Lock Clamp', filename: 'ob-rds-36-heavy-duty-anti-theft-car-wheel-lock-clamp.webp', x: 113, y: 175, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-37', name: 'LED Emergency Magnetic Beacon Flare Light', filename: 'ob-rds-37-led-emergency-magnetic-beacon-flare-light.webp', x: 214, y: 175, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-38', name: 'Heavy Duty Anti-Slip Traction Safety Tapes', filename: 'ob-rds-38-heavy-duty-anti-slip-traction-safety-tapes.webp', x: 12, y: 280, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-39', name: 'Interlocking Plastic Water Filled Road Barrier', filename: 'ob-rds-39-interlocking-plastic-water-filled-road-barrier.webp', x: 113, y: 280, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-40', name: 'Galvanized Steel Crowd Control Barricade Barrier', filename: 'ob-rds-40-galvanized-steel-crowd-control-barricade-barrier.webp', x: 214, y: 280, w: 92, h: 80 },
  { page: 35, sku: 'OB-RDS-41', name: 'Portable Expandable Scissor Road Barrier (Max 2m)', filename: 'ob-rds-41-portable-expandable-scissor-road-barrier-max-2m.webp', x: 12, y: 390, w: 92, h: 75 },
  { page: 35, sku: 'OB-RDS-42', name: 'Rechargeable Search Light & Megaphone Siren', filename: 'ob-rds-42-rechargeable-search-light-megaphone-siren.webp', x: 113, y: 390, w: 92, h: 75 },
  { page: 35, sku: 'OB-RDS-43', name: 'Metal Signage Post Stands (Parking / Directional)', filename: 'ob-rds-43-metal-signage-post-stands-parking-directional.webp', x: 214, y: 390, w: 92, h: 75 },
];

async function reextractRoadSafety() {
  console.log(`Re-extracting all ${ROAD_SAFETY_PRODUCTS.length} Road Safety Products with high-fidelity crops...`);

  const pdfData = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;

  const SCALE = 6.0;
  const pageCanvases = new Map();

  async function getRenderedPage(pageNum: number) {
    if (pageCanvases.has(pageNum)) return pageCanvases.get(pageNum);
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageCanvases.set(pageNum, canvas);
    return canvas;
  }

  const outDir = path.join(process.cwd(), 'public', 'assets', 'products', 'road-safety');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let blankCount = 0;
  let successCount = 0;

  for (const item of ROAD_SAFETY_PRODUCTS) {
    const pageCanvas = await getRenderedPage(item.page);

    const cropX = Math.round(item.x * SCALE);
    const cropY = Math.round(item.y * SCALE);
    const cropW = Math.round(item.w * SCALE);
    const cropH = Math.round(item.h * SCALE);

    const cropCanvas = createCanvas(cropW, cropH);
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(pageCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Standardized 600x600 square canvas with clean white background
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

    if (isBlank) {
      blankCount++;
      console.log(`[BLANK] ${item.sku} (${item.name}) - ${webpBuf.length} bytes`);
    } else {
      successCount++;
    }

    const outPath = path.join(outDir, item.filename);
    fs.writeFileSync(outPath, webpBuf);
  }

  console.log(`\nRe-extraction Complete: ${successCount} Successful, ${blankCount} Blank.`);
}

reextractRoadSafety().catch(console.error);
