const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const targetSkus = [
  'OB-HOU-1011',
  'OB-HOU-1016',
  'OB-HOU-1010',
  'OB-HOU-1012',
  'OB-HOU-1026',
  'OB-GAR-1032',
  'OB-STA-1003',
  'OB-STA-1004',
  'OB-STA-1006',
  'OB-COM-1037',
  'OB-045',
  'OB-054',
  'OB-062',
  'OB-071',
  'OB-076',
  'OB-112'
];

targetSkus.forEach(sku => {
  const regex = new RegExp(`"sku":\\s*"${sku}"[\\s\\S]*?"requiresManualReview":\\s*\\w+`, 'g');
  const m = cat.match(regex);
  if (m) {
    console.log(`=== ${sku} ===`);
    console.log(m[0].slice(0, 300) + '...\n');
  } else {
    console.log(`NOT FOUND: ${sku}`);
  }
});
