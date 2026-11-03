const fs = require('fs');

const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const targetSkus = [
  'OB-RDS-02',
  'OB-RDS-04',
  'OB-RDS-06',
  'OB-NOT-78',
  'OB-095'
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
