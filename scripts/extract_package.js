const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = 'D:/temp_2369_package';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const zipPath = 'C:/Users/Pachamuthu S/Downloads/wetransfer_product-photo-4-3-26_2026-11-03_0545.zip';
console.log(`Extracting ${zipPath} to ${targetDir}...`);
execSync(`tar -xf "${zipPath}" -C "${targetDir}"`, { stdio: 'inherit' });
console.log('Extraction complete!');

