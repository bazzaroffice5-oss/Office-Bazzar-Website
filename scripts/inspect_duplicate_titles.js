const fs = require('fs');
const lines = fs.readFileSync('D:/Office Bazzar Website/seo_audit_nov09_2026/officebazzar.com-seo-use-unique-titles.csv', 'utf8').trim().split('\n');

console.log('Total lines in unique-titles.csv:', lines.length);
const failed = lines.slice(1).filter(l => l.startsWith('FALSE,'));
console.log('Failed count:', failed.length);

const titleGroups = new Map();
for (const line of failed) {
  // FALSE,URL,Title,Pages with same title
  const parts = line.split(',');
  const url = parts[1];
  const title = parts.slice(2, parts.length - 1).join(',');
  if (!titleGroups.has(title)) titleGroups.set(title, []);
  titleGroups.get(title).push(url);
}

console.log('Distinct duplicate title strings:', titleGroups.size);
for (const [title, urls] of Array.from(titleGroups.entries()).slice(0, 10)) {
  console.log(`\nTitle: "${title}" (${urls.length} pages):`);
  urls.slice(0, 3).forEach(u => console.log('  ' + u));
}
