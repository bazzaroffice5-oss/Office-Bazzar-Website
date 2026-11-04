const fs = require('fs');
const path = require('path');

// Test that all images exist on disk
const script = fs.readFileSync('scripts/test_curated_matching.js', 'utf8');

const extra = `
let missingOnDisk = 0;
productMap.forEach((entry, sku) => {
  entry.images.forEach(imgUrl => {
    const filePath = path.join(process.cwd(), 'public', imgUrl.replace(/^\\//, ''));
    if (!fs.existsSync(filePath)) {
      console.error(\`MISSING ON DISK: \${sku} -> \${imgUrl} (path: \${filePath})\`);
      missingOnDisk++;
    }
  });
});

console.log(\`Disk validation complete. Missing files: \${missingOnDisk}\`);
`;

fs.writeFileSync('scripts/run_disk_check.js', script + extra, 'utf8');

