const { spawn } = require('child_process');
const http = require('http');

async function testCDP() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d1ae96ca-c224-47e6-83e3-7ef8a75670b4\\scratch\\cdp_profile',
    'about:blank'
  ]);

  // wait 1.5s for port to open
  await new Promise(r => setTimeout(r, 1500));

  const list = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  console.log('CDP Available targets:', list.length);
  if (list.length > 0) {
    console.log('Target WS URL:', list[0].webSocketDebuggerUrl);
  }

  chrome.kill();
}

testCDP().catch(console.error);
