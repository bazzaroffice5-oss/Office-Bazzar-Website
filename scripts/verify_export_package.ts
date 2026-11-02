import * as fs from 'fs';
import * as path from 'path';

const pkgDir = path.join(process.cwd(), 'scripts', 'officebazzar-complete-image-audit');

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const full = path.join(dirPath, file);
    if (fs.statSync(full).isDirectory()) {
      arrayOfFiles = getAllFiles(full, arrayOfFiles);
    } else {
      arrayOfFiles.push(full);
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(pkgDir);
console.log('Total files in export package:', allFiles.length);

const imageFiles = allFiles.filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f));
console.log('Total image files in package:', imageFiles.length);

const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
console.log('Total HTML files in package:', htmlFiles.length);
htmlFiles.forEach(f => console.log(' - HTML:', path.relative(pkgDir, f)));

const csvFiles = allFiles.filter(f => f.endsWith('.csv') || f.endsWith('.txt'));
console.log('Total text/csv reports:', csvFiles.length);
csvFiles.forEach(f => console.log(' - Report:', path.relative(pkgDir, f)));

// Check CSV row count
const csvLines = fs.readFileSync(path.join(pkgDir, 'SKU-to-image-mapping.csv'), 'utf8').trim().split('\n');
console.log('SKU-to-image-mapping.csv total rows (incl header):', csvLines.length);

// Check Missing-images-report.csv
const missingLines = fs.readFileSync(path.join(pkgDir, 'Missing-images-report.csv'), 'utf8').trim().split('\n');
console.log('Missing-images-report.csv total rows (incl header):', missingLines.length);

