const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52';
const profileDir = path.join(process.cwd(), '.chrome_cat_wide_' + Date.now());

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + profileDir,
    '--window-size=1280,1000',
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
    height: 1000,
    deviceScaleFactor: 2,
    mobile: false
  });

  // Test 1: All Products (/products)
  console.log('Navigating to /products ...');
  await send('Page.navigate', { url: 'http://localhost:3000/products' });
  await new Promise(r => setTimeout(r, 4500));
  await captureShot(path.join(ARTIFACT_DIR, 'audit_page_all_products.png'));

  // Test 2: Office Stationery
  console.log('Navigating to Office Stationery ...');
  await send('Page.navigate', { url: 'http://localhost:3000/category/office-stationery' });
  await new Promise(r => setTimeout(r, 4000));
  await captureShot(path.join(ARTIFACT_DIR, 'audit_category_stationery.png'));

  // Test 3: Housekeeping & Hygiene (Brushes)
  console.log('Navigating to Housekeeping & Hygiene ...');
  await send('Page.navigate', { url: 'http://localhost:3000/category/housekeeping-hygiene?sub=cloths-scrubbers-brushes' });
  await new Promise(r => setTimeout(r, 4000));
  await captureShot(path.join(ARTIFACT_DIR, 'audit_category_housekeeping.png'));

  // Test 4: Printers & Technology
  console.log('Navigating to Printers & Technology ...');
  await send('Page.navigate', { url: 'http://localhost:3000/category/printers-technology' });
  await new Promise(r => setTimeout(r, 4000));
  await captureShot(path.join(ARTIFACT_DIR, 'audit_category_technology.png'));

  // Test 5: Packaging Supplies (Safety Tapes)
  console.log('Navigating to Packaging Supplies ...');
  await send('Page.navigate', { url: 'http://localhost:3000/category/packaging-supplies?sub=floor-marking-safety-tapes' });
  await new Promise(r => setTimeout(r, 4000));
  await captureShot(path.join(ARTIFACT_DIR, 'audit_category_packaging.png'));

  // Test 6: Mobile Viewport (iPhone 14 / 390x844)
  console.log('Switching to mobile viewport...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Page.navigate', { url: 'http://localhost:3000/products' });
  await new Promise(r => setTimeout(r, 4000));
  await captureShot(path.join(ARTIFACT_DIR, 'audit_mobile_view.png'));

  ws.close();
  chrome.kill();
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (e) {}
  console.log('✓ Catalogue-wide visual audit complete!');
  process.exit(0);
}

run().catch(console.error);

