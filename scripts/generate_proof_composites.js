const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const artifactDir = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d1ae96ca-c224-47e6-83e3-7ef8a75670b4';

const SLIDES = [
  {
    index: 0,
    id: 'jk-copier',
    name: 'JK Copier (Blue)',
    file: 'hero-banner-jk-copier.png',
    headlineCoords: { left: 30, top: 90, width: 420, height: 110 },
    bodyCoords: { left: 30, top: 210, width: 420, height: 50 },
    productCoords: { left: 410, top: 170, width: 300, height: 260 },
    badgeCoords: { left: 30, top: 290, width: 300, height: 80 }
  },
  {
    index: 1,
    id: 'stationery',
    name: 'Stationery (Green)',
    file: 'hero-banner-stationery.png',
    headlineCoords: { left: 30, top: 90, width: 440, height: 110 },
    bodyCoords: { left: 30, top: 210, width: 420, height: 50 },
    productCoords: { left: 740, top: 60, width: 400, height: 380 },
    badgeCoords: { left: 30, top: 290, width: 340, height: 80 }
  },
  {
    index: 2,
    id: 'housekeeping',
    name: 'Housekeeping (Orange)',
    file: 'hero-banner-housekeeping.png',
    headlineCoords: { left: 30, top: 90, width: 420, height: 110 },
    bodyCoords: { left: 30, top: 210, width: 420, height: 50 },
    productCoords: { left: 340, top: 80, width: 420, height: 380 },
    badgeCoords: { left: 30, top: 290, width: 340, height: 80 }
  },
  {
    index: 3,
    id: 'toners',
    name: 'Toners & Ink (Purple)',
    file: 'hero-banner-toners.png',
    headlineCoords: { left: 30, top: 90, width: 420, height: 110 },
    bodyCoords: { left: 30, top: 210, width: 420, height: 50 },
    productCoords: { left: 700, top: 120, width: 450, height: 340 },
    badgeCoords: { left: 30, top: 290, width: 340, height: 80 }
  }
];

