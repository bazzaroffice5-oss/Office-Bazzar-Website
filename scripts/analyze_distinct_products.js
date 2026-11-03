const fs = require('fs');
const path = require('path');

const uncatalogued = JSON.parse(fs.readFileSync('scripts/uncatalogued_images.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('scripts/office_bazzar_active_catalog_manifest.json', 'utf8'));

console.log(`Analyzing ${uncatalogued.length} uncatalogued supplier images...\n`);

// Let's examine how images group into distinct products based on their file names and patterns
// In Windows/supplier archives, multiple angles often have "(2)", "(3)", "Front View", "Side View", "Open", "Closed", "Collage"
// Or same base name before angle description

const groups = {};

function normalizeBaseName(relPath) {
  const parsed = path.parse(relPath);
  const folder = parsed.dir;
  let name = parsed.name;

  // Clean common angle / duplicate indicators
  name = name.replace(/\s*\(\d+\)$/i, '');
  name = name.replace(/\s*(?:front|back|side|rear|top|bottom|angled|high angle|low angle|close-up|open|closed|standing|flat|packaging|pair|trio|display|infographic|collage|dimensions)\s*(?:view|views|profile|angle)?/gi, '');
  name = name.trim();

  return path.join(folder, name);
}

uncatalogued.forEach(img => {
  const key = normalizeBaseName(img.rel);
  if (!groups[key]) {
    groups[key] = [];
  }
  groups[key].push(img);
});

const distinctKeys = Object.keys(groups);
console.log(`Total distinct product image groups identified: ${distinctKeys.length}`);

// Count groups by folder
const folderGroups = {};
distinctKeys.forEach(k => {
  const top = k.split(/[\\/]/)[0];
  folderGroups[top] = (folderGroups[top] || 0) + 1;
});

console.log('\nDistinct product groups by category folder:');
console.table(folderGroups);

// Show some sample groups
console.log('\n--- Sample Product Groups (with angles) ---');
distinctKeys.filter(k => groups[k].length > 1).slice(0, 10).forEach(k => {
  console.log(`\nGroup: ${k} (${groups[k].length} files)`);
  groups[k].forEach(f => console.log(`   - ${path.basename(f.rel)}`));
});

fs.writeFileSync('scripts/distinct_uncatalogued_groups.json', JSON.stringify({
  totalImages: uncatalogued.length,
  totalDistinctGroups: distinctKeys.length,
  groups
}, null, 2));
