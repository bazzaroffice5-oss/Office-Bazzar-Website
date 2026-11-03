const { execSync } = require('child_process');
const fs = require('fs');

const zipPath = 'C:/Users/Pachamuthu S/Downloads/wetransfer_product-photo-4-3-26_2026-11-03_0545.zip';
const out = execSync(`tar -tf "${zipPath}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8');
const lines = out.split(/\r?\n/).filter(Boolean);
fs.writeFileSync('all_2369_zip_entries.txt', lines.join('\n'), 'utf8');
console.log('Total entries written to all_2369_zip_entries.txt:', lines.length);

