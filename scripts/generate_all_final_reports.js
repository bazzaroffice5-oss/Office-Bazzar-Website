const fs = require('fs');
const path = require('path');

console.log('--- GENERATING FINAL AUDIT AND VERIFICATION REPORTS ---');

// 1. Read catalog.ts
const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = content.match(/const RAW_PRODUCTS: any\[\] = (\[[\s\S]*?\n\];)/);
const products = eval(match[1]);

// 2. Scan public/assets/product
const physicalFiles = [];
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else physicalFiles.push(full.replace(/\\/g, '/').replace(/^public/, ''));
  });
}
walk('public/assets/product');

// 3. Compile Master Final Image Mapping JSON & CSV
const finalMappingRows = [];
const brokenImages = [];
const imageUsageMap = new Map(); // path -> Array<{ sku, name }>

products.forEach(p => {
  const imgs = p.images || [];
  imgs.forEach((img, idx) => {
    const pOnDisk = path.join(process.cwd(), 'public', img.replace(/^\//, ''));
    const exists = fs.existsSync(pOnDisk);

    if (!exists) {
      brokenImages.push({ sku: p.sku, name: p.name, imagePath: img });
    }

    if (!imageUsageMap.has(img)) imageUsageMap.set(img, []);
    imageUsageMap.get(img).push({ sku: p.sku, name: p.name });

    finalMappingRows.push({
      sku: p.sku,
      productName: p.name,
      category: p.categoryName,
      subcategory: p.subcategoryName || 'N/A',
      imagePath: img,
      isPrimary: idx === 0,
      role: idx === 0 ? 'MAPPED_PRIMARY' : 'MAPPED_GALLERY',
      fileStatus: exists ? 'EXISTS_ON_DISK' : 'MISSING'
    });
  });
});

fs.writeFileSync('scripts/final_image_mapping.json', JSON.stringify(finalMappingRows, null, 2), 'utf8');
const mapCsvHeader = 'SKU,Product Name,Category,Subcategory,Image Path,Is Primary,Role,File Status\n';
const mapCsvBody = finalMappingRows.map(r => `"${r.sku}","${r.productName.replace(/"/g, '""')}","${r.category}","${r.subcategory}","${r.imagePath}","${r.isPrimary}","${r.role}","${r.fileStatus}"`).join('\n');
fs.writeFileSync('scripts/final_image_mapping.csv', mapCsvHeader + mapCsvBody, 'utf8');
console.log(`Generated final_image_mapping.json and .csv (${finalMappingRows.length} mappings).`);

// 4. Duplicate Images Report
const duplicateImages = [];
imageUsageMap.forEach((users, img) => {
  if (users.length > 1) {
    duplicateImages.push({ imagePath: img, usageCount: users.length, usedBy: users });
  }
});
fs.writeFileSync('scripts/duplicate_images_report.json', JSON.stringify(duplicateImages, null, 2), 'utf8');
console.log(`Generated duplicate_images_report.json (${duplicateImages.length} duplicates detected).`);

// 5. Broken Images Report
fs.writeFileSync('scripts/broken_images_report.json', JSON.stringify(brokenImages, null, 2), 'utf8');
console.log(`Generated broken_images_report.json (${brokenImages.length} broken images detected).`);

// 6. Category-Wise Product Image Report
const categoryReport = {
  'Office Stationery': { totalProducts: 0, withImages: 0, withPlaceholders: 0, multiGallery: 0, totalImageAssignments: 0 },
  'Housekeeping & Hygiene': { totalProducts: 0, withImages: 0, withPlaceholders: 0, multiGallery: 0, totalImageAssignments: 0 },
  'Printers & Technology': { totalProducts: 0, withImages: 0, withPlaceholders: 0, multiGallery: 0, totalImageAssignments: 0 },
  'Packaging Supplies': { totalProducts: 0, withImages: 0, withPlaceholders: 0, multiGallery: 0, totalImageAssignments: 0 }
};

products.forEach(p => {
  const cat = p.categoryName || 'Housekeeping & Hygiene';
  if (!categoryReport[cat]) {
    categoryReport[cat] = { totalProducts: 0, withImages: 0, withPlaceholders: 0, multiGallery: 0, totalImageAssignments: 0 };
  }
  categoryReport[cat].totalProducts++;
  const imgs = p.images || [];
  if (imgs.length > 0) {
    categoryReport[cat].withImages++;
    if (imgs.length > 1) categoryReport[cat].multiGallery++;
  } else {
    categoryReport[cat].withPlaceholders++;
  }
  categoryReport[cat].totalImageAssignments += imgs.length;
});

fs.writeFileSync('scripts/category_wise_product_image_report.json', JSON.stringify(categoryReport, null, 2), 'utf8');
const catCsvHeader = 'Category,Total Products,With Images,With Placeholders,Multi-Image Galleries,Total Image Assignments\n';
const catCsvBody = Object.entries(categoryReport).map(([cat, d]) => `"${cat}",${d.totalProducts},${d.withImages},${d.withPlaceholders},${d.multiGallery},${d.totalImageAssignments}`).join('\n');
fs.writeFileSync('scripts/category_wise_product_image_report.csv', catCsvHeader + catCsvBody, 'utf8');
console.log('Generated category_wise_product_image_report.json and .csv');

console.log('--- ALL REPORT FILES GENERATED SUCCESSFULLY ---');
