const fs = require('fs');
const path = require('path');
const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');

function findFiles(folder, kw) {
  const dir = path.join(SOURCE_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.toLowerCase().includes(kw));
}

console.log('Brown tape:', findFiles('Stationery', 'brown'));
console.log('Brown tape in Packing:', findFiles('Packing Product', 'brown'));
console.log('Tape in Packing:', findFiles('Packing Product', 'tape'));
console.log('Tape in Stationery:', findFiles('Stationery', 'tape'));
