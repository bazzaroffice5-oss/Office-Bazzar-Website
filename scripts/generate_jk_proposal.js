const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const artifactDir = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d1ae96ca-c224-47e6-83e3-7ef8a75670b4';
const bannerOrigPath = path.join(__dirname, '..', 'public', 'images', 'banners', 'hero-banner-jk-copier.png');

async function buildCleanProposal() {
  console.log('Generating pixel-perfect vector-sharpened JK Copier proposal...');

  // 1. Upscale original photographic scene to 3072 x 1010 using Lanczos3
  const orig3072 = await sharp(bannerOrigPath)
    .resize(3072, 1010, { kernel: 'lanczos3' })
    .toBuffer();

  // 2. High-precision clean mask:
  // In 3072 space:
  // Left text spans x: 120 to 1260. The paper stack starts at x: 1280.
  // The background from x: 0 to 1270 is pure white (#ffffff).
  // Right wing text spans x: 2640 to 2980, y: 110 to 650.
  const cleanMaskSvg = Buffer.from(`
    <svg width="3072" height="1010" viewBox="0 0 3072 1010" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rightWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#014dae"/>
          <stop offset="50%" stop-color="#0062cc"/>
          <stop offset="100%" stop-color="#0072e2"/>
        </linearGradient>
      </defs>

      <!-- Clean solid white polygon covering 100% of the blurry text without touching the paper stack -->
      <!-- Paper stack is at x=1280..1640, y=630..900 -->
      <polygon points="0,0 1260,0 1250,550 1150,1010 0,1010" fill="#ffffff"/>

      <!-- Clean solid blue polygon covering the right wing text -->
      <!-- Original wing begins around x=2650 at top, angling to x=2608 at bottom -->
      <polygon points="2648,0 3072,0 3072,1010 2605,1010" fill="url(#rightWingGrad)"/>
      <!-- Inner facet polygon matching original artwork -->
      <polygon points="2648,0 2740,0 2690,1010 2605,1010" fill="#0275eb" opacity="0.32"/>
    </svg>
  `);

  const cleanBase = await sharp(orig3072)
    .composite([{ input: cleanMaskSvg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  // 3. Pixel-Aligned Vector Overlay at 3072 x 1010
  const vectorTypographySvg = Buffer.from(`
    <svg width="3072" height="1010" viewBox="0 0 3072 1010" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0052b4"/>
          <stop offset="100%" stop-color="#0066cc"/>
        </linearGradient>
      </defs>

      <!-- 1. CATEGORY / BRAND TAG -->
      <text x="124" y="132" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="34" letter-spacing="1.2">
        <tspan fill="#e11d48">OFFICEBAZZAR</tspan>
        <tspan fill="#94a3b8" font-weight="400">  |  </tspan>
        <tspan fill="#0f172a">JK COPIER</tspan>
      </text>

      <!-- 2. HEADLINE (Matching original font sizes and line breaks) -->
      <text x="126" y="278" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="88" fill="#0b2447" letter-spacing="-2">
        Premium Copier Paper
      </text>
      <text x="122" y="388" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="88" fill="#0066cc" letter-spacing="-2">
        for Every Business
      </text>

      <!-- 3. SUBTITLE PARAGRAPH -->
      <text x="126" y="474" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="500" font-size="31" fill="#475569" letter-spacing="-0.3">
        Direct OEM mill procurement on JK Cedar, Sparkle &amp; Copier Plus
      </text>
      <text x="126" y="524" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="500" font-size="31" fill="#475569" letter-spacing="-0.3">
        75/80 GSM reams for enterprise print rooms.
      </text>

      <!-- 4. THREE BENEFIT BADGES -->
      <!-- Badge 1: 100% Genuine Reams -->
      <g transform="translate(122, 635)">
        <path d="M22 6 L44 14 V26 C44 40 33 50 22 54 C11 50 0 40 0 26 V14 Z M13 26 L19 32 L31 20" fill="none" stroke="#0066cc" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="60" y="24" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#0f172a">100%</text>
        <text x="60" y="48" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="600" font-size="20" fill="#475569">Genuine Reams</text>
      </g>

      <!-- Badge 2: 18% GST Input Invoice -->
      <g transform="translate(490, 635)">
        <path d="M4 4 H36 V48 H4 Z M10 14 H30 M10 24 H30 M10 34 H22" fill="none" stroke="#0066cc" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="52" y="24" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#0f172a">18% GST</text>
        <text x="52" y="48" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="600" font-size="20" fill="#475569">Input Invoice</text>
      </g>

      <!-- Badge 3: Bulk Pallet Loads -->
      <g transform="translate(860, 635)">
        <path d="M4 14 H44 M4 28 H44 M4 42 H44 M14 4 V48 M28 4 V48" fill="none" stroke="#0066cc" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="60" y="24" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#0f172a">Bulk</text>
        <text x="60" y="48" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="600" font-size="20" fill="#475569">Pallet Loads</text>
      </g>

      <!-- 5. CTA BUTTON -->
      <g transform="translate(126, 765)">
        <rect width="572" height="120" rx="16" fill="url(#btnGrad)"/>
        <text x="65" y="75" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="34" fill="#ffffff" letter-spacing="1">
          SHOP COPIER PAPER
        </text>
        <path d="M470 60 H515 M500 45 L515 60 L500 75" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- 6. RIGHT WING CREDENTIALS -->
      <!-- Item 1: DIRECT OEM SUPPLY -->
      <g transform="translate(2665, 120)">
        <path d="M12 48 V22 L24 30 L36 22 V48 M6 48 H42 M14 10 H34 V22 H14 Z" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="56" y="26" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="1">DIRECT OEM</text>
        <text x="56" y="54" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="1">SUPPLY</text>
      </g>

      <!-- Item 2: FAST DISPATCH -->
      <g transform="translate(2665, 360)">
        <path d="M6 14 H32 V40 H6 Z M32 22 H42 L48 30 V40 H32 M14 46 A5 5 0 1 0 14 36 A5 5 0 1 0 14 46 M38 46 A5 5 0 1 0 38 36 A5 5 0 1 0 38 46" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="62" y="26" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="1">FAST</text>
        <text x="62" y="54" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="1">DISPATCH</text>
      </g>

      <!-- Item 3: IDEAL FOR BUSINESS -->
      <g transform="translate(2665, 600)">
        <path d="M10 48 V10 H28 V48 M28 20 H42 V48 M4 48 H48 M16 18 H22 M16 26 H22 M16 34 H22 M33 28 H37 M33 36 H37" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="62" y="26" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="1">IDEAL FOR</text>
        <text x="62" y="54" font-family="'Inter', 'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="1">BUSINESS</text>
      </g>
    </svg>
  `);

  const proposalComposite3072 = await sharp(cleanBase)
    .composite([{ input: vectorTypographySvg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  const proposal1536 = await sharp(proposalComposite3072)
    .resize(1536, 505, { kernel: 'lanczos3' })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(artifactDir, 'proposal_preview_jk_copier_1536px.png'), proposal1536);
  fs.writeFileSync(path.join(artifactDir, 'proposal_preview_jk_copier_3072px.png'), proposalComposite3072);

  // Generate comparison
  const orig1536 = await sharp(bannerOrigPath).toBuffer();

  const labelOrig = Buffer.from(`
    <svg width="1536" height="42">
      <rect width="1536" height="42" fill="#1e293b"/>
      <text x="20" y="27" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">
        [CURRENT] ORIGINAL SOURCE BANNER (1536x505 px) — Low-Density Flattened Raster
      </text>
    </svg>
  `);

  const labelProp = Buffer.from(`
    <svg width="1536" height="42">
      <rect width="1536" height="42" fill="#059669"/>
      <text x="20" y="27" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">
        [PROPOSED] VECTOR-SHARPENED BANNER — 100% Vector Typography &amp; Icons + Preserved Original Photo Scene
      </text>
    </svg>
  `);

  await sharp({
    create: {
      width: 1536,
      height: 42 + 505 + 16 + 42 + 505 + 16,
      channels: 4,
      background: { r: 241, g: 245, b: 249, alpha: 1 }
    }
  })
  .composite([
    { input: labelOrig, top: 8, left: 0 },
    { input: orig1536, top: 50, left: 0 },
    { input: labelProp, top: 571, left: 0 },
    { input: proposal1536, top: 613, left: 0 }
  ])
  .png()
  .toFile(path.join(artifactDir, 'final_proposal_comparison_jk_copier.png'));

  console.log('Saved final_proposal_comparison_jk_copier.png');
}

buildCleanProposal().catch(console.error);
