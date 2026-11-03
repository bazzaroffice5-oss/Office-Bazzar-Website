const fs = require('fs');

const inventory = JSON.parse(fs.readFileSync('scripts/office_bazzar_new_images_inventory.json', 'utf8'));
const validImages = inventory.filter(x => x.isImage);

function listFolder(folderName) {
  console.log(`=== ${folderName} ===`);
  validImages.filter(img => img.rel.toLowerCase().startsWith(folderName.toLowerCase())).forEach(m => console.log(' ', m.rel));
}

listFolder('Cleaning Brush');
listFolder('Hit and Disinfectant Spray');
listFolder('Bucket-Mug-Tray');
