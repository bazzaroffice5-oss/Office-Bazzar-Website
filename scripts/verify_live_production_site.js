const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52';
const profileDir = path.join(process.cwd(), '.chrome_live_prod_' + Date.now());

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + profileDir,
    '--window-size=1280,1100',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const list = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const target = list.find(t => t.type === 'page') || list[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('DOM.enable');
  await send('Network.enable');
  // Clear browser cache to ensure fresh assets
  await send('Network.clearBrowserCache');

  async function captureShot(filepath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const shot = await send('Page.captureScreenshot', params);
    fs.writeFileSync(filepath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot to ${filepath}`);
  }

  // 1. Desktop Viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 1100,
    deviceScaleFactor: 2,
    mobile: false
  });

  // Capture 1: Live Production All Products (Row 1 & Row 2)
  console.log('Navigating to LIVE https://officebazzar.com/products ...');
  await send('Page.navigate', { url: 'https://officebazzar.com/products' });
  await new Promise(r => setTimeout(r, 6000));
  await captureShot(path.join(ARTIFACT_DIR, 'live_production_products_desktop.png'));

  // Capture 2: Live Production Housekeeping Category
  console.log('Navigating to LIVE https://officebazzar.com/category/housekeeping-hygiene ...');
  await send('Page.navigate', { url: 'https://officebazzar.com/category/housekeeping-hygiene?sub=cloths-scrubbers-brushes' });
  await new Promise(r => setTimeout(r, 6000));
  await captureShot(path.join(ARTIFACT_DIR, 'live_production_housekeeping_desktop.png'));

  // Capture 3: Live Production Mobile Viewport (390 x 844)
  console.log('Switching to mobile viewport for LIVE https://officebazzar.com/products ...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await send('Page.navigate', { url: 'https://officebazzar.com/products' });
  await new Promise(r => setTimeout(r, 6000));
  await captureShot(path.join(ARTIFACT_DIR, 'live_production_products_mobile.png'));

  console.log('✓ Live production visual verification complete!');
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

