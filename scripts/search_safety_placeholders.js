const fs = require('fs');
const placeholders = JSON.parse(fs.readFileSync('scripts/placeholders_178.json', 'utf8'));

const vest = placeholders.filter(p => /vest|jacket|goggle|glasses|thermometer|first aid/i.test(p.name));
console.log('Vest/Goggles/Thermometer/First Aid in placeholders:');
vest.forEach(v => console.log(` - ${v.sku} | ${v.name}`));
