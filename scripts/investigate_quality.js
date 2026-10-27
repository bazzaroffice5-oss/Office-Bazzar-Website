const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const BANNERS = [
  {
    id: 'jk-copier',
    name: 'hero-banner-jk-copier.png',
    title: 'JK Copier (Blue)',
    cropHeadline: { left: 30, top: 90, width: 380, height: 110 },
    cropBody: { left: 30, top: 210, width: 380, height: 60 },
    cropProduct: { left: 400, top: 170, width: 280, height: 280 },
    cropBadges: { left: 30, top: 290, width: 280, height: 80 },
    cropRightPanel: { left: 630, top: 40, width: 140, height: 260 } // normalized to 1536 width
  },
  {
    id: 'stationery',
    name: 'hero-banner-stationery.png',
    title: 'Stationery (Green)',
    cropHeadline: { left: 30, top: 90, width: 440, height: 110 },
    cropBody: { left: 30, top: 210, width: 380, height: 60 },
    cropProduct: { left: 750, top: 60, width: 380, height: 400 },
    cropBadges: { left: 30, top: 290, width: 340, height: 80 },
    cropRightPanel: { left: 1400, top: 40, width: 130, height: 280 }
  },
  {
    id: 'housekeeping',
    name: 'hero-banner-housekeeping.png',
    title: 'Housekeeping (Orange)',
    cropHeadline: { left: 30, top: 90, width: 380, height: 110 },
    cropBody: { left: 30, top: 210, width: 380, height: 60 },
    cropProduct: { left: 350, top: 80, width: 420, height: 400 },
    cropBadges: { left: 30, top: 290, width: 340, height: 80 },
    cropRightPanel: { left: 650, top: 40, width: 140, height: 260 }
  },
  {
    id: 'toners',
    name: 'hero-banner-toners.png',
    title: 'Toners & Ink (Purple)',
    cropHeadline: { left: 30, top: 90, width: 380, height: 110 },
    cropBody: { left: 30, top: 210, width: 380, height: 60 },
    cropProduct: { left: 700, top: 120, width: 450, height: 350 },
    cropBadges: { left: 30, top: 290, width: 340, height: 80 },
    cropRightPanel: { left: 1400, top: 40, width: 130, height: 280 }
  }
];

async function inspectAssets() {
  console.log('=== 1. SOURCE ASSET RAW METRICS ===');
  for (const b of BANNERS) {
    const filePath = path.join(__dirname, '..', 'public', 'images', 'banners', b.name);
    const meta = await sharp(filePath).metadata();
    const stats = await sharp(filePath).stats();
    console.log(`${b.name}: ${meta.width}x${meta.height}, format=${meta.format}, channels=${meta.channels}, depth=${meta.depth}, density=${meta.density || 72} dpi`);
  }
}

inspectAssets().catch(console.error);
