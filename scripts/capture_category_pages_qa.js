const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const QA_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\qa_visuals';
if (!fs.existsSync(QA_DIR)) fs.mkdirSync(QA_DIR, { recursive: true });

async function run() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome_qa_category_'));
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9345;

  console.log(`Launching Chrome on port ${port}...`);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const list = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, (res) => {
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

  await new Promise((resolve) => {
    ws.onopen = resolve;
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  });

  console.log('Connected to Chrome DevTools Protocol!');
  await send('Page.enable');
  await send('Runtime.enable');

  const testPages = [
    {
      id: 'housekeeping_landing',
      title: 'Housekeeping & Hygiene — Category Landing (Cards View)',
      url: 'http://localhost:3009/category/housekeeping-hygiene'
    },
    {
      id: 'stationery_landing',
      title: 'Office Stationery — Category Landing (Cards View)',
      url: 'http://localhost:3009/category/office-stationery'
    },
    {
      id: 'printers_landing',
      title: 'Printers & Technology — Category Landing (Cards View)',
      url: 'http://localhost:3009/category/printers-technology'
    },
    {
      id: 'packaging_landing',
      title: 'Packaging Supplies — Category Landing (Cards View)',
      url: 'http://localhost:3009/category/packaging-supplies'
    },
    {
      id: 'housekeeping_products',
      title: 'Housekeeping & Hygiene — All Products (Product Listing View)',
      url: 'http://localhost:3009/category/housekeeping-hygiene?view=all'
    }
  ];

  const results = [];

  for (const page of testPages) {
    console.log(`\nTesting: ${page.title}`);
    console.log(`URL: ${page.url}`);

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: page.url });
    await new Promise(r => setTimeout(r, 2000));

    // Verify text removal in DOM
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText || '';
          return {
            hasCorporateSupplyHeader: bodyText.includes('Corporate Supply Across India') || bodyText.includes('Bulk Housekeeping & Hygiene Procurement') || bodyText.includes('Bulk Office Stationery Procurement'),
            hasBulkRateContractLink: bodyText.includes('Request Bulk Rate Contract'),
            hasSubmitRfqLink: bodyText.includes('Submit Custom RFQ'),
            hasGstFaqLink: bodyText.includes('GST & Delivery FAQ')
          };
        })()
      `,
      returnByValue: true
    });

    const checks = (evalRes.result && evalRes.result.value) ? evalRes.result.value : evalRes.value;
    console.log('  Checks:');
    console.log(`    - Corporate Supply Header: ${checks.hasCorporateSupplyHeader ? '❌ PRESENT' : '✅ REMOVED'}`);
    console.log(`    - Request Bulk Rate Contract: ${checks.hasBulkRateContractLink ? '❌ PRESENT' : '✅ REMOVED'}`);
    console.log(`    - Submit Custom RFQ: ${checks.hasSubmitRfqLink ? '❌ PRESENT' : '✅ REMOVED'}`);
    console.log(`    - GST & Delivery FAQ: ${checks.hasGstFaqLink ? '❌ PRESENT' : '✅ REMOVED'}`);

    // Scroll down to cards / bottom of content
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 500));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const filename = `updated_category_${page.id}.png`;
    const filepath = path.join(QA_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(shot.data, 'base64'));
    console.log(`  Screenshot saved: ${filepath}`);

    const passed = !checks.hasCorporateSupplyHeader &&
                   !checks.hasBulkRateContractLink &&
                   !checks.hasSubmitRfqLink &&
                   !checks.hasGstFaqLink;

    results.push({
      id: page.id,
      title: page.title,
      url: page.url,
      checks,
      passed,
      screenshot: filepath
    });
  }

  // Cleanup
  try { ws.close(); } catch (e) {}
  try { chrome.kill(); } catch (e) {}
  try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}

  console.log('\n====================================================');
  console.log('FINAL CATEGORY VERIFICATION AUDIT');
  console.log('====================================================');
  let overallPass = true;
  for (const r of results) {
    console.log(`${r.title}: ${r.passed ? '✅ 100% CLEAN' : '❌ VIOLATIONS FOUND'}`);
    if (!r.passed) overallPass = false;
  }

  fs.writeFileSync('scripts/category_pages_qa_results.json', JSON.stringify(results, null, 2));

  if (overallPass) {
    console.log('\n🎉 ALL CATEGORY PAGES VERIFIED CLEAN! Zero bottom SEO boxes remaining.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
