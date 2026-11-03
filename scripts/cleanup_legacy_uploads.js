const fs = require('fs');
const path = require('path');

const backupDir = 'D:\\legacy_products_backup_2026\\uploads_backup';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function moveDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const st = fs.statSync(srcPath);
    if (st.isDirectory()) {
      moveDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      fs.unlinkSync(srcPath);
    }
  }
  fs.rmdirSync(src);
}

const pdfExtracted = path.join(process.cwd(), 'public', 'uploads', 'pdf_extracted');
const uploadsProducts = path.join(process.cwd(), 'public', 'uploads', 'products');

let removedCount = 0;
if (fs.existsSync(pdfExtracted)) {
  const c = fs.readdirSync(pdfExtracted).length;
  moveDir(pdfExtracted, path.join(backupDir, 'pdf_extracted'));
  removedCount += c;
  console.log(`Moved ${c} files from pdf_extracted to backup`);
}
if (fs.existsSync(uploadsProducts)) {
  const c = fs.readdirSync(uploadsProducts).length;
  moveDir(uploadsProducts, path.join(backupDir, 'products'));
  removedCount += c;
  console.log(`Moved ${c} files from uploads/products to backup`);
}

console.log(`Total legacy upload files removed: ${removedCount}`);
