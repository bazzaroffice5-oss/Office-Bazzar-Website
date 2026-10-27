const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const artifactDir = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d1ae96ca-c224-47e6-83e3-7ef8a75670b4';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runAudit() {
  console.log('=== STARTING COMPREHENSIVE CAROUSEL ASSET QUALITY AUDIT ===\n');

  const profileDir = path.join(artifactDir, 'scratch', 'cdp_profile_audit');
  fs.mkdirSync(profileDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const list = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTarget = list.find(t => t.type === 'page') || list[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  const slides = [
    { index: 0, id: 'jk-copier', file: 'hero-banner-jk-copier.png', name: 'JK Copier' },
    { index: 1, id: 'stationery', file: 'hero-banner-stationery.png', name: 'Stationery' },
    { index: 2, id: 'housekeeping', file: 'hero-banner-housekeeping.png', name: 'Housekeeping' },
    { index: 3, id: 'toners', file: 'hero-banner-toners.png', name: 'Toners & Ink' },
  ];

  const viewports = [
    { name: '1440_dpr1', width: 1440, height: 900, dpr: 1.0 },
    { name: '1440_dpr2', width: 1440, height: 900, dpr: 2.0 },
    { name: '1600_1to1_dpr1', width: 1600, height: 900, dpr: 1.0 }, // container width = 1600 - 64 = 1536px (native 1:1!)
    { name: '390_mobile', width: 390, height: 844, dpr: 2.0 }
  ];

  const auditResults = [];

  for (const vp of viewports) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}, DPR=${vp.dpr}) ---`);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dpr,
      mobile: vp.name.includes('mobile')
    });

    for (const s of slides) {
      await cdp.send('Page.navigate', { url: `http://localhost:3000/?slide=${s.index}` });
      await new Promise(r => setTimeout(r, 2000)); // wait for full render

      // Evaluate browser DOM and image state
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const container = document.querySelector('.aspect-\\\\[1536\\\\/505\\\\]');
          const img = container ? container.querySelector('img') : null;
          if (!img) return { error: 'Image not found' };
          const rect = img.getBoundingClientRect();
          const contRect = container.getBoundingClientRect();
          const cs = window.getComputedStyle(img);
          const contCs = window.getComputedStyle(container);

          return {
            currentSrc: img.currentSrc,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            clientWidth: img.clientWidth,
            clientHeight: img.clientHeight,
            rectWidth: rect.width,
            rectHeight: rect.height,
            contRectWidth: contRect.width,
            contRectHeight: contRect.height,
            dpr: window.devicePixelRatio,
            zoom: cs.zoom || '1',
            objectFit: cs.objectFit,
            objectPosition: cs.objectPosition,
            imageRendering: cs.imageRendering,
            transform: cs.transform,
            filter: cs.filter,
            contAspect: contCs.aspectRatio,
            clip: {
              x: Math.round(contRect.left),
              y: Math.round(contRect.top),
              width: Math.round(contRect.width),
              height: Math.round(contRect.height)
            }
          };
        })()`,
        returnByValue: true
      });

      const metrics = evalRes.result.value;
      console.log(`[Slide ${s.index}: ${s.name}] currentSrc=${metrics.currentSrc.slice(-35)}, natural=${metrics.naturalWidth}x${metrics.naturalHeight}, rendered=${Math.round(metrics.rectWidth)}x${Math.round(metrics.rectHeight)}, DPR=${metrics.dpr}, rendering=${metrics.imageRendering}`);

      // Capture screenshot of the exact carousel banner
      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: metrics.clip.x,
          y: metrics.clip.y,
          width: metrics.clip.width,
          height: metrics.clip.height,
          scale: 1
        }
      });

      const ssBuffer = Buffer.from(screenshot.data, 'base64');
      const ssPath = path.join(artifactDir, `audit_${vp.name}_slide${s.index}_${s.id}.png`);
      fs.writeFileSync(ssPath, ssBuffer);

      auditResults.push({
        viewport: vp,
        slide: s,
        metrics,
        screenshotPath: ssPath
      });
    }
  }

  cdp.close();
  chrome.kill();

  console.log('\n=== 2. EXTRACTING 100% UNBIASED PIXEL REGIONS OF INTEREST ===');
  // For each slide, let's create a side-by-side comparison image:
  // Col 1: Original Source Asset (100% unscaled pixels)
  // Col 2: Browser Slide at Native 1:1 Scale (Container width = 1536px, DPR=1)
  // Col 3: Browser Slide at 1440px Viewport (Container width = 1376px, DPR=1)
  // Col 4: Browser Slide on Retina / High-DPI (1440px Viewport, DPR=2)

  for (const s of slides) {
    const rawPath = path.join(__dirname, '..', 'public', 'images', 'banners', s.file);
    const rawMeta = await sharp(rawPath).metadata();

    const file1to1 = path.join(artifactDir, `audit_1600_1to1_dpr1_slide${s.index}_${s.id}.png`);
    const file1440dpr1 = path.join(artifactDir, `audit_1440_dpr1_slide${s.index}_${s.id}.png`);
    const file1440dpr2 = path.join(artifactDir, `audit_1440_dpr2_slide${s.index}_${s.id}.png`);

    const meta1to1 = await sharp(file1to1).metadata();
    const meta1440 = await sharp(file1440dpr1).metadata();
    const metaDpr2 = await sharp(file1440dpr2).metadata();

    console.log(`Slide ${s.index} (${s.name}) dimensions:`);
    console.log(`  Raw source file:  ${rawMeta.width} x ${rawMeta.height} px`);
    console.log(`  Browser 1:1 capture: ${meta1to1.width} x ${meta1to1.height} px`);
    console.log(`  Browser 1440 dpr=1:  ${meta1440.width} x ${meta1440.height} px`);
    console.log(`  Browser 1440 dpr=2:  ${metaDpr2.width} x ${metaDpr2.height} px`);

    // Crop Regions for Slide 0 (JK Copier) as the primary detailed example
    if (s.index === 0) {
      // Crop 1: Headline ("Premium Copier Paper")
      // In raw 1536x505: left=40, top=100, width=420, height=90
      const rawHeadline = await sharp(rawPath).extract({ left: 40, top: 100, width: 420, height: 90 }).toBuffer();
      // In 1to1 capture (1536 wide): same coords
      const capHeadline1to1 = await sharp(file1to1).extract({ left: 40, top: 100, width: 420, height: 90 }).toBuffer();
      // In 1440 dpr1 (1376 wide): scale factor = 1376/1536 = 0.8958
      const scale1440 = meta1440.width / 1536;
      const capHeadline1440 = await sharp(file1440dpr1).extract({
        left: Math.round(40 * scale1440),
        top: Math.round(100 * scale1440),
        width: Math.round(420 * scale1440),
        height: Math.round(90 * scale1440)
      }).resize(420, 90, { kernel: 'nearest' }).toBuffer();

      // In 1440 dpr2 (2752 wide): scale factor = 2752/1536 = 1.7916
      const scaleDpr2 = metaDpr2.width / 1536;
      const capHeadlineDpr2 = await sharp(file1440dpr2).extract({
        left: Math.round(40 * scaleDpr2),
        top: Math.round(100 * scaleDpr2),
        width: Math.round(420 * scaleDpr2),
        height: Math.round(90 * scaleDpr2)
      }).resize(420, 90, { kernel: 'lanczos3' }).toBuffer();

      // Combine headline crops vertically:
      // Row 1: Raw Original Source (100% unscaled)
      // Row 2: Browser Render at Native 1:1 Scale
      // Row 3: Browser Render at 1440px DPR=1
      // Row 4: Browser Render at 1440px DPR=2
      const headlineComparison = await sharp({
        create: {
          width: 440,
          height: 90 * 4 + 60,
          channels: 4,
          background: { r: 245, g: 247, b: 250, alpha: 1 }
        }
      })
      .composite([
        { input: rawHeadline, top: 10, left: 10 },
        { input: capHeadline1to1, top: 110, left: 10 },
        { input: capHeadline1440, top: 210, left: 10 },
        { input: capHeadlineDpr2, top: 310, left: 10 }
      ])
      .png()
      .toFile(path.join(artifactDir, 'comparison_headline_crop_4layers.png'));

      console.log('Generated comparison_headline_crop_4layers.png');

      // Crop 2: Product Carton text ("JK COPIER" box lettering)
      // In raw 1536x505: left=410, top=180, width=280, height=180
      const rawProduct = await sharp(rawPath).extract({ left: 410, top: 180, width: 280, height: 180 }).toBuffer();
      const capProduct1to1 = await sharp(file1to1).extract({ left: 410, top: 180, width: 280, height: 180 }).toBuffer();
      const capProduct1440 = await sharp(file1440dpr1).extract({
        left: Math.round(410 * scale1440),
        top: Math.round(180 * scale1440),
        width: Math.round(280 * scale1440),
        height: Math.round(180 * scale1440)
      }).resize(280, 180, { kernel: 'nearest' }).toBuffer();
      const capProductDpr2 = await sharp(file1440dpr2).extract({
        left: Math.round(410 * scaleDpr2),
        top: Math.round(180 * scaleDpr2),
        width: Math.round(280 * scaleDpr2),
        height: Math.round(180 * scaleDpr2)
      }).resize(280, 180, { kernel: 'lanczos3' }).toBuffer();

      const productComparison = await sharp({
        create: {
          width: 300,
          height: 180 * 4 + 60,
          channels: 4,
          background: { r: 245, g: 247, b: 250, alpha: 1 }
        }
      })
      .composite([
        { input: rawProduct, top: 10, left: 10 },
        { input: capProduct1to1, top: 200, left: 10 },
        { input: capProduct1440, top: 390, left: 10 },
        { input: capProductDpr2, top: 580, left: 10 }
      ])
      .png()
      .toFile(path.join(artifactDir, 'comparison_product_crop_4layers.png'));

      console.log('Generated comparison_product_crop_4layers.png');

      // Crop 3: Small Subtitle / Body text
      // In raw 1536x505: left=40, top=210, width=400, height=45
      const rawBody = await sharp(rawPath).extract({ left: 40, top: 210, width: 400, height: 45 }).toBuffer();
      const capBody1to1 = await sharp(file1to1).extract({ left: 40, top: 210, width: 400, height: 45 }).toBuffer();
      const capBody1440 = await sharp(file1440dpr1).extract({
        left: Math.round(40 * scale1440),
        top: Math.round(210 * scale1440),
        width: Math.round(400 * scale1440),
        height: Math.round(45 * scale1440)
      }).resize(400, 45, { kernel: 'nearest' }).toBuffer();
      const capBodyDpr2 = await sharp(file1440dpr2).extract({
        left: Math.round(40 * scaleDpr2),
        top: Math.round(210 * scaleDpr2),
        width: Math.round(400 * scaleDpr2),
        height: Math.round(45 * scaleDpr2)
      }).resize(400, 45, { kernel: 'lanczos3' }).toBuffer();

      const bodyComparison = await sharp({
        create: {
          width: 420,
          height: 45 * 4 + 60,
          channels: 4,
          background: { r: 245, g: 247, b: 250, alpha: 1 }
        }
      })
      .composite([
        { input: rawBody, top: 10, left: 10 },
        { input: capBody1to1, top: 65, left: 10 },
        { input: capBody1440, top: 120, left: 10 },
        { input: capBodyDpr2, top: 175, left: 10 }
      ])
      .png()
      .toFile(path.join(artifactDir, 'comparison_body_crop_4layers.png'));

      console.log('Generated comparison_body_crop_4layers.png');
    }
  }

  // Create an explicit side-by-side composite comparison of the whole slide:
  // Left: Raw Original Source (1536px)
  // Right: Live Browser Slide Capture at 1:1 scale (1536px)
  for (const s of slides) {
    const rawPath = path.join(__dirname, '..', 'public', 'images', 'banners', s.file);
    const capPath = path.join(artifactDir, `audit_1600_1to1_dpr1_slide${s.index}_${s.id}.png`);

    const rawImg = await sharp(rawPath).resize(1536, 505).toBuffer();
    const capImg = await sharp(capPath).resize(1536, 505).toBuffer();

    // Create a 1536 x 1030 vertical stacked side-by-side or 3072 x 505 horizontal
    const sideBySide = await sharp({
      create: {
        width: 1536,
        height: 505 * 2 + 30,
        channels: 4,
        background: { r: 230, g: 235, b: 242, alpha: 1 }
      }
    })
    .composite([
      { input: rawImg, top: 10, left: 0 },
      { input: capImg, top: 505 + 20, left: 0 }
    ])
    .png()
    .toFile(path.join(artifactDir, `sidebyside_raw_vs_browser_slide${s.index}_${s.id}.png`));

    console.log(`Generated sidebyside_raw_vs_browser_slide${s.index}_${s.id}.png`);
  }

  console.log('\n=== AUDIT COMPLETE ===');
  return auditResults;
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
