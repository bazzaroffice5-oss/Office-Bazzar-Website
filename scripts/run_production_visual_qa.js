const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const QA_DIR = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\qa_visuals';
if (!fs.existsSync(QA_DIR)) fs.mkdirSync(QA_DIR, { recursive: true });

async function runQA() {
  console.log('================================================================');
  console.log('       OFFICEBAZZAR COMPREHENSIVE PRODUCTION VISUAL QA        ');
  console.log('================================================================\n');

  const profileDir = path.join(process.cwd(), '.chrome_qa_profile');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--window-size=1920,1080',
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
  console.log('Connected to Chrome DevTools Protocol.');

  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  async function captureScreenshot(filename) {
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
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

  // -------------------------------------------------------------
  // STEP 1: Live Catalogue Verification
  // -------------------------------------------------------------
  console.log('\n--- STEP 1: Live Catalogue Count & Header Verification ---');
  await send('Page.navigate', { url: 'https://officebazzar.com/products' });
  await new Promise(r => setTimeout(r, 6000));

  const pageTitle = await evaluate('document.title');
  const counterText = await evaluate(`(() => {
    const el = document.querySelector('span, div, p')?.parentElement?.innerText || '';
    const badge = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Showing') && e.innerText.includes('of') && e.innerText.includes('products'));
    return badge ? badge.innerText.replace(/\\s+/g, ' ').trim() : 'NOT_FOUND';
  })()`);

  console.log(`Live Page Title: "${pageTitle}"`);
  console.log(`Live Counter Badge: "${counterText}"`);

  await captureScreenshot('01_storefront_page1.png');

  // Check Category Dropdown counts
  const catDropdownOptions = await evaluate(`(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const catSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('All Categories')));
    if (!catSelect) return [];
    return Array.from(catSelect.options).map(o => o.text.trim());
  })()`);
  console.log('Category Dropdown Options:', catDropdownOptions);

  // Check Brand Dropdown counts
  const brandDropdownOptions = await evaluate(`(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const brandSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('All Brands')));
    if (!brandSelect) return [];
    return Array.from(brandSelect.options).slice(0, 10).map(o => o.text.trim());
  })()`);
  console.log('Sample Brand Dropdown Options:', brandDropdownOptions);

  // -------------------------------------------------------------
  // STEP 2: Product Image & Pagination Verification Across All Pages
  // -------------------------------------------------------------
  console.log('\n--- STEP 2: Inspecting All 16 Pages & All 383 Products ---');

  const totalPages = await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => /^\\d+$/.test(b.innerText.trim()));
    return btns.length > 0 ? Math.max(...btns.map(b => parseInt(b.innerText.trim(), 10))) : 1;
  })()`);
  console.log(`Detected Total Pagination Pages: ${totalPages}`);

  const allCollectedCards = [];
  let brokenImagesCount = 0;
  let placeholderCount = 0;
  let supplierImageCount = 0;

  for (let page = 1; page <= totalPages; page++) {
    // Click page button if page > 1
    if (page > 1) {
      await evaluate(`(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '${page}');
        if (btn) btn.click();
      })()`);
      await new Promise(r => setTimeout(r, 2000));
    }

    if (page === 2) {
      await captureScreenshot('02_storefront_page2.png');
    }
    if (page === totalPages) {
      await captureScreenshot('03_storefront_page16_last.png');
    }

    const cardsOnPage = await evaluate(`(() => {
      // Find all product card links or containers
      const links = Array.from(document.querySelectorAll('a[href^="/product/"]'));
      // Unique product slugs on page
      const seen = new Set();
      const results = [];
      for (const a of links) {
        const href = a.getAttribute('href');
        if (seen.has(href)) continue;
        seen.add(href);

        // find card container
        const card = a.closest('.group') || a.parentElement;
        const img = card ? card.querySelector('img') : null;
        const titleEl = card ? card.querySelector('h2, h3, p.font-medium, .line-clamp-2') : null;

        results.push({
          href,
          title: titleEl ? titleEl.innerText.trim() : a.innerText.trim(),
          imgSrc: img ? img.src : null,
          imgComplete: img ? img.complete : false,
          naturalWidth: img ? img.naturalWidth : 0,
          naturalHeight: img ? img.naturalHeight : 0,
          renderedWidth: img ? img.clientWidth : 0,
          renderedHeight: img ? img.clientHeight : 0,
          isPlaceholder: img ? (img.src.includes('placeholder-product.svg') || img.src.includes('data:image')) : true
        });
      }
      return results;
    })()`);

    for (const card of cardsOnPage) {
      allCollectedCards.push(card);
      if (card.isPlaceholder) {
        placeholderCount++;
      } else {
        supplierImageCount++;
      }

      if (!card.imgSrc || (card.imgComplete && card.naturalWidth === 0 && !card.imgSrc.includes('.svg'))) {
        brokenImagesCount++;
        console.error(`[BROKEN IMAGE] Page ${page}: ${card.title} (${card.href}) -> ${card.imgSrc}`);
      }
    }

    console.log(`Page ${page}/${totalPages}: Collected ${cardsOnPage.length} cards (Running total: ${allCollectedCards.length})`);
  }

  console.log(`\nAll Pages Scan Complete:`);
  console.log(`- Total Unique Product Cards Seen Live: ${allCollectedCards.length}`);
  console.log(`- Supplier Photo Products: ${supplierImageCount}`);
  console.log(`- Placeholder Products: ${placeholderCount}`);
  console.log(`- Broken Images: ${brokenImagesCount}`);

  // Check visibility of OB-HOU-1018 and OB-TIS-1096
  const houCard = allCollectedCards.find(c => c.href.includes('kangaro-staplers-hd-10d') || c.title.toLowerCase().includes('kangaro staplers hd 10d'));
  const tisCard = allCollectedCards.find(c => c.href.includes('tissue-paper-napkin') || c.title.toLowerCase().includes('tissue paper napkin'));

  console.log('\n--- Specific Required Product Verification ---');
  console.log('OB-HOU-1018 (Kangaro Stapler HD 10D):', houCard ? `FOUND: ${houCard.title} (${houCard.href}) - img: ${houCard.imgSrc}` : 'NOT FOUND');
  console.log('OB-TIS-1096 (Tissue Paper Napkin):', tisCard ? `FOUND: ${tisCard.title} (${tisCard.href}) - img: ${tisCard.imgSrc}` : 'NOT FOUND');

  // -------------------------------------------------------------
  // STEP 3: Search, Filters & Sorting Verification
  // -------------------------------------------------------------
  console.log('\n--- STEP 3: Testing Search & Category Filters ---');

  // Search Test: "Tissue"
  await send('Page.navigate', { url: 'https://officebazzar.com/products' });
  await new Promise(r => setTimeout(r, 4000));

  await evaluate(`(() => {
    const input = document.querySelector('input[placeholder*="Search products"]');
    if (input) {
      input.value = 'Tissue';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await new Promise(r => setTimeout(r, 2000));
  await captureScreenshot('04_search_tissue.png');

  const tissueSearchResults = await evaluate(`(() => {
    const badge = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Showing') && e.innerText.includes('of') && e.innerText.includes('products'));
    return badge ? badge.innerText.replace(/\\s+/g, ' ').trim() : '';
  })()`);
  console.log(`Search result for "Tissue": ${tissueSearchResults}`);

  // Category Filter Test: Office Stationery
  await send('Page.navigate', { url: 'https://officebazzar.com/category/office-stationery' });
  await new Promise(r => setTimeout(r, 4000));
  await captureScreenshot('05_category_stationery.png');

  const stationeryCount = await evaluate(`(() => {
    const badge = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Showing') && e.innerText.includes('of') && e.innerText.includes('products'));
    return badge ? badge.innerText.replace(/\\s+/g, ' ').trim() : '';
  })()`);
  console.log(`Office Stationery Category Header: ${stationeryCount}`);

  // Category Filter Test: Housekeeping & Hygiene
  await send('Page.navigate', { url: 'https://officebazzar.com/category/housekeeping-hygiene' });
  await new Promise(r => setTimeout(r, 4000));
  await captureScreenshot('06_category_housekeeping.png');

  const housekeepingCount = await evaluate(`(() => {
    const badge = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Showing') && e.innerText.includes('of') && e.innerText.includes('products'));
    return badge ? badge.innerText.replace(/\\s+/g, ' ').trim() : '';
  })()`);
  console.log(`Housekeeping Category Header: ${housekeepingCount}`);

  // -------------------------------------------------------------
  // STEP 4: Product Detail Pages (PDP), Cart & Checkout Regression
  // -------------------------------------------------------------
  console.log('\n--- STEP 4: Testing PDP, Add to Cart & Checkout Flow ---');

  // Test PDP for Tissue Paper Napkin
  await send('Page.navigate', { url: 'https://officebazzar.com/product/tissue-paper-napkin' });
  await new Promise(r => setTimeout(r, 4000));
  await captureScreenshot('07_pdp_tissue_paper_napkin.png');

  const pdpInfo = await evaluate(`(() => {
    const title = document.querySelector('h1')?.innerText?.trim() || '';
    const sku = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('SKU:'))?.innerText || '';
    const price = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('₹'))?.innerText || '';
    return { title, sku, price };
  })()`);
  console.log('PDP Tissue Paper Napkin Info:', pdpInfo);

  // Test PDP for Kangaro Stapler HD 10D
  await send('Page.navigate', { url: 'https://officebazzar.com/product/kangaro-staplers-hd-10d' });
  await new Promise(r => setTimeout(r, 4000));
  await captureScreenshot('08_pdp_kangaro_stapler.png');

  const kangaroPdpInfo = await evaluate(`(() => {
    const title = document.querySelector('h1')?.innerText?.trim() || '';
    const sku = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('SKU:'))?.innerText || '';
    return { title, sku };
  })()`);
  console.log('PDP Kangaro Stapler Info:', kangaroPdpInfo);

  // Test Add to Cart on Tissue Paper Napkin PDP
  await send('Page.navigate', { url: 'https://officebazzar.com/product/tissue-paper-napkin' });
  await new Promise(r => setTimeout(r, 4000));

  const addSuccess = await evaluate(`(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Add to Cart') || b.innerText.includes('Request Quote')));
    if (addBtn) {
      addBtn.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Add to Cart button:', addSuccess);
  await new Promise(r => setTimeout(r, 2000));
  await captureScreenshot('09_cart_drawer_or_page.png');

  // Navigate to Cart Page
  await send('Page.navigate', { url: 'https://officebazzar.com/cart' });
  await new Promise(r => setTimeout(r, 4000));
  await captureScreenshot('10_cart_page.png');

  const cartItemsCount = await evaluate(`(() => {
    const items = document.querySelectorAll('div[class*="border"], li, tr');
    return document.body.innerText.includes('Tissue Paper Napkin') ? 'Item present in cart' : 'Item not found in cart';
  })()`);
  console.log('Cart Page Status:', cartItemsCount);

  // Navigate to Checkout Page
  await send('Page.navigate', { url: 'https://officebazzar.com/checkout' });
  await new Promise(r => setTimeout(r, 4000));
  await captureScreenshot('11_checkout_page.png');

  const checkoutFields = await evaluate(`(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => i.placeholder || i.name || i.type);
    return inputs.slice(0, 8);
  })()`);
  console.log('Checkout Form Fields Detected:', checkoutFields);

  // -------------------------------------------------------------
  // Clean up
  // -------------------------------------------------------------
  ws.close();
  chrome.kill();

  console.log('\n================================================================');
  console.log('              COMPREHENSIVE VISUAL QA COMPLETED               ');
  console.log('================================================================');

  // Save report data to JSON
  fs.writeFileSync('scripts/live_qa_results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    liveTitle: pageTitle,
    liveBadge: counterText,
    categoryDropdownOptions: catDropdownOptions,
    totalPages,
    totalCardsCollected: allCollectedCards.length,
    supplierImageCount,
    placeholderCount,
    brokenImagesCount,
    houCard,
    tisCard,
    pdpInfo,
    kangaroPdpInfo,
    cartStatus: cartItemsCount,
    checkoutFields
  }, null, 2));
}

runQA().catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});

