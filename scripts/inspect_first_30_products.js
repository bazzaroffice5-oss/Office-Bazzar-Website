const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const regex = /\{\s*\"id\":\s*\"([^\"]+)\"[\s\S]*?\"name\":\s*\"([^\"]+)\"[\s\S]*?\"sku\":\s*\"([^\"]+)\"[\s\S]*?\"images\":\s*\[([\s\S]*?)\]/g;
let m;
let count = 0;
while ((m = regex.exec(cat)) !== null && count < 30) {
  count++;
  const [_, id, name, sku, imgsRaw] = m;
  const imgs = imgsRaw.split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  console.log(`${count.toString().padStart(2)}. ${sku.padEnd(14)} | ${name.padEnd(35)} | images: ${imgs.length}`);
}

