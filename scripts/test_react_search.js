const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const QA_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\qa_visuals';

async function testReactSearch() {
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
  await send('Page.navigate', { url: 'https://officebazzar.com/products' });
  await new Promise(r => setTimeout(r, 4000));

  // Trigger React input change
  const searchResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('catalog-search-input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Tissue');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`,
    returnByValue: true
  });
  console.log('Search dispatched:', searchResult.result.value);

  await new Promise(r => setTimeout(r, 2000));

  const badgeText = await send('Runtime.evaluate', {
    expression: `(() => {
      const badge = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Showing') && e.innerText.includes('of') && e.innerText.includes('products'));
      return badge ? badge.innerText.replace(/\\s+/g, ' ').trim() : 'NOT_FOUND';
    })()`,
    returnByValue: true
  });
  console.log('Filtered Badge Text:', badgeText.result.value);

  // Capture screenshot of search result
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(QA_DIR, '04_search_tissue_verified.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 04_search_tissue_verified.png');

  // Test Category Dropdown
  await send('Runtime.evaluate', {
    expression: `(() => {
      const select = document.querySelector('select');
      select.value = 'cat:office-stationery';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 2000));

  const catBadgeText = await send('Runtime.evaluate', {
    expression: `(() => {
      const badge = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Showing') && e.innerText.includes('of') && e.innerText.includes('products'));
      return badge ? badge.innerText.replace(/\\s+/g, ' ').trim() : 'NOT_FOUND';
    })()`,
    returnByValue: true
  });
  console.log('Category Filtered Badge Text (Stationery):', catBadgeText.result.value);

  const shotCat = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(QA_DIR, '05_category_stationery_dropdown.png'), Buffer.from(shotCat.data, 'base64'));
  console.log('Saved 05_category_stationery_dropdown.png');

  ws.close();
  chrome.kill();
}

testReactSearch().catch(console.error);

