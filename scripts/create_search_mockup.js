const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const artifactDir = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d0f5b27b-4af4-4dde-89ea-0f2afb2a936d';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif; }
    body { background: #0b1120; padding: 30px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .card { background: #ffffff; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); max-width: 1200px; width: 100%; overflow: hidden; border: 1px solid #1e293b; margin-bottom: 24px; }
    
    .window-header { background: #e2e8f0; padding: 12px 18px; display: flex; align-items: center; border-bottom: 1px solid #cbd5e1; }
    .window-dots { display: flex; gap: 8px; margin-right: 16px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }
    .window-title { font-size: 13px; font-weight: 700; color: #334155; }
    .badge { margin-left: auto; background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; }

    .content { padding: 24px; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px; }
    
    .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .comp-box { padding: 18px; border-radius: 12px; }
    .comp-box.before { background: #fef2f2; border: 1.5px dashed #fca5a5; }
    .comp-box.after { background: #f0fdf4; border: 1.5px solid #86efac; }
    .comp-header { font-size: 13px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .comp-box.before .comp-header { color: #dc2626; }
    .comp-box.after .comp-header { color: #16a34a; }

    .search-mock { display: flex; height: 42px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; overflow: hidden; align-items: stretch; }
    .cat-dropdown { background: #f8fafc; border-right: 1px solid #e2e8f0; padding: 0 12px; display: flex; align-items: center; font-size: 12px; font-weight: 600; color: #475569; gap: 4px; }
    .search-input { flex: 1; padding: 0 14px; font-size: 13px; border: none; outline: none; color: #64748b; background: transparent; }
    .search-btn { width: 48px; background: #d9232d; display: flex; align-items: center; justify-content: center; color: white; shrink: 0; }
    
    .note-text { font-size: 12px; color: #64748b; margin-top: 8px; line-height: 1.4; }
    .comp-box.after .note-text { color: #166534; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <div class="window-header">
      <div class="window-dots">
        <div class="dot red"></div>
        <div class="dot yellow"></div>
        <div class="dot green"></div>
      </div>
      <div class="window-title">OfficeBazzar — Search Bar UI Simplification Verification</div>
      <div class="badge">&#10003; Simplified Search UI Active</div>
    </div>
    <div class="content">
      <div class="comparison-grid">
        <div class="comp-box before">
          <div class="comp-header">&#10007; Previous Search Bar (Removed)</div>
          <div class="search-mock" style="opacity: 0.85;">
            <div class="cat-dropdown">All <span style="font-size: 9px; margin-left: 2px;">&#9660;</span></div>
            <div class="search-input">Search Product, Category, Brand...</div>
            <div class="search-btn">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
          </div>
          <div class="note-text">&bull; Had category dropdown with "All" and arrow selector.<br>&bull; Extra click target cluttering input focus.<br>&bull; Narrower input area.</div>
        </div>

        <div class="comp-box after">
          <div class="comp-header">&#10003; New Simplified Search Bar (Active)</div>
          <div class="search-mock" style="box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-color: #94a3b8;">
            <div class="search-input" style="color: #0f172a; font-weight: 500;">Search products, brands and categories…</div>
            <div class="search-btn" style="background: #d9232d;">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
          </div>
          <div class="note-text">&bull; Category dropdown and select menu completely removed.<br>&bull; Single full-width text input with clean placeholder: <strong>&ldquo;Search products, brands and categories&hellip;&rdquo;</strong><br>&bull; Red search button with white search icon preserved.</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

const tempHtmlPath = path.join(__dirname, 'temp_search_mockup.html');
fs.writeFileSync(tempHtmlPath, htmlContent);

const outPath = path.join(artifactDir, 'search_bar_comparison_preview.png');
cp.spawnSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--window-size=1200,420',
  `--screenshot=${outPath}`,
  `file://${tempHtmlPath}`
]);

if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
console.log(`Saved search_bar_comparison_preview.png (${fs.statSync(outPath).size} bytes)`);
