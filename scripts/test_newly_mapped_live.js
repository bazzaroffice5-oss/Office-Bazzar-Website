const https = require('https');

const paths = [
  '/products',
  '/product/gobbler-a2326-paper-shredding-machine',
  '/product/wooden-stand-for-boards',
  '/product/liquid-white-phenyl',
  '/product/itc-classmate-corporate-notebooks',
  '/product/canon-ep-303-toner-cartridge'
];

async function checkUrl(p) {
  return new Promise((resolve) => {
    https.get('https://officebazzar.com' + p, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasCatalog2026 = data.includes('/assets/products/catalog_2026/');
        const hasPlaceholder = data.includes('/assets/placeholder-product.svg');
        const oldRefs = data.match(/\/assets\/products\/(?!catalog_2026)[^\s"'`)]+/g) || [];
        console.log(`[${p}] Status: ${res.statusCode} | Has catalog_2026: ${hasCatalog2026} | Has placeholder: ${hasPlaceholder} | Old assets: ${oldRefs.length}`);
        resolve();
      });
    }).on('error', (e) => {
      console.error(p, e);
      resolve();
    });
  });
}

(async () => {
  for (const p of paths) {
    await checkUrl(p);
  }
})();

