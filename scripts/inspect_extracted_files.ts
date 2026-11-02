import * as fs from 'fs';
import * as path from 'path';

const base = path.join(process.cwd(), 'temp_prepared_383', 'OfficeBazzar_Product_Images');
console.log('Contents of base:');
const items = fs.readdirSync(base);
console.log(items);

for (const item of items) {
  const p = path.join(base, item);
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    const sub = fs.readdirSync(p);
    console.log(`Directory [${item}]: ${sub.length} entries. Sample:`, sub.slice(0, 5));
  } else {
    console.log(`File [${item}]: ${stat.size} bytes`);
  }
}
