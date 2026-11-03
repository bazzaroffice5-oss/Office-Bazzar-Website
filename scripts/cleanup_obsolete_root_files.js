const fs = require('fs');
const path = require('path');

const backupDir = 'D:\\legacy_products_backup_2026\\obsolete_root_files';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const obsoleteFiles = [
  'test_shot.png',
  'duplicate_image_report.csv',
  'final_product_image_audit.csv',
  'missing_product_images.csv',
  'old_vs_new_image_mapping.csv',
  'unused_legacy_assets_report.csv'
];

let removed = 0;
for (const file of obsoleteFiles) {
  const p = path.join(process.cwd(), file);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(backupDir, file));
    fs.unlinkSync(p);
    removed++;
    console.log(`Backed up and removed obsolete file: ${file}`);
  }
}

console.log(`Total obsolete root files cleaned up: ${removed}`);
