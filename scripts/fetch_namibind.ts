import * as fs from 'fs';
import sharp from 'sharp';

async function main() {
  const url = 'https://cdn.moglix.com/p/6fQ0zTLK8cugG-xxlarge.jpg';
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync('scripts/namibind_2088.jpg', buf);
  const meta = await sharp(buf).metadata();
  console.log('Downloaded Namibind NB-2088:', meta);
}
main().catch(console.error);

