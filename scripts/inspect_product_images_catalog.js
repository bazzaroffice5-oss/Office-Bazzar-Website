const fs = require('fs');
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const skus = [
  'OB-BOA-1046',
  'OB-BOA-1042',
  'OB-BOA-1043',
  'OB-PRI-1076',
  'OB-PRI-1081',
  'OB-PRI-1086',
  'OB-BOA-1045',
  'OB-BOA-1047',
  'OB-CLE-1090',
  'OB-COM-1034'
];

skus.forEach(sku => {
  const idx = catalogContent.indexOf(`"sku": "${sku}"`);
  if (idx !== -1) {
    const startObj = catalogContent.lastIndexOf('{', idx);
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
    console.log(`SKU: ${sku}, Name: ${prod.name}, images:`, prod.images);
  }
});

