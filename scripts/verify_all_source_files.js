const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const mapping = JSON.parse(fs.readFileSync('complete_master_mapping.json', 'utf8'));
const basePkgDir = 'D:/temp_2369_package';

async function verify() {
  console.log(`Verifying source image existence and readability for all ${mapping.length} products...`);
  let errors = 0;

  for (let i = 0; i < mapping.length; i++) {
    const item = mapping[i];
    let resolvedSourcePath = '';

    if (item.migrationSource.startsWith('2369')) {
      resolvedSourcePath = path.join(basePkgDir, item.sourceFile);
    } else {
      resolvedSourcePath = path.join(process.cwd(), item.sourceFile);
    }

    if (!fs.existsSync(resolvedSourcePath)) {
      console.error(`[MISSING FILE] SKU: ${item.sku} -> Path not found: ${resolvedSourcePath}`);
      errors++;
      continue;
    }

    try {
      const meta = await sharp(resolvedSourcePath).metadata();
      if (!meta.width || !meta.height) {
        console.error(`[INVALID IMAGE] SKU: ${item.sku} -> Zero dimensions: ${resolvedSourcePath}`);
        errors++;
      }
    } catch (err) {
      console.error(`[CORRUPT IMAGE] SKU: ${item.sku} -> ${err.message} (${resolvedSourcePath})`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log(`SUCCESS: All ${mapping.length} source image files exist, are readable, and have valid dimensions!`);
  } else {
    console.error(`FAILED: Found ${errors} source file errors.`);
    process.exit(1);
  }
}

verify();

