const fs = require('fs');
const inv = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));

const keywords = ['stapler', 'kangaro', 'punch', 'lamination', 'currency', 'counting', 'butter', 'board', 'alkosign', 'barcode', 'sandisk', 'drive', 'epson', 'toner', 'cartridge', 'scissor', 'cutter', 'pen'];

keywords.forEach(kw => {
  const matches = inv.filter(item => item.originalFilename.toLowerCase().includes(kw));
  console.log(`Keyword "${kw}": ${matches.length} matches`);
  if (matches.length > 0 && matches.length <= 8) {
    matches.forEach(m => console.log(`   -> [${m.originalFolder}] ${m.originalFilename}`));
  }
});

