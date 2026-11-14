const fs = require('fs');

const file = 'src/lib/data/catalog.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `"/assets/products/catalog_2026/OB-NOT-73.webp",
      "/assets/products/catalog_2026/OB-NOT-73-alt-1.webp",
      "/assets/products/catalog_2026/OB-NOT-73-alt-2.webp"`;

const targetStrCRLF = `"/assets/products/catalog_2026/OB-NOT-73.webp",\r\n      "/assets/products/catalog_2026/OB-NOT-73-alt-1.webp",\r\n      "/assets/products/catalog_2026/OB-NOT-73-alt-2.webp"`;

const replacement = `"/assets/products/catalog_2026/OB-NOT-73-alt-2.webp",
      "/assets/products/catalog_2026/OB-NOT-73-alt-1.webp",
      "/assets/products/catalog_2026/OB-NOT-73.webp"`;

const replacementCRLF = `"/assets/products/catalog_2026/OB-NOT-73-alt-2.webp",\r\n      "/assets/products/catalog_2026/OB-NOT-73-alt-1.webp",\r\n      "/assets/products/catalog_2026/OB-NOT-73.webp"`;

if (content.includes(targetStrCRLF)) {
  content = content.replace(targetStrCRLF, replacementCRLF);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced successfully using CRLF');
} else if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced successfully using LF');
} else {
  console.error('Target string not found in catalog.ts');
  process.exit(1);
}

