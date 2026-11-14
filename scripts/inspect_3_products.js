const fs = require('fs');

const targetSlugs = [
  'epson-ecotank-l6160-wi-fi-duplex-multi-function-ink-tank-printer',
  'sandisk-pen-drive',
  'name-plate-plain-innofitt'
];

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

targetSlugs.forEach((slug, idx) => {
  const slugIndex = catalogContent.indexOf(`"slug": "${slug}"`);
  if (slugIndex !== -1) {
    const startObj = catalogContent.lastIndexOf('{', slugIndex);
    let braceCount = 0;
    let endObj = -1;
    for (let i = startObj; i < catalogContent.length; i++) {
      if (catalogContent[i] === '{') braceCount++;
      else if (catalogContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endObj = i + 1;
          break;
        }
      }
    }
    const productStr = catalogContent.substring(startObj, endObj);
    const prod = JSON.parse(productStr);
    console.log(`\n================== PRODUCT ${idx + 1} ==================`);
    console.log(`Title: ${prod.name}`);
    console.log(`SKU: ${prod.sku}`);
    console.log(`ID: ${prod.id}`);
    console.log(`Slug: ${prod.slug}`);
    console.log(`Primary Image: ${prod.images?.[0]}`);
    console.log(`All Images:`, prod.images);
  } else {
    console.log(`Slug not found: ${slug}`);
  }
});

