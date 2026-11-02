import * as fs from 'fs';
import sharp from 'sharp';

async function main() {
  const url = 'https://officebazzar.co.in/wp-content/uploads/2022/12/whatsapp-image-2021-03-10-at-11-16-31-500x500-1.jpg';
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync('scripts/ob_com_1039_raw.jpg', buf);
  const meta = await sharp(buf).metadata();
  console.log('Downloaded OB-COM-1039 raw image:', meta);
}
main().catch(console.error);

