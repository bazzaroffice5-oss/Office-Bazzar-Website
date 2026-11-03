const fs = require('fs');
const placeholders = JSON.parse(fs.readFileSync('scripts/placeholders_178.json', 'utf8'));

const bottles = placeholders.filter(p => p.name.toLowerCase().includes('bottle') || p.name.toLowerCase().includes('water') || p.name.toLowerCase().includes('sugar'));
console.log('Bottles/Sugar in placeholders:');
bottles.forEach(b => console.log(` - ${b.sku} | ${b.name}`));

