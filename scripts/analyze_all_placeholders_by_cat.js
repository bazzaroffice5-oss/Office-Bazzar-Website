const fs = require('fs');
const path = require('path');

const placeholders = JSON.parse(fs.readFileSync('scripts/placeholder_products_audit.json', 'utf8'));
const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');

function getFiles(sub) {
  const dir = path.join(SOURCE_DIR, sub);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
}

console.log('--- Placeholders in Housekeeping & Hygiene ---');
const hkPlaceholders = placeholders.filter(p => p.categoryId === 'housekeeping-hygiene');
hkPlaceholders.forEach(p => console.log(`[${p.sku}] ${p.name} (${p.subcategoryId})`));

console.log('\n--- Placeholders in Packaging Supplies ---');
const pkgPlaceholders = placeholders.filter(p => p.categoryId === 'packaging-supplies');
pkgPlaceholders.forEach(p => console.log(`[${p.sku}] ${p.name} (${p.subcategoryId})`));

console.log('\n--- Placeholders in Printers & Technology ---');
const prtPlaceholders = placeholders.filter(p => p.categoryId === 'printers-technology');
prtPlaceholders.forEach(p => console.log(`[${p.sku}] ${p.name} (${p.subcategoryId})`));

console.log('\n--- Placeholders in Office Stationery ---');
const staPlaceholders = placeholders.filter(p => p.categoryId === 'office-stationery');
console.log(`Total Stationery placeholders: ${staPlaceholders.length}`);
staPlaceholders.forEach(p => console.log(`[${p.sku}] ${p.name} (${p.subcategoryId})`));

