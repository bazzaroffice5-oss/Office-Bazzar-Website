const fs = require('fs');
const lines = fs.readFileSync('D:/Office Bazzar Website/seo_audit_nov09_2026/officebazzar.com-seo-avoid-thin-content-pages.csv', 'utf8').trim().split('\n');

const failed = lines.slice(1).filter(l => l.startsWith('FALSE,'));
console.log('Total failed thin content:', failed.length);

for (const line of failed.slice(0, 10)) {
  console.log(line);
}
