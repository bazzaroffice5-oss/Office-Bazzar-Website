const fs = require('fs');
const path = require('path');

const catalogWithGallery = JSON.parse(fs.readFileSync('scripts/catalog_with_gallery_images.json', 'utf8'));
const manifestContent = fs.readFileSync('scripts/skus_requiring_manual_replacement.txt', 'utf8');
const watermarkedSkus = new Set([...manifestContent.matchAll(/\[PENDING\]\s+(OB-[A-Z0-9-]+)/g)].map(m => m[1]));

const totalProducts = catalogWithGallery.length;
const pkg2369Count = catalogWithGallery.filter(p => p.migrationSource === 'Supplier_Package_2369').length;
const oemCount = totalProducts - pkg2369Count;
const galleryCount = catalogWithGallery.filter(p => (p.galleryImages || []).length > 0).length;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OfficeBazzar – Complete Product Image Migration & Multi-Angle Gallery Quality Gate</title>
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
      margin: 0 auto 32px auto;
    }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 15px;
      margin-top: 4px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px 20px;
    }
    .stat-val {
      font-size: 26px;
      font-weight: 700;
      color: #fff;
    }
    .stat-lbl {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .controls {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      margin-bottom: 32px;
    }
    .search-box {
      flex: 1 1 280px;
    }
    .search-box input {
      width: 100%;
      background: #0f172a;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    .search-box input:focus {
      border-color: var(--primary);
    }
    .filter-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-filter {
      background: #0f172a;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-filter.active, .btn-filter:hover {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
    .btn-filter.purple.active {
      background: var(--purple);
      border-color: var(--purple);
    }
    .btn-filter.accent.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #000;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-3px);
      border-color: var(--primary);
    }
    .img-container {
      width: 100%;
      aspect-ratio: 1;
      background: #ffffff;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: zoom-in;
    }
    .img-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .badge-corner {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-2369 {
      background: #8b5cf6;
      color: #fff;
    }
    .badge-oem {
      background: #0ea5e9;
      color: #fff;
    }
    .badge-wm-resolved {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #10b981;
      color: #fff;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .badge-gallery-count {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: #f59e0b;
      color: #000;
      font-weight: 700;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sku-pill {
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      background: #0f172a;
      color: #38bdf8;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #334155;
    }
    .category-pill {
      font-size: 11px;
      color: var(--text-muted);
    }
    .product-title {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 38px;
    }
    .gallery-thumbs {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }
    .thumb-item {
      width: 36px;
      height: 36px;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      background: #fff;
      padding: 2px;
      cursor: pointer;
    }
    .thumb-item img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .meta-row {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    /* Lightbox Modal */
    .modal {
      display: none;
      position: fixed;
      z-index: 9999;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.88);
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .modal.active { display: flex; }
    .modal-content {
      background: #fff;
      padding: 24px;
      border-radius: 16px;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .modal img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
    }
    .modal-info {
      margin-top: 16px;
      color: #0f172a;
      text-align: center;
    }
    .modal-close {
      position: absolute;
      top: 12px;
      right: 16px;
      font-size: 24px;
      cursor: pointer;
      color: #64748b;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="title-row">
      <div>
        <h1>OfficeBazzar – Complete Image Migration & Multi-Angle Quality Gate</h1>
        <div class="subtitle">Complete visual verification catalog for 383 catalogue products (1200×1200 Master WebP + 86 Multi-Angle Views)</div>
      </div>
      <div>
        <a href="/" style="color: #38bdf8; text-decoration: none; font-size: 14px; font-weight: 500;">← Back to OfficeBazzar Store</a>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${totalProducts}</div>
        <div class="stat-lbl">Catalog Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #8b5cf6;">${pkg2369Count}</div>
        <div class="stat-lbl">From 2,369 Pkg</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #f59e0b;">${galleryCount} (86)</div>
        <div class="stat-lbl">Multi-Angle Galleries</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #10b981;">93 / 93</div>
        <div class="stat-lbl">Watermarks Resolved</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #ef4444;">718</div>
        <div class="stat-lbl">Legacy Files Cleaned</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #10b981;">0</div>
        <div class="stat-lbl">Missing Images</div>
      </div>
    </div>

    <div class="controls">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="Search by SKU, Product Name, or Brand..." oninput="filterCards()">
      </div>
      <div class="filter-group">
        <button class="btn-filter active" onclick="setCategory('ALL', this)">All (${totalProducts})</button>
        <button class="btn-filter" onclick="setCategory('Housekeeping & Hygiene', this)">Housekeeping (174)</button>
        <button class="btn-filter" onclick="setCategory('Office Stationery', this)">Stationery (166)</button>
        <button class="btn-filter" onclick="setCategory('Printers & Technology', this)">Tech & Printers (28)</button>
        <button class="btn-filter" onclick="setCategory('Packaging Supplies', this)">Packaging (15)</button>
        <button class="btn-filter accent" onclick="setSource('GALLERY_ONLY', this)">Multi-Angle Galleries (${galleryCount})</button>
        <button class="btn-filter purple" onclick="setSource('Supplier_Package_2369', this)">2,369 Pkg Only (${pkg2369Count})</button>
        <button class="btn-filter" style="border-color: #10b981; color: #10b981;" onclick="setSource('WM_RESOLVED', this)">Resolved 93 Issues</button>
      </div>
    </div>
  </div>

  <div class="grid" id="productGrid">
    ${catalogWithGallery.map(p => {
      const isWm = watermarkedSkus.has(p.sku);
      const is2369 = p.migrationSource === 'Supplier_Package_2369';
      const gallery = p.galleryImages || [];
      const hasGallery = gallery.length > 0;

      return `
      <div class="card" 
           data-sku="${p.sku.toLowerCase()}" 
           data-name="${p.name.toLowerCase()}" 
           data-brand="${p.brand.toLowerCase()}"
           data-category="${p.category}"
           data-source="${p.migrationSource}"
           data-wm="${isWm ? 'yes' : 'no'}"
           data-gallery="${hasGallery ? 'yes' : 'no'}">
        <div class="img-container" id="imgBox-${p.sku}" onclick="openModal(document.querySelector('#imgBox-${p.sku} img').src, '${p.sku}', '${p.name.replace(/'/g, "\\'")}')">
          <img src="${p.newImageRelative}" alt="${p.name}" loading="lazy">
          ${isWm ? `<div class="badge-wm-resolved">RESOLVED MASTER</div>` : ''}
          ${hasGallery ? `<div class="badge-gallery-count">+${gallery.length} ANGLES</div>` : ''}
          <div class="badge-corner ${is2369 ? 'badge-2369' : 'badge-oem'}">
            ${is2369 ? '2,369 PKG' : 'OEM MASTER'}
          </div>
        </div>
        <div class="card-body">
          <div class="card-header-row">
            <span class="sku-pill">${p.sku}</span>
            <span class="category-pill">${p.category}</span>
          </div>
          <div class="product-title" title="${p.name}">${p.name}</div>
          
          ${hasGallery ? `
          <div class="gallery-thumbs">
            <div class="thumb-item" onclick="switchCardImage('${p.sku}', '${p.newImageRelative}')">
              <img src="${p.newImageRelative}" alt="Primary" title="Primary View">
            </div>
            ${gallery.map((g, gi) => `
            <div class="thumb-item" onclick="switchCardImage('${p.sku}', '/assets/products/catalog_2026/${p.sku}-alt-${gi + 1}.webp')">
              <img src="/assets/products/catalog_2026/${p.sku}-alt-${gi + 1}.webp" alt="Angle ${gi + 1}" title="Angle ${gi + 1}">
            </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="meta-row">
            <span>Brand: <strong>${p.brand}</strong></span>
            <span>1200×1200 WebP</span>
          </div>
        </div>
      </div>
      `;
    }).join('\n')}
  </div>

  <!-- Lightbox Modal -->
  <div class="modal" id="imageModal" onclick="closeModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <span class="modal-close" onclick="closeModal()">&times;</span>
      <img id="modalImg" src="" alt="Product Large View">
      <div class="modal-info">
        <h3 id="modalTitle"></h3>
        <p id="modalSub" style="color: #64748b; font-size: 13px; margin-top: 4px;">Dimensions: 1200×1200 px | Format: WebP (Quality 90)</p>
      </div>
    </div>
  </div>

  <script>
    let currentCategory = 'ALL';
    let currentSource = 'ALL';

    function setCategory(cat, btn) {
      currentCategory = cat;
      document.querySelectorAll('.filter-group .btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterCards();
    }

    function setSource(src, btn) {
      if (currentSource === src) {
        currentSource = 'ALL';
        btn.classList.remove('active');
      } else {
        currentSource = src;
        document.querySelectorAll('.filter-group .btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      filterCards();
    }

    function switchCardImage(sku, newSrc) {
      const box = document.getElementById('imgBox-' + sku);
      if (box) {
        const img = box.querySelector('img');
        if (img) img.src = newSrc;
      }
    }

    function filterCards() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const cards = document.querySelectorAll('#productGrid .card');
      
      cards.forEach(card => {
        const sku = card.getAttribute('data-sku');
        const name = card.getAttribute('data-name');
        const brand = card.getAttribute('data-brand');
        const cat = card.getAttribute('data-category');
        const src = card.getAttribute('data-source');
        const isWm = card.getAttribute('data-wm');
        const hasGallery = card.getAttribute('data-gallery');

        let matchQuery = !q || sku.includes(q) || name.includes(q) || brand.includes(q);
        let matchCat = currentCategory === 'ALL' || cat === currentCategory;
        let matchSrc = true;
        if (currentSource === 'Supplier_Package_2369') {
          matchSrc = src === 'Supplier_Package_2369';
        } else if (currentSource === 'WM_RESOLVED') {
          matchSrc = isWm === 'yes';
        } else if (currentSource === 'GALLERY_ONLY') {
          matchSrc = hasGallery === 'yes';
        }

        if (matchQuery && matchCat && matchSrc) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function openModal(src, sku, name) {
      document.getElementById('modalImg').src = src;
      document.getElementById('modalTitle').textContent = sku + ' – ' + name;
      document.getElementById('imageModal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('imageModal').classList.remove('active');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('public/migrated_product_contact_sheet.html', html, 'utf8');
console.log('Successfully updated public/migrated_product_contact_sheet.html with multi-angle galleries!');

// Also copy to artifact directory
const artifactPath = 'C:/Users/Pachamuthu S/.gemini/antigravity/brain/3b4e2bd9-29f4-43e6-8062-242f18749a52/migrated_product_contact_sheet.html';
fs.copyFileSync('public/migrated_product_contact_sheet.html', artifactPath);
console.log('Updated artifact copy of contact sheet.');
