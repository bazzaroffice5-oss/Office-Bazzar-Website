const fs = require('fs');
const placeholders = JSON.parse(fs.readFileSync('scripts/placeholders_178.json', 'utf8'));

const fc = placeholders.filter(p => /highlighter|marker|faber|pencil|sharpener|eraser/i.test(p.name));
console.log('FC/Highlighter/Pencil in placeholders:');
fc.forEach(f => console.log(` - ${f.sku} | ${f.name}`));

