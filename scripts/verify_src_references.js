const fs = require('fs');
const path = require('path');

function searchFiles(dir, needle) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...searchFiles(full, needle));
    } else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js') || full.endsWith('.jsx'))) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(needle)) {
        results.push(full);
      }
    }
  }
  return results;
}

console.log('Matches for prepared_1200:', searchFiles('src', 'prepared_1200'));
console.log('Matches for /products/re_extracted/:', searchFiles('src', 're_extracted'));
console.log('Matches for /products/extracted/:', searchFiles('src', 'extracted'));
console.log('Matches for catalog_2026 in src:', searchFiles('src', 'catalog_2026').length, 'files');

