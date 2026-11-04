const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const QA_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\qa_visuals';
if (!fs.existsSync(QA_DIR)) fs.mkdirSync(QA_DIR, { recursive: true });

async function run() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome_qa_full_proofs_'));
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9355;

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

  const testCases = [
    // 1. Housekeeping & Hygiene - Landing (Cards View)
    {
      id: 'housekeeping_landing_desktop',
      title: 'Housekeeping & Hygiene — Category Landing (Desktop)',
      url: 'http://localhost:3009/category/housekeeping-hygiene',
      viewport: { width: 1400, height: 1080, mobile: false }
    },
    {
      id: 'housekeeping_landing_mobile',
      title: 'Housekeeping & Hygiene — Category Landing (Mobile)',
      url: 'http://localhost:3009/category/housekeeping-hygiene',
      viewport: { width: 390, height: 844, mobile: true }
    },
    // 2. Office Stationery - Landing (Cards View)
    {
      id: 'stationery_landing_desktop',
      title: 'Office Stationery — Category Landing (Desktop)',
      url: 'http://localhost:3009/category/office-stationery',
      viewport: { width: 1400, height: 1080, mobile: false }
    },
    {
      id: 'stationery_landing_mobile',
      title: 'Office Stationery — Category Landing (Mobile)',
      url: 'http://localhost:3009/category/office-stationery',
      viewport: { width: 390, height: 844, mobile: true }
    },
    // 3. Printers & Technology - Landing (Cards View)
    {
      id: 'printers_landing_desktop',
      title: 'Printers & Technology — Category Landing (Desktop)',
      url: 'http://localhost:3009/category/printers-technology',
      viewport: { width: 1400, height: 1080, mobile: false }
    },
    {
      id: 'printers_landing_mobile',
      title: 'Printers & Technology — Category Landing (Mobile)',
      url: 'http://localhost:3009/category/printers-technology',
      viewport: { width: 390, height: 844, mobile: true }
    },
    // 4. Packaging Supplies - Landing (Cards View)
    {
      id: 'packaging_landing_desktop',
      title: 'Packaging Supplies — Category Landing (Desktop)',
      url: 'http://localhost:3009/category/packaging-supplies',
      viewport: { width: 1400, height: 1080, mobile: false }
    },
    {
      id: 'packaging_landing_mobile',
      title: 'Packaging Supplies — Category Landing (Mobile)',
      url: 'http://localhost:3009/category/packaging-supplies',
      viewport: { width: 390, height: 844, mobile: true }
    },
    // 5. Product Listing / Filter View (All Products)
    {
      id: 'housekeeping_products_desktop',
      title: 'Housekeeping & Hygiene — All Products Listing (Desktop)',
      url: 'http://localhost:3009/category/housekeeping-hygiene?view=all',
      viewport: { width: 1400, height: 1080, mobile: false }
    },
    {
      id: 'housekeeping_products_mobile',
      title: 'Housekeeping & Hygiene — All Products Listing (Mobile)',
      url: 'http://localhost:3009/category/housekeeping-hygiene?view=all',
      viewport: { width: 390, height: 844, mobile: true }
    },
    {
      id: 'stationery_products_desktop',
      title: 'Office Stationery — All Products Listing (Desktop)',
      url: 'http://localhost:3009/category/office-stationery?view=all',
      viewport: { width: 1400, height: 1080, mobile: false }
    },
    // 6. All Categories Index Page
    {
      id: 'all_categories_desktop',
      title: 'All Categories Index — /categories (Desktop)',
      url: 'http://localhost:3009/categories',
      viewport: { width: 1400, height: 1080, mobile: false }
    }
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`\n======================================================`);
    console.log(`Testing: ${tc.title}`);
    console.log(`URL:     ${tc.url}`);

    await send('Emulation.setDeviceMetricsOverride', {
      width: tc.viewport.width,
      height: tc.viewport.height,
      deviceScaleFactor: tc.viewport.mobile ? 2 : 1,
      mobile: tc.viewport.mobile
    });

    await send('Page.navigate', { url: tc.url });
    await new Promise(r => setTimeout(r, 2000));

    // Full DOM search for any remnants of the forbidden box
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText || '';
          return {
            hasCorporateSupplyHeader: bodyText.includes('Corporate Supply Across India') || 
                                      bodyText.includes('Bulk Housekeeping & Hygiene Procurement') || 
                                      bodyText.includes('Bulk Office Stationery Procurement') ||
                                      bodyText.includes('Bulk Printers & Technology Procurement') ||
                                      bodyText.includes('Bulk Packaging Supplies Procurement') ||
                                      bodyText.includes('Consolidated B2B Workplace Procurement'),
            hasBulkRateContractLink: bodyText.includes('Request Bulk Rate Contract') || bodyText.includes('Explore Bulk Orders & Rate Contracts'),
            hasSubmitRfqLink: bodyText.includes('Submit Custom RFQ') || bodyText.includes('Submit a Custom RFQ'),
            hasGstFaqLink: bodyText.includes('GST & Delivery FAQ') || bodyText.includes('Corporate Procurement FAQ')
          };
        })()
      `,
      returnByValue: true
    });

    const checks = (evalRes.result && evalRes.result.value) ? evalRes.result.value : evalRes.value;
    const passed = !checks.hasCorporateSupplyHeader &&
                   !checks.hasBulkRateContractLink &&
                   !checks.hasSubmitRfqLink &&
                   !checks.hasGstFaqLink;

    console.log('  Verification Results:');
    console.log(`    - Corporate Supply Header: ${checks.hasCorporateSupplyHeader ? '❌ PRESENT' : '✅ 100% GONE'}`);
    console.log(`    - Bulk Rate Contract Link: ${checks.hasBulkRateContractLink ? '❌ PRESENT' : '✅ 100% GONE'}`);
    console.log(`    - Submit Custom RFQ Link:  ${checks.hasSubmitRfqLink ? '❌ PRESENT' : '✅ 100% GONE'}`);
    console.log(`    - GST & Delivery FAQ Link: ${checks.hasGstFaqLink ? '❌ PRESENT' : '✅ 100% GONE'}`);

    // Scroll down to the cards grid / bottom section to photograph the exact area where the box used to be
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const mainGrid = document.querySelector('.grid') || document.body;
          if (mainGrid) {
            mainGrid.scrollIntoView({ behavior: 'instant', block: 'end' });
          } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const filename = `proof_${tc.id}.png`;
    const filepath = path.join(QA_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(shot.data, 'base64'));
    console.log(`  📸 Screenshot Captured: ${filepath}`);

    results.push({
      id: tc.id,
      title: tc.title,
      url: tc.url,
      passed,
      checks,
      screenshot: filepath,
      screenshotFilename: filename
    });
  }

  // Cleanup
  try { ws.close(); } catch (e) {}
  try { chrome.kill(); } catch (e) {}
  try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}

  console.log('\n======================================================');
  console.log('ALL CATEGORY VERIFICATION PROOFS COMPLETE');
  console.log('======================================================');
  let allPass = true;
  for (const r of results) {
    console.log(`${r.title}: ${r.passed ? '✅ 100% CLEAN' : '❌ VIOLATIONS FOUND'}`);
    if (!r.passed) allPass = false;
  }

  fs.writeFileSync('scripts/category_full_proofs_manifest.json', JSON.stringify(results, null, 2));

  if (allPass) {
    console.log('\n🎉 ALL 12 AUDIT TESTS PASSED. WHITE SEO CONTENT BOX IS COMPLETELY ELIMINATED.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

