const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const regex = /"sku":\s*"([^"]+)",[\s\S]*?"name":\s*"([^"]+)"/g;
let m;
while ((m = regex.exec(cat)) !== null) {
  if (m[1].startsWith('OB-SHR')) {
    console.log(m[1], '|', m[2]);
  }
}

