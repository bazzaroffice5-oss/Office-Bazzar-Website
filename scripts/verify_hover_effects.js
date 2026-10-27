const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const artifactDir = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d1ae96ca-c224-47e6-83e3-7ef8a75670b4';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function testHoverInteractions() {
  console.log('=== STARTING INTERACTIVE HOVER EFFECTS VERIFICATION ===\n');

  const profileDir = path.join(artifactDir, 'scratch', 'cdp_profile_hover_test');
  fs.mkdirSync(profileDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const list = await new Promise((resolve, reject) => {
    http.get('http://localhost:9224/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTarget = list.find(t => t.type === 'page') || list[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  // Set desktop 1440x900 viewport
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1.0,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: 'http://localhost:3000/?slide=0' });
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n--- 1. Testing Category Tabs Hover Interactions ---');
  const tabNames = ['JK COPIER', 'STATIONERY', 'HOUSEKEEPING', 'TONER & INK'];

  for (let i = 0; i < 4; i++) {
    // Get tab coordinates
    const tabCoords = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-tab-index="${i}"]');
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
      })()`,
      returnByValue: true
    });

    if (!tabCoords.result.value) {
      console.error(`Tab ${i} not found!`);
      continue;
    }

    const { x, y } = tabCoords.result.value;

    // Measure normal unhovered state first
    const normalTabStyle = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-tab-index="${i}"]');
        const heading = btn.querySelector('div');
        const csBtn = window.getComputedStyle(btn);
        const csHeading = window.getComputedStyle(heading);
        const rect = btn.getBoundingClientRect();
        return {
          bgColor: csBtn.backgroundColor,
          transform: csBtn.transform,
          translate: csBtn.translate,
          top: rect.top,
          headingColor: csHeading.color,
          borderBottomWidth: csBtn.borderBottomWidth,
          borderBottomColor: csBtn.borderBottomColor,
          boxShadow: csBtn.boxShadow
        };
      })()`,
      returnByValue: true
    });

    // Dispatch mouse move over the tab
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: Math.round(x),
      y: Math.round(y)
    });

    await new Promise(r => setTimeout(r, 350)); // wait for 250ms transition to complete

    // Inspect hovered styles
    const hoveredStyle = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-tab-index="${i}"]');
        const heading = btn.querySelector('div');
        const csBtn = window.getComputedStyle(btn);
        const csHeading = window.getComputedStyle(heading);
        const rect = btn.getBoundingClientRect();
        return {
          bgColor: csBtn.backgroundColor,
          transform: csBtn.transform,
          translate: csBtn.translate,
          top: rect.top,
          borderBottomColor: csBtn.borderBottomColor,
          borderBottomWidth: csBtn.borderBottomWidth,
          headingColor: csHeading.color,
          boxShadow: csBtn.boxShadow,
          rectY: rect.top,
          rectHeight: rect.height
        };
      })()`,
      returnByValue: true
    });

    const n = normalTabStyle.result.value;
    const s = hoveredStyle.result.value;
    console.log(`\nTab ${i} [${tabNames[i]}] on HOVER:`);
    console.log(`  Normal Translate/Top: ${n.translate || n.transform} (top: ${n.top.toFixed(2)}) -> Hover: ${s.translate || s.transform} (top: ${s.top.toFixed(2)}, Δ: ${(s.top - n.top).toFixed(2)}px)`);
    console.log(`  Background:   ${n.bgColor} -> ${s.bgColor}`);
    console.log(`  Heading Color:${n.headingColor} -> ${s.headingColor}`);
    console.log(`  Bottom Border:${s.borderBottomWidth} ${s.borderBottomColor}`);
    console.log(`  Box Shadow:   ${s.boxShadow}`);

    // Capture screenshot of the hovered tab strip
    const stripRect = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const container = document.querySelector('[role="tablist"]');
        const r = container.getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.max(0, Math.round(r.top - 8)), width: Math.round(r.width), height: Math.round(r.height + 16) };
      })()`,
      returnByValue: true
    });

    if (stripRect.result.value) {
      const clip = { ...stripRect.result.value, scale: 1 };
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip
      });
      const shotFile = path.join(artifactDir, `hover_tab_${i}_${tabNames[i].toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
      fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
      console.log(`  Captured screenshot: ${path.basename(shotFile)}`);
    }

    // Move mouse away to reset
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 10,
      y: 10
    });
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n--- 2. Testing Feature Cards Hover Interactions ---');
  const cardNames = [
    '100% Genuine Supplies',
    'GST Input Credit Invoices',
    'PAN India Logistics',
    'Enterprise Pricing'
  ];

  for (let i = 0; i < 4; i++) {
    const cardCoords = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cards = document.querySelectorAll('.mt-3.grid > div');
        const card = cards[${i}];
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
      })()`,
      returnByValue: true
    });

    if (!cardCoords.result.value) {
      console.error(`Card ${i} not found!`);
      continue;
    }

    const { x, y } = cardCoords.result.value;

    // Normal unhovered styles first
    const normalStyle = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelectorAll('.mt-3.grid > div')[${i}];
        const cs = window.getComputedStyle(card);
        const iconDiv = card.querySelector('div');
        const csIcon = window.getComputedStyle(iconDiv);
        const rect = card.getBoundingClientRect();
        return {
          transform: cs.transform,
          translate: cs.translate,
          top: rect.top,
          borderColor: cs.borderColor,
          boxShadow: cs.boxShadow,
          iconBg: csIcon.backgroundColor
        };
      })()`,
      returnByValue: true
    });

    // Hover
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: Math.round(x),
      y: Math.round(y)
    });

    await new Promise(r => setTimeout(r, 350));

    // Hovered styles
    const hoveredStyle = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelectorAll('.mt-3.grid > div')[${i}];
        const cs = window.getComputedStyle(card);
        const iconDiv = card.querySelector('div');
        const csIcon = window.getComputedStyle(iconDiv);
        const rect = card.getBoundingClientRect();
        return {
          transform: cs.transform,
          translate: cs.translate,
          top: rect.top,
          borderColor: cs.borderColor,
          boxShadow: cs.boxShadow,
          iconBg: csIcon.backgroundColor,
          iconColor: csIcon.color
        };
      })()`,
      returnByValue: true
    });

    const n = normalStyle.result.value;
    const h = hoveredStyle.result.value;

    console.log(`\nCard ${i} [${cardNames[i]}]:`);
    console.log(`  Normal Translate/Top: ${n.translate || n.transform} (top: ${n.top.toFixed(2)}) -> Hover: ${h.translate || h.transform} (top: ${h.top.toFixed(2)}, Δ: ${(h.top - n.top).toFixed(2)}px)`);
    console.log(`  Normal Border:        ${n.borderColor} -> Hover: ${h.borderColor}`);
    console.log(`  Normal Icon Bg:       ${n.iconBg}      -> Hover: ${h.iconBg}`);
    console.log(`  Normal Shadow:        ${n.boxShadow}   -> Hover: ${h.boxShadow}`);

    // Capture screenshot of the hovered cards row
    const cardsRowRect = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const row = document.querySelector('.mt-3.grid');
        const r = row.getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.max(0, Math.round(r.top - 8)), width: Math.round(r.width), height: Math.round(r.height + 16) };
      })()`,
      returnByValue: true
    });

    if (cardsRowRect.result.value) {
      const clip = { ...cardsRowRect.result.value, scale: 1 };
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip
      });
      const shotFile = path.join(artifactDir, `hover_card_${i}_${cardNames[i].toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
      fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
      console.log(`  Captured screenshot: ${path.basename(shotFile)}`);
    }

    // Move mouse away
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 10,
      y: 10
    });
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n--- 3. Testing Keyboard Focus States ---');
  // Focus Tab 1
  const focusTabRes = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-tab-index="1"]');
      btn.focus();
      const cs = window.getComputedStyle(btn);
      return { outline: cs.outline, ring: cs.boxShadow };
    })()`,
    returnByValue: true
  });
  console.log('Tab 1 focused box-shadow/ring:', focusTabRes.result.value);

  // Focus Card 2
  const focusCardRes = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelectorAll('.mt-3.grid > div')[2];
      card.focus();
      const cs = window.getComputedStyle(card);
      return { outline: cs.outline, ring: cs.boxShadow };
    })()`,
    returnByValue: true
  });
  console.log('Card 2 focused box-shadow/ring:', focusCardRes.result.value);

  // Capture whole section
  const sectionRect = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const tablist = document.querySelector('[role="tablist"]');
      const cards = document.querySelector('.mt-3.grid');
      const tr = tablist.getBoundingClientRect();
      const cr = cards.getBoundingClientRect();
      return {
        x: Math.round(tr.left),
        y: Math.max(0, Math.round(tr.top - 8)),
        width: Math.round(tr.width),
        height: Math.round(cr.bottom - tr.top + 16)
      };
    })()`,
    returnByValue: true
  });

  if (sectionRect.result.value) {
    const clip = { ...sectionRect.result.value, scale: 1 };
    const fullSectionShot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip
    });
    const fullPath = path.join(artifactDir, 'tabs_and_feature_cards_desktop_1440.png');
    fs.writeFileSync(fullPath, Buffer.from(fullSectionShot.data, 'base64'));
    console.log(`\nCaptured full section screenshot: ${path.basename(fullPath)}`);
  }

  // Mobile 390px capture
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2.0,
    mobile: true
  });
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/?slide=0' });
  await new Promise(r => setTimeout(r, 1200));

  const mobileSectionRect = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const tablist = document.querySelector('[role="tablist"]');
      const cards = document.querySelector('.mt-3.grid');
      const tr = tablist.getBoundingClientRect();
      const cr = cards.getBoundingClientRect();
      return {
        x: Math.round(tr.left),
        y: Math.max(0, Math.round(tr.top - 4)),
        width: Math.round(tr.width),
        height: Math.round(cr.bottom - tr.top + 8)
      };
    })()`,
    returnByValue: true
  });

  if (mobileSectionRect.result.value) {
    const clip = { ...mobileSectionRect.result.value, scale: 1 };
    const mobileShot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip
    });
    const mobPath = path.join(artifactDir, 'tabs_and_feature_cards_mobile_390.png');
    fs.writeFileSync(mobPath, Buffer.from(mobileShot.data, 'base64'));
    console.log(`Captured mobile 390px section screenshot: ${path.basename(mobPath)}`);
  }

  cdp.close();
  chrome.kill();
  console.log('\n=== ALL HOVER INTERACTION TESTS FINISHED ===');
}

testHoverInteractions().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
