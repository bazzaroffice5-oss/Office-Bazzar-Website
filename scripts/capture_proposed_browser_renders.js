const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d1ae96ca-c224-47e6-83e3-7ef8a75670b4';

async function captureBrowserRenders() {
  console.log('Capturing proposed JK Copier slide in browser at 1440px and 390px...');

  const desktopOut = path.join(artifactDir, 'proposed_browser_render_1440px.png');
  const mobileOut = path.join(artifactDir, 'proposed_browser_render_mobile_390px.png');

  // 1. Desktop 1440px capture
  const cmdDesktop = `"${chromePath}" --headless=new --screenshot="${desktopOut}" --window-size=1440,1100 --virtual-time-budget=3000 "http://localhost:3000/preview"`;
  execSync(cmdDesktop);
  console.log('Captured 1440px desktop view');

  // 2. Mobile 390px capture
  const cmdMobile = `"${chromePath}" --headless=new --screenshot="${mobileOut}" --window-size=390,900 --virtual-time-budget=3000 "http://localhost:3000/preview"`;
  execSync(cmdMobile);
  console.log('Captured 390px mobile view');

  // 3. Extract the proposed carousel container specifically from the desktop capture
  // The carousel starts after the header section
  const desktopImg = sharp(desktopOut);
  const desktopMeta = await desktopImg.metadata();

  // In 1440px view, container width is ~1376px, centered with 32px padding on each side
  // Let's crop the proposed carousel banner cleanly:
  // We can locate the proposed banner (starts around y = 140, height = ~450)
  const proposedCarouselDesktopCrop = await sharp(desktopOut)
    .extract({ left: 32, top: 145, width: 1376, height: 456 })
    .png()
    .toFile(path.join(artifactDir, 'proposed_slide_element_1440px.png'));
  console.log('Extracted proposed_slide_element_1440px.png');

  // 4. Extract the proposed carousel container from mobile view
  // In 390px view, padding is 16px on each side -> width = 358px, height = ~118px
  const proposedCarouselMobileCrop = await sharp(mobileOut)
    .extract({ left: 16, top: 195, width: 358, height: 120 })
    .png()
    .toFile(path.join(artifactDir, 'proposed_slide_element_mobile.png'));
  console.log('Extracted proposed_slide_element_mobile.png');

  console.log('All browser captures completed successfully!');
}

captureBrowserRenders().catch(console.error);
