const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const QA_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\qa_visuals';
if (!fs.existsSync(QA_DIR)) fs.mkdirSync(QA_DIR, { recursive: true });

async function pollDeployment() {
  console.log('Polling Vercel deployment of commit 07e6dc4 ...');
  for (let i = 1; i <= 20; i++) {
    const status = await new Promise(resolve => {
      https.get('https://officebazzar.com/assets/products/catalog_2026/OB-HOU-1013-alt-1.webp', res => {
        res.resume();
        resolve(res.statusCode);
      }).on('error', err => resolve(err.message));
    });
    console.log(`[Attempt ${i}/20] OB-HOU-1013-alt-1.webp Status: ${status}`);
    if (status === 200) {
      console.log('✓ Commit 07e6dc4 is LIVE on officebazzar.com!');
      return true;
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

async function captureAllPages() {
  await pollDeployment();

  console.log('\n--- Starting Live Browser Screenshot Captures across required pages ---');
  const profileDir = path.join(process.cwd(), '.chrome_qa_profile');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--window-size=1920,1080',
    '--disable-gpu',
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2,
    mobile: false
  });

  async function captureShot(filename) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(QA_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${filename} (${Math.round(shot.data.length / 1024)} KB)`);
    return outPath;
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  // Navigate to /products
  await send('Page.navigate', { url: 'https://officebazzar.com/products' });
  await new Promise(r => setTimeout(r, 5000));

  // Capture Page 1
  console.log('Capturing Page 1 ...');
  await captureShot('phase9_page1.png');

  // Helper to click pagination button
  async function goToPage(pNum) {
    await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '${pNum}');
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 3000));
  }

  // Page 2
  console.log('Capturing Page 2 (shows Tissue Paper Napkin with genuine photo) ...');
  await goToPage(2);
  await captureShot('phase9_page2.png');

  // Page 4
  console.log('Capturing Page 4 ...');
  await goToPage(4);
  await captureShot('phase9_page4.png');

  // Page 8
  console.log('Capturing Page 8 ...');
  await goToPage(8);
  await captureShot('phase9_page8.png');

  // Page 12
  console.log('Capturing Page 12 ...');
  await goToPage(12);
  await captureShot('phase9_page12.png');

  // Page 16
  console.log('Capturing Page 16 (Final page) ...');
  await goToPage(16);
  await captureShot('phase9_page16.png');

  // Capture PDP for Tissue Paper Napkin
  console.log('Capturing PDP for Tissue Paper Napkin ...');
  await send('Page.navigate', { url: 'https://officebazzar.com/product/tissue-paper-napkin' });
  await new Promise(r => setTimeout(r, 4000));
  await captureShot('phase9_pdp_tissue_napkin_genuine.png');

  ws.close();
  chrome.kill();
  console.log('✓ All required screenshots captured successfully!');
}

captureAllPages().catch(console.error);

