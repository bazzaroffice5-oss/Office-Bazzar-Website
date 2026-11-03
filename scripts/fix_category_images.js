const fs = require('fs');

let c = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// Replace any broken /OB-[A-Z]+.webp in CATEGORIES
const replacements = [
  ['/assets/products/catalog_2026/OB-STA.webp', '/assets/products/catalog_2026/OB-STA-1002.webp'],
  ['/assets/products/catalog_2026/OB-GAR.webp', '/assets/products/catalog_2026/OB-152.webp'],
  ['/assets/products/catalog_2026/OB-COM.webp', '/assets/products/catalog_2026/OB-007.webp'],
  ['/assets/products/catalog_2026/OB-BOA.webp', '/assets/products/catalog_2026/OB-BOA-1049.webp'],
  ['/assets/products/catalog_2026/OB-PAC.webp', '/assets/products/catalog_2026/OB-DES-55.webp'],
  ['/assets/products/catalog_2026/OB-DIS.webp', '/assets/products/catalog_2026/OB-003.webp'],
  ['/assets/products/catalog_2026/OB-HOU.webp', '/assets/products/catalog_2026/OB-026.webp'],
  ['/assets/products/catalog_2026/OB-TON.webp', '/assets/products/catalog_2026/OB-006.webp']
];

for (const [target, repl] of replacements) {
  c = c.replaceAll(target, repl);
}

fs.writeFileSync('src/lib/data/catalog.ts', c, 'utf8');
console.log('Fixed category card image paths to verified supplier photos!');

