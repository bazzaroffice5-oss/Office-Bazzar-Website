const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));
const manifestMap = new Map();
for (const m of manifest) {
  manifestMap.set(m.sku, m);
}

const rawCatalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const regex = /\{\s*\"id\":\s*\"([^\"]+)\"[\s\S]*?\"name\":\s*\"([^\"]+)\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"categoryId\":\s*\"([^\"]+)\"[\s\S]*?\"brandName\":\s*\"([^\"]+)\"[\s\S]*?\"images\":\s*\[([\s\S]*?)\]/g;

const catalogProducts = [];
let match;
while ((match = regex.exec(rawCatalogContent)) !== null) {
  const imgs = match[6].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  catalogProducts.push({
    id: match[1],
    name: match[2],
    sku: match[3],
    categoryId: match[4],
    brand: match[5],
    images: imgs
  });
}

const totalProducts = catalogProducts.length;
const mappedCount = manifest.length;
const galleryImagesCount = manifest.reduce((acc, m) => acc + m.altSources.length, 0);
const placeholderCount = totalProducts - mappedCount;

const cardsHtml = catalogProducts.map(p => {
  const m = manifestMap.get(p.sku);
  const isMapped = !!m;
  const primaryImg = isMapped ? m.primaryRelative : '/assets/placeholder-product.svg';
  const alts = isMapped ? m.altRelatives : [];
  const statusBadge = isMapped
    ? '<span class="badge badge-success">✓ Office Bazzar New Images</span>'
    : '<span class="badge badge-placeholder">⏳ Pending Studio Photo</span>';
  
  const galleryThumbnails = alts.map((alt, idx) => `
    <div class="gallery-thumb" title="Angle ${idx + 2}">
      <img src="${alt}" alt="${p.name} Angle ${idx + 2}" loading="lazy" />
    </div>
  `).join('');

  return `
    <div class="product-card ${isMapped ? 'status-mapped' : 'status-placeholder'}" data-category="${p.categoryId}" data-sku="${p.sku.toLowerCase()}" data-name="${p.name.toLowerCase()}">
      <div class="image-wrapper">
        <img src="${primaryImg}" alt="${p.name}" loading="lazy" />
        ${alts.length > 0 ? `<div class="angle-count-pill">${alts.length + 1} Angles</div>` : ''}
      </div>
      ${alts.length > 0 ? `<div class="gallery-row">${galleryThumbnails}</div>` : ''}
      <div class="card-details">
        <div class="sku-tag">${p.sku}</div>
        <h3 class="product-name" title="${p.name}">${p.name}</h3>
        <div class="meta-row">
          <span class="category-name">${p.categoryId}</span>
          <span class="brand-name">${p.brand || 'OfficeBazzar'}</span>
        </div>
        <div class="status-row">
          ${statusBadge}
        </div>
        ${isMapped ? `<div class="source-ref" title="${m.primarySource}">${m.primarySource}</div>` : ''}
      </div>
    </div>
  `;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OfficeBazzar – Office Bazzar New Images Quality Gate (2,369 Archive)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --success: #10b981;
      --purple: #8b5cf6;
      --accent: #f59e0b;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 32px 24px;
      line-height: 1.5;
    }
    .header {
      max-width: 1400px;
      margin: 0 auto 32px;
    }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .badge-primary-source {
      background: #0284c7;
      color: white;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px 20px;
    }
    .stat-val {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
      align-items: center;
      max-width: 1400px;
      margin-left: auto;
      margin-right: auto;
    }
    .search-input {
      flex: 1;
      min-width: 260px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
    }
    .filter-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-btn:hover, .filter-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .product-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .product-card:hover {
      transform: translateY(-2px);
      border-color: #475569;
    }
    .image-wrapper {
      position: relative;
      aspect-ratio: 1 / 1;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .image-wrapper img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .angle-count-pill {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      color: #38bdf8;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .gallery-row {
      display: flex;
      gap: 6px;
      padding: 8px 12px;
      background: #0f172a;
      border-bottom: 1px solid var(--card-border);
      overflow-x: auto;
    }
    .gallery-thumb {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      background: #ffffff;
      padding: 2px;
      flex-shrink: 0;
      border: 1px solid #334155;
    }
    .gallery-thumb img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .card-details {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 8px;
    }
    .sku-tag {
      font-family: monospace;
      font-size: 12px;
      color: #38bdf8;
      font-weight: 600;
    }
    .product-name {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-muted);
    }
    .status-row {
      margin-top: auto;
      padding-top: 8px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .badge-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-placeholder {
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .source-ref {
      font-size: 10px;
      font-family: monospace;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-row">
      <div>
        <h1>OfficeBazzar – Visual Quality Gate</h1>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Exclusive Photography Source: <code>Office Bazzar New Images</code></p>
      </div>
      <div class="badge-primary-source">Source: Office Bazzar New Images Only</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val" style="color: #60a5fa;">${totalProducts}</div>
        <div class="stat-label">Total Catalog Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #34d399;">${mappedCount}</div>
        <div class="stat-label">Mapped from New Images</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #a78bfa;">${galleryImagesCount}</div>
        <div class="stat-label">Alternate Angle Images</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #94a3b8;">${placeholderCount}</div>
        <div class="stat-label">Pending Photo (Placeholder)</div>
      </div>
    </div>
  </div>

  <div class="controls">
    <input type="text" id="searchInput" class="search-input" placeholder="Search by SKU, product name, or category..." />
    <button class="filter-btn active" data-filter="all">All (${totalProducts})</button>
    <button class="filter-btn" data-filter="mapped">New Images Only (${mappedCount})</button>
    <button class="filter-btn" data-filter="placeholder">Pending Placeholder (${placeholderCount})</button>
  </div>

  <div class="grid" id="productGrid">
    ${cardsHtml}
  </div>

  <script>
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.product-card');

    let currentFilter = 'all';
    let currentSearch = '';

    function filterGrid() {
      cards.forEach(card => {
        const matchesFilter = currentFilter === 'all' ||
          (currentFilter === 'mapped' && card.classList.contains('status-mapped')) ||
          (currentFilter === 'placeholder' && card.classList.contains('status-placeholder'));

        const sku = card.getAttribute('data-sku') || '';
        const name = card.getAttribute('data-name') || '';
        const cat = card.getAttribute('data-category') || '';
        const text = sku + ' ' + name + ' ' + cat;
        const matchesSearch = !currentSearch || text.includes(currentSearch);

        card.style.display = matchesFilter && matchesSearch ? 'flex' : 'none';
      });
    }

    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      filterGrid();
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        filterGrid();
      });
    });
  </script>
</body>
</html>`;

fs.writeFileSync('public/migrated_product_contact_sheet.html', html, 'utf8');
console.log('Successfully regenerated public/migrated_product_contact_sheet.html!');
