const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52';
const profileDir = path.join(process.cwd(), '.chrome_card_profile_' + Date.now());

async function run() {
  console.log('Starting headless Chrome with remote debugging on port 9222...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,900',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  // Give Chrome 2 seconds to start
  await new Promise(r => setTimeout(r, 2000));

  console.log('Connecting to Chrome DevTools endpoint...');
  const list = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const target = list.find(t => t.type === 'page') || list[0];
  console.log('Connecting to WebSocket:', target.webSocketDebuggerUrl);
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
    console.log(`Saved screenshot to ${filepath} (${Math.round(shot.data.length / 1024)} KB)`);
  }

  // 1. Desktop Viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  console.log('Navigating to http://localhost:3000/products ...');
  await send('Page.navigate', { url: 'http://localhost:3000/products' });
  await new Promise(r => setTimeout(r, 4000));

  const desktopPath = path.join(ARTIFACT_DIR, 'replicated_product_cards_desktop.png');
  await captureShot(desktopPath);

  console.log('Navigating to safety tapes subcategory...');
  await send('Page.navigate', { url: 'http://localhost:3000/category/packaging-supplies?sub=floor-marking-safety-tapes' });
  await new Promise(r => setTimeout(r, 3500));

  const safetyPath = path.join(ARTIFACT_DIR, 'replicated_product_cards_safety_tapes.png');
  await captureShot(safetyPath);

  // 2. Mobile Viewport (iPhone 14 / 390x844)
  console.log('Switching to mobile viewport...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Page.navigate', { url: 'http://localhost:3000/products' });
  await new Promise(r => setTimeout(r, 3500));

  const mobilePath = path.join(ARTIFACT_DIR, 'replicated_product_cards_mobile.png');
  await captureShot(mobilePath);

  ws.close();
  chrome.kill();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('✓ All verification screenshots captured successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error in capture script:', err);
  process.exit(1);
});
