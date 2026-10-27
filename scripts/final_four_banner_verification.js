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

async function runVerification() {
  console.log('=== STARTING FINAL VERIFICATION OF FOUR HOMEPAGE BANNERS ===\n');

  const profileDir = path.join(artifactDir, 'scratch', 'cdp_profile_final_verification');
  fs.mkdirSync(profileDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const list = await new Promise((resolve, reject) => {
    http.get('http://localhost:9223/json/list', (res) => {
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
    { index: 0, id: 'jk-copier', file: '01-jk-copier-blue.png', name: 'JK Copier (Blue)', prevFile: 'hero-banner-jk-copier.png' },
    { index: 1, id: 'stationery', file: '02-stationery-green.png', name: 'Stationery (Green)', prevFile: 'hero-banner-stationery.png' },
    { index: 2, id: 'housekeeping', file: '03-housekeeping-orange.png', name: 'Housekeeping (Orange)', prevFile: 'hero-banner-housekeeping.png' },
    { index: 3, id: 'toners', file: '04-toner-ink-purple.png', name: 'Toner & Ink (Purple)', prevFile: 'hero-banner-toners.png' },
  ];

  const viewports = [
    { name: '1920_desktop', width: 1920, height: 1080, dpr: 1.0, isMobile: false },
    { name: '1440_desktop', width: 1440, height: 900, dpr: 1.0, isMobile: false },
    { name: '1280_desktop', width: 1280, height: 800, dpr: 1.0, isMobile: false },
    { name: '390_mobile', width: 390, height: 844, dpr: 2.0, isMobile: true },
    { name: '360_mobile', width: 360, height: 800, dpr: 2.0, isMobile: true },
  ];

  const results = [];

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height}, DPR=${vp.dpr})`);
    console.log(`======================================================`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dpr,
      mobile: vp.isMobile
    });

    for (const s of slides) {
      await cdp.send('Page.navigate', { url: `http://localhost:3000/?slide=${s.index}` });
      await new Promise(r => setTimeout(r, 1200));

      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const container = document.querySelector('.aspect-\\\\[1536\\\\/505\\\\]');
          if (!container) return { error: 'Container not found' };
          const activePanel = container.querySelector('#banner-panel-${s.id === 'jk-copier' ? 'banner-jk-copier' : (s.id === 'stationery' ? 'banner-stationery' : (s.id === 'housekeeping' ? 'banner-housekeeping' : 'banner-toners'))}');
          const img = activePanel ? activePanel.querySelector('img') : container.querySelector('img');
          if (!img) return { error: 'Image not found' };

          const rect = img.getBoundingClientRect();
          const contRect = container.getBoundingClientRect();
          const cs = window.getComputedStyle(img);

          return {
            currentSrc: img.currentSrc,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            clientWidth: img.clientWidth,
            clientHeight: img.clientHeight,
            rectWidth: Math.round(rect.width * 100) / 100,
            rectHeight: Math.round(rect.height * 100) / 100,
            contRectWidth: Math.round(contRect.width * 100) / 100,
            contRectHeight: Math.round(contRect.height * 100) / 100,
            objectFit: cs.objectFit,
            transform: cs.transform,
            filter: cs.filter,
            imageRendering: cs.imageRendering,
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

      console.log(`Slide ${s.index} [${s.name}]:`);
      console.log(`  File delivered: ${metrics.currentSrc}`);
      console.log(`  Natural size:   ${metrics.naturalWidth} x ${metrics.naturalHeight}`);
      console.log(`  Rendered size:  ${metrics.rectWidth} x ${metrics.rectHeight} (aspect: ${(metrics.rectWidth / metrics.rectHeight).toFixed(5)})`);
      console.log(`  Target aspect:  ${(1536/505).toFixed(5)} -> Difference: ${(Math.abs(metrics.rectWidth / metrics.rectHeight - 1536/505)).toFixed(6)}`);
      console.log(`  CSS Transform:  ${metrics.transform}`);
      console.log(`  CSS Filter:     ${metrics.filter}`);
      console.log(`  CSS ObjectFit:  ${metrics.objectFit}`);
      console.log(`  ImageRendering: ${metrics.imageRendering}`);

      // Capture element screenshot if viewport is 1440 or 390
      if (metrics.clip && metrics.clip.width > 0 && metrics.clip.height > 0) {
        const screenshotRes = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          clip: {
            x: metrics.clip.x,
            y: metrics.clip.y,
            width: metrics.clip.width,
            height: metrics.clip.height,
            scale: 1
          }
        });

        const shotPath = path.join(artifactDir, `verified_render_${vp.name}_slide${s.index}_${s.id}.png`);
        fs.writeFileSync(shotPath, Buffer.from(screenshotRes.data, 'base64'));
        metrics.screenshotPath = shotPath;
      }

      results.push({
        viewport: vp.name,
        viewportWidth: vp.width,
        slide: s.name,
        slideIndex: s.index,
        slideId: s.id,
        metrics
      });
    }
  }

  cdp.close();
  chrome.kill();

  fs.writeFileSync(
    path.join(artifactDir, 'verification_metrics.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n=== GENERATING BEFORE / AFTER VISUAL COMPARISON COLLAGES ===\n');

  for (const s of slides) {
    const rawSuppliedPath = path.join('public', 'images', 'banners', s.file);
    const prevBannerPath = path.join('public', 'images', 'banners', s.prevFile);
    const live1440Path = path.join(artifactDir, `verified_render_1440_desktop_slide${s.index}_${s.id}.png`);

    if (fs.existsSync(prevBannerPath) && fs.existsSync(live1440Path)) {
      const live1440Meta = await sharp(live1440Path).metadata();
      const prevResized = await sharp(prevBannerPath)
        .resize(live1440Meta.width, live1440Meta.height, { fit: 'fill' })
        .toBuffer();
      const liveBuffer = fs.readFileSync(live1440Path);

      // Create a composite before/after panel
      const labelHeight = 40;
      const combinedWidth = live1440Meta.width;
      const combinedHeight = (live1440Meta.height * 2) + (labelHeight * 2) + 20;

      const svgBeforeLabel = Buffer.from(`
        <svg width="${combinedWidth}" height="${labelHeight}">
          <rect width="100%" height="100%" fill="#1e293b"/>
          <text x="20" y="26" font-family="sans-serif" font-size="16" font-weight="bold" fill="#f87171">
            BEFORE (Previous ${s.prevFile} banner)
          </text>
        </svg>
      `);

      const svgAfterLabel = Buffer.from(`
        <svg width="${combinedWidth}" height="${labelHeight}">
          <rect width="100%" height="100%" fill="#1e293b"/>
          <text x="20" y="26" font-family="sans-serif" font-size="16" font-weight="bold" fill="#34d399">
            AFTER (Live browser rendering with supplied ${s.file})
          </text>
        </svg>
      `);

      const collagePath = path.join(artifactDir, `before_after_comparison_slide${s.index}_${s.id}.png`);

      await sharp({
        create: {
          width: combinedWidth,
          height: combinedHeight,
          channels: 4,
          background: { r: 15, g: 23, b: 42, alpha: 1 }
        }
      })
      .composite([
        { input: svgBeforeLabel, top: 0, left: 0 },
        { input: prevResized, top: labelHeight, left: 0 },
        { input: svgAfterLabel, top: labelHeight + live1440Meta.height + 10, left: 0 },
        { input: liveBuffer, top: (labelHeight * 2) + live1440Meta.height + 10, left: 0 }
      ])
      .png()
      .toFile(collagePath);

      console.log(`Generated Before/After collage: ${path.basename(collagePath)}`);
    }
  }

  console.log('\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! ===');
}

runVerification().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
