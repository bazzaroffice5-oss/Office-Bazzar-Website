const fs = require('fs');
const path = require('path');

const uncatalogued = JSON.parse(fs.readFileSync('scripts/uncatalogued_images.json', 'utf8'));
const distinctData = JSON.parse(fs.readFileSync('scripts/distinct_uncatalogued_groups.json', 'utf8'));

// Check how many have specific brand names, model numbers, or pack sizes in their filename
const detailedItems = [];
const genericItems = [];

const brandKeywords = [
  'vevey', 'godrej', 'aer', 'taski', 'diversey', 'cif', 'scotch-brite', 'scotch brite',
  'lazzo', 'milton', 'odonil', 'all out', 'good knight', 'hit', 'dettol', 'savlon',
  'schevaran', 'wonder fresh', 'wonder killex', 'jb9', 'classik', 'aristo', 'bhupendra',
  'clean india', 'drytab', 'vaata', 'jkm pavitram', 'comfort', 'surf excel', 'vim', 'pril',
  'gala', 'dhoom', 'nandhi', 'victor', 'apple', 'scott', 'greenlime', 'royal natural'
];

for (const [groupName, files] of Object.entries(distinctData.groups)) {
  const lower = groupName.toLowerCase();
  const matchedBrand = brandKeywords.find(b => lower.includes(b));
  if (matchedBrand) {
    detailedItems.push({ groupName, brand: matchedBrand, fileCount: files.length, sampleFile: files[0].rel });
  } else {
    genericItems.push({ groupName, fileCount: files.length, sampleFile: files[0].rel });
  }
}

console.log(`Total distinct product groups: ${Object.keys(distinctData.groups).length}`);
console.log(`Products with identifiable brand/specs: ${detailedItems.length}`);
console.log(`Generic/unbranded items: ${genericItems.length}`);

console.log('\nSample Branded/Identifiable Groups:');
detailedItems.slice(0, 15).forEach(d => console.log(`   [${d.brand.toUpperCase()}] ${d.groupName} (${d.fileCount} angles)`));

console.log('\nSample Generic Groups:');
genericItems.slice(0, 15).forEach(g => console.log(`   ${g.groupName} (${g.fileCount} angles)`));
