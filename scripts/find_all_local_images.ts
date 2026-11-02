import * as fs from 'fs';
import * as path from 'path';

function findImages(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.next')) {
        findImages(full, fileList);
      }
    } else if (/\.(jpg|jpeg|png|webp|svg)$/i.test(file)) {
      fileList.push(full.replace(/\\/g, '/'));
    }
  }
  return fileList;
}

const allImgs = findImages('public');
console.log(`Found ${allImgs.length} images in public/`);
const nonProductImgs = allImgs.filter(f => !f.includes('/public/assets/products/'));
console.log(`Non-product images (${nonProductImgs.length}):`);
nonProductImgs.forEach(f => console.log(' ', f));
