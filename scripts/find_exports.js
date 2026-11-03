const fs = require('fs');
const cat = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const lines = cat.split('\n');
for (let i = 0; i < 200; i++) {
  if (lines[i].includes('export const')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
