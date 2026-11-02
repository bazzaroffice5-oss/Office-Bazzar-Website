import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const zipPath = 'C:\\Users\\Pachamuthu S\\.gemini\\antigravity\\brain\\3b4e2bd9-29f4-43e6-8062-242f18749a52\\.user_uploaded\\media_1793623598764_b9059719.zip';
const dest = path.join(process.cwd(), 'temp_prepared_383');

if (!fs.existsSync(zipPath)) {
  console.error('ZIP file not found at:', zipPath);
  process.exit(1);
}

console.log('Found ZIP file, size:', fs.statSync(zipPath).size);
fs.mkdirSync(dest, { recursive: true });

console.log('Extracting to:', dest);
// Use powershell Expand-Archive with properly escaped string
execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${dest}' -Force"`, {
  stdio: 'inherit'
});

console.log('Extraction complete! Files in destination:');
const entries = fs.readdirSync(dest);
console.log(entries);
