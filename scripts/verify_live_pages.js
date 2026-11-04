const https = require('https');

const paths = [
  '/product/cardboard-tag-file',
  '/product/tissue-paper-napkin',
  '/product/kent-ks-12-lamination-machine',
  '/cart',
  '/categories'
];

async function checkUrl(p) {
  return new Promise((resolve) => {
    https.get('https://officebazzar.com' + p, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const oldAssets = data.match(/\/assets\/products\/(?!catalog_2026)[^\s"'`)]+/g) || [];
        const hasCatalog2026 = data.includes('/assets/products/catalog_2026/');
        const hasPlaceholder = data.includes('/assets/placeholder-product.svg');
        console.log(`${p} -> Status ${res.statusCode} | Old assets: ${oldAssets.length} | Has catalog_2026: ${hasCatalog2026} | Has placeholder: ${hasPlaceholder}`);
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

