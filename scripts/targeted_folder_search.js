const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(process.cwd(), 'Office Bazzar New Images');

function searchFolder(folder, query) {
  const dir = path.join(SOURCE_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  const q = query.toLowerCase();
  return files.filter(f => f.toLowerCase().includes(q)).map(f => path.join(folder, f));
}

console.log('--- Dispenser for Kitchen Roll ---');
console.log(searchFolder('Dispenser', 'roll'));
console.log(searchFolder('Dispenser', 'kitchen'));

console.log('--- Cleaning Brush ---');
console.log(searchFolder('Cleaning Brush', 'carpet'));
console.log(searchFolder('Cleaning Brush', 'road'));
console.log(searchFolder('Brooms And Sticks', 'road'));

console.log('--- Wiper ---');
console.log(searchFolder('Wiper', 'table'));
console.log(searchFolder('Hygenic Tools and Trolly', 'wiper'));

console.log('--- Dustbin for Cartoon ---');
console.log(searchFolder('Dustbin', 'cartoon'));
console.log(searchFolder('Dustbin JPG', 'cartoon'));
console.log(searchFolder('Dustbin', 'character'));

console.log('--- Packing Product ---');
console.log(searchFolder('Packing Product', 'brown'));
console.log(searchFolder('Packing Product', 'tissue'));
console.log(searchFolder('Stationery', 'brown'));
console.log(searchFolder('Stationery', 'tissue'));

console.log('--- Mask ---');
console.log(searchFolder('Mask', 'yellow'));
console.log(searchFolder('Mask', 'face'));

