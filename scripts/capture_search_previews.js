const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const artifactDir = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity-ide\\brain\\d0f5b27b-4af4-4dde-89ea-0f2afb2a936d';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function capture(url, width, height, outputFile, isMobile = false) {
  const outputPath = path.join(artifactDir, outputFile);
  const args = [
    '--headless=new',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    `--screenshot=${outputPath}`,
  ];
  if (isMobile) {
    args.push('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1');
    args.push('--hide-scrollbars');
  }
  args.push(url);
  console.log(`Capturing ${outputFile} (${width}x${height})...`);
  const res = cp.spawnSync(chromePath, args);
  if (res.status === 0 && fs.existsSync(outputPath)) {
    console.log(`Successfully saved ${outputFile} (${fs.statSync(outputPath).size} bytes)`);
  } else {
    console.error(`Failed to capture ${outputFile}:`, res.stderr ? res.stderr.toString() : 'unknown error');
  }
}

capture('http://localhost:3000', 1440, 800, 'search_bar_desktop_preview.png');
capture('http://localhost:3000', 820, 800, 'search_bar_tablet_preview.png');
capture('http://localhost:3000', 414, 800, 'search_bar_mobile_preview.png', true);
