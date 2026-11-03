const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'Office Bazzar New Images');

function listFolder(name) {
  const dir = path.join(srcDir, name);
  if (!fs.existsSync(dir)) return;
  console.log(`\n=== FOLDER: ${name} ===`);
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    if (!fs.statSync(full).isDirectory()) {
      console.log(' - ' + f);
    }
  });
}

listFolder('Safety Items');
listFolder('Sprayer Pump');
listFolder('Hit and Disinfectant Spray');
listFolder('Folders');
listFolder('Packing Product');
