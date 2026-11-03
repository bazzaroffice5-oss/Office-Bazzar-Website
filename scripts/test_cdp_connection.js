const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function test() {
  const profileDir = path.join(process.cwd(), '.chrome_qa_profile');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
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

  console.log('Targets:', list.length);
  const target = list.find(t => t.type === 'page') || list[0];
  console.log('Connecting to:', target.webSocketDebuggerUrl);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
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
  console.log('WebSocket connected successfully!');

  await send('Page.enable');
  await send('Page.navigate', { url: 'https://officebazzar.com/products' });

  // Wait for load
  await new Promise(r => setTimeout(r, 5000));

  const evalRes = await send('Runtime.evaluate', {
    expression: 'document.title'
  });
  console.log('Page Title:', evalRes.result.value);

  ws.close();
  chrome.kill();
  console.log('Done test');
}

test().catch(console.error);

