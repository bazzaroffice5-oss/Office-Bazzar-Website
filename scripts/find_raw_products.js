const fs = require('fs');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('RAW_PRODUCTS')) {
    console.log(`Line ${i + 1}: ${lines[i].substring(0, 100)}`);
  }
}
