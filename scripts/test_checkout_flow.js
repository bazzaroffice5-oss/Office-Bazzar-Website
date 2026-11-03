const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const QA_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\qa_visuals';

async function testCheckoutFlow() {
  const profileDir = path.join(process.cwd(), '.chrome_qa_profile');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--window-size=1920,1080',
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

  // Go to /cart
  await send('Page.navigate', { url: 'https://officebazzar.com/cart' });
  await new Promise(r => setTimeout(r, 4000));

  // Click Request a Quote button
  const clickQuote = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('a, button')).find(e => e.innerText && e.innerText.includes('Request a Quote'));
      if (btn) {
        btn.click();
        return 'CLICKED: ' + (btn.getAttribute('href') || btn.tagName);
      }
      return 'NOT_FOUND';
    })()`,
    returnByValue: true
  });
  console.log('Request a Quote Clicked:', clickQuote.result.value);

  await new Promise(r => setTimeout(r, 4000));

  const pageUrl = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('Current URL after click:', pageUrl.result.value);

  const shotCheckout = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(QA_DIR, '11_quote_checkout_verified.png'), Buffer.from(shotCheckout.data, 'base64'));
  console.log('Saved 11_quote_checkout_verified.png');

  ws.close();
  chrome.kill();
}

testCheckoutFlow().catch(console.error);