async function createSideBySideProof() {
  console.log('Generating annotated side-by-side proof images...');

  for (const s of SLIDES) {
    const rawPath = path.join(__dirname, '..', 'public', 'images', 'banners', s.file);
    const capPath = path.join(artifactDir, `audit_1440_dpr1_slide${s.index}_${s.id}.png`);

    const rawMeta = await sharp(rawPath).metadata();
    const capMeta = await sharp(capPath).metadata();

    // 1. Full-width stacked comparison with clear labels
    // Label header height: 40px
    const safeRawFile = s.file.replace(/&/g, '&amp;');
    const safeSlideName = s.name.replace(/&/g, '&amp;');

    const labelRawSvg = Buffer.from(`
      <svg width="1536" height="40">
        <rect width="1536" height="40" fill="#1e293b"/>
        <text x="20" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">
          ORIGINAL SOURCE ASSET (100% UNBIASED PIXELS) — ${safeRawFile} [${rawMeta.width}x${rawMeta.height} px]
        </text>
      </svg>
    `);

    const labelBrowserSvg = Buffer.from(`
      <svg width="1536" height="40">
        <rect width="1536" height="40" fill="#0369a1"/>
        <text x="20" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">
          BROWSER RENDERED CAROUSEL SLIDE (1440px VIEWPORT) — ${safeSlideName} [Delivered: ${capMeta.width}x${capMeta.height} px]
        </text>
      </svg>
    `);

    const rawBuffer = await sharp(rawPath).resize(1536, 505).png().toBuffer();
    const capBuffer = await sharp(capPath).resize(1536, 505).png().toBuffer();

    const fullComparisonPath = path.join(artifactDir, `proof_full_comparison_slide${s.index}_${s.id}.png`);
    await sharp({
      create: {
        width: 1536,
        height: 40 + 505 + 20 + 40 + 505 + 20,
        channels: 4,
        background: { r: 241, g: 245, b: 249, alpha: 1 }
      }
    })
    .composite([
      { input: labelRawSvg, top: 10, left: 0 },
      { input: rawBuffer, top: 50, left: 0 },
      { input: labelBrowserSvg, top: 575, left: 0 },
      { input: capBuffer, top: 615, left: 0 }
    ])
    .png()
    .toFile(fullComparisonPath);

    console.log(`Saved full comparison: proof_full_comparison_slide${s.index}_${s.id}.png`);

    // 2. High-magnification 200% detail crops for Slide 0
    if (s.index === 0) {
      // Crop headline
      const rawHeadline = await sharp(rawPath)
        .extract(s.headlineCoords)
        .resize(s.headlineCoords.width * 2, s.headlineCoords.height * 2, { kernel: 'nearest' })
        .png()
        .toBuffer();

      const capHeadline = await sharp(capPath)
        .extract({
          left: Math.round(s.headlineCoords.left * (capMeta.width / 1536)),
          top: Math.round(s.headlineCoords.top * (capMeta.height / 505)),
          width: Math.round(s.headlineCoords.width * (capMeta.width / 1536)),
          height: Math.round(s.headlineCoords.height * (capMeta.height / 505))
        })
        .resize(s.headlineCoords.width * 2, s.headlineCoords.height * 2, { kernel: 'nearest' })
        .png()
        .toBuffer();

      const headlineProofSvg = Buffer.from(`
        <svg width="860" height="40">
          <rect width="420" height="40" fill="#1e293b"/>
          <text x="15" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">
            SOURCE FILE AT 200% ZOOM
          </text>
          <rect x="440" width="420" height="40" fill="#0369a1"/>
          <text x="455" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">
            BROWSER SLIDE AT 200% ZOOM
          </text>
        </svg>
      `);

      await sharp({
        create: {
          width: 860,
          height: 40 + s.headlineCoords.height * 2 + 20,
          channels: 4,
          background: { r: 241, g: 245, b: 249, alpha: 1 }
        }
      })
      .composite([
        { input: headlineProofSvg, top: 10, left: 0 },
        { input: rawHeadline, top: 50, left: 10 },
        { input: capHeadline, top: 50, left: 440 }
      ])
      .png()
      .toFile(path.join(artifactDir, 'proof_crop_200pct_headline.png'));

      console.log('Saved 200% headline comparison: proof_crop_200pct_headline.png');

      // Crop body text
      const rawBody = await sharp(rawPath)
        .extract(s.bodyCoords)
        .resize(s.bodyCoords.width * 2, s.bodyCoords.height * 2, { kernel: 'nearest' })
        .png()
        .toBuffer();

      const capBody = await sharp(capPath)
        .extract({
          left: Math.round(s.bodyCoords.left * (capMeta.width / 1536)),
          top: Math.round(s.bodyCoords.top * (capMeta.height / 505)),
          width: Math.round(s.bodyCoords.width * (capMeta.width / 1536)),
          height: Math.round(s.bodyCoords.height * (capMeta.height / 505))
        })
        .resize(s.bodyCoords.width * 2, s.bodyCoords.height * 2, { kernel: 'nearest' })
        .png()
        .toBuffer();

      const bodyProofSvg = Buffer.from(`
        <svg width="860" height="40">
          <rect width="420" height="40" fill="#1e293b"/>
          <text x="15" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">
            SOURCE SUBTITLE AT 200% ZOOM (8px FONT)
          </text>
          <rect x="440" width="420" height="40" fill="#0369a1"/>
          <text x="455" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">
            BROWSER SUBTITLE AT 200% ZOOM
          </text>
        </svg>
      `);

      await sharp({
        create: {
          width: 860,
          height: 40 + s.bodyCoords.height * 2 + 20,
          channels: 4,
          background: { r: 241, g: 245, b: 249, alpha: 1 }
        }
      })
      .composite([
        { input: bodyProofSvg, top: 10, left: 0 },
        { input: rawBody, top: 50, left: 10 },
        { input: capBody, top: 50, left: 440 }
      ])
      .png()
      .toFile(path.join(artifactDir, 'proof_crop_200pct_body.png'));

      console.log('Saved 200% body comparison: proof_crop_200pct_body.png');

      // Crop product packaging
      const rawProd = await sharp(rawPath)
        .extract(s.productCoords)
        .resize(s.productCoords.width * 2, s.productCoords.height * 2, { kernel: 'nearest' })
        .png()
        .toBuffer();

      const capProd = await sharp(capPath)
        .extract({
          left: Math.round(s.productCoords.left * (capMeta.width / 1536)),
          top: Math.round(s.productCoords.top * (capMeta.height / 505)),
          width: Math.round(s.productCoords.width * (capMeta.width / 1536)),
          height: Math.round(s.productCoords.height * (capMeta.height / 505))
        })
        .resize(s.productCoords.width * 2, s.productCoords.height * 2, { kernel: 'nearest' })
        .png()
        .toBuffer();

      const prodProofSvg = Buffer.from(`
        <svg width="620" height="40">
          <rect width="300" height="40" fill="#1e293b"/>
          <text x="15" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">
            SOURCE PRODUCT AT 200% ZOOM
          </text>
          <rect x="320" width="300" height="40" fill="#0369a1"/>
          <text x="335" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">
            BROWSER PRODUCT AT 200% ZOOM
          </text>
        </svg>
      `);

      await sharp({
        create: {
          width: 620,
          height: 40 + s.productCoords.height * 2 + 20,
          channels: 4,
          background: { r: 241, g: 245, b: 249, alpha: 1 }
        }
      })
      .composite([
        { input: prodProofSvg, top: 10, left: 0 },
        { input: rawProd, top: 50, left: 10 },
        { input: capProd, top: 50, left: 320 }
      ])
      .png()
      .toFile(path.join(artifactDir, 'proof_crop_200pct_product.png'));

      console.log('Saved 200% product comparison: proof_crop_200pct_product.png');
    }
  }

  console.log('All proof composites generated successfully!');
}

createSideBySideProof().catch(console.error);
