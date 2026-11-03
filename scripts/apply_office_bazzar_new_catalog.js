const fs = require('fs');
const path = require('path');

const catalogPath = path.join(process.cwd(), 'src', 'lib', 'data', 'catalog.ts');
let catalogContent = fs.readFileSync(catalogPath, 'utf8');

const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));
const manifestMap = new Map();
for (const m of manifest) {
  manifestMap.set(m.sku, m.allImages);
}

// Regex to replace images: [...] for each product
const productBlockRegex = /(\{\s*\"id\":\s*\"[^\"]+\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"images\":\s*\[)([\s\S]*?)(\])/g;

let updatedCount = 0;
let matchedProducts = 0;
let placeholderProducts = 0;

const newCatalogContent = catalogContent.replace(productBlockRegex, (match, prefix, sku, oldImagesRaw, suffix) => {
  updatedCount++;
  const matchedImages = manifestMap.get(sku);
  if (matchedImages && matchedImages.length > 0) {
    matchedProducts++;
    const formatted = '\n      ' + matchedImages.map(img => `"${img}"`).join(',\n      ') + '\n    ';
    return `${prefix}${formatted}${suffix}`;
  } else {
    placeholderProducts++;
    return `${prefix}${suffix}`;
  }
});

console.log(`Updated catalog products: ${updatedCount}`);
console.log(`Matched with Office Bazzar New Images: ${matchedProducts}`);
console.log(`Empty images for fallback placeholder: ${placeholderProducts}`);

fs.writeFileSync(catalogPath, newCatalogContent, 'utf8');
console.log('Successfully updated src/lib/data/catalog.ts!');

