const fs = require('fs');

const files = [
  'd:/Office Bazzar Website/src/lib/data/catalog.ts',
  'd:/Office Bazzar Website/src/lib/zoho/products.ts',
  'd:/Office Bazzar Website/src/lib/db/store.ts'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    console.log('=== FILE:', f, '===');
    const content = fs.readFileSync(f, 'utf8');
    // print any line mentioning image or images or photo or placeholder
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (l.toLowerCase().includes('image') || l.toLowerCase().includes('photo') || l.toLowerCase().includes('assets')) {
        console.log(`L${i+1}: ${l.trim()}`);
      }
    });
  }
}

