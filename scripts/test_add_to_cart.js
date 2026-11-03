const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const QA_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\qa_visuals';

async function testAddToCart() {
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
  await send('Page.navigate', { url: 'https://officebazzar.com/product/tissue-paper-napkin' });
  await new Promise(r => setTimeout(r, 4000));

  // Find and click the Add Cart button
  const clickResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.innerText && b.innerText.includes('Add Cart'));
      if (addBtn) {
        addBtn.click();
        return 'BUTTON_CLICKED: ' + addBtn.innerText;
      }
      return 'BUTTON_NOT_FOUND';
    })()`,
    returnByValue: true
  });
  console.log('Add Cart Click Result:', clickResult.result.value);

  await new Promise(r => setTimeout(r, 2000));

  // Capture screenshot after clicking Add Cart
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(QA_DIR, '09_after_add_cart_click.png'), Buffer.from(shot1.data, 'base64'));
  console.log('Saved 09_after_add_cart_click.png');

  // Check Cart status in localStorage or header badge
  const storageStatus = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        localStorageKeys: Object.keys(localStorage),
        cartState: localStorage.getItem('officebazzar_cart') || localStorage.getItem('cart') || localStorage.getItem('quote_items')
      };
    })()`,
    returnByValue: true
  });
  console.log('Cart Storage Status:', storageStatus.result.value);

  // Navigate to /cart
  await send('Page.navigate', { url: 'https://officebazzar.com/cart' });
  await new Promise(r => setTimeout(r, 4000));

  const shotCart = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(QA_DIR, '10_cart_page_verified.png'), Buffer.from(shotCart.data, 'base64'));
  console.log('Saved 10_cart_page_verified.png');

  const cartContent = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        bodyText: document.body.innerText.slice(0, 500),
        hasTissue: document.body.innerText.includes('Tissue Paper Napkin')
      };
    })()`,
    returnByValue: true
  });
  console.log('Cart Page Contents:', cartContent.result.value);

  ws.close();
  chrome.kill();
}

testAddToCart().catch(console.error);

