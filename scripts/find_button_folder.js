const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const regex = /\{\s*\"id\":\s*\"([^\"]+)\"[\s\S]*?\"name\":\s*\"([^\"]+)\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"/g;
let m;
while ((m = regex.exec(cat)) !== null) {
  const [_, id, name, sku] = m;
  if (/button|folder|file/i.test(name)) {
    console.log(`${sku.padEnd(16)} | ${name}`);
  }
}
