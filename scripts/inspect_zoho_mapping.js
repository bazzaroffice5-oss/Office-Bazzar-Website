const fs = require('fs');
const mapping = JSON.parse(fs.readFileSync('src/lib/data/zoho_product_mapping.json', 'utf8'));
const sample = mapping['OB-BOA-1046'];
console.log('OB-BOA-1046:', JSON.stringify(sample, null, 2));

