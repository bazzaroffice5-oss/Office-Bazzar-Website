const https = require('https');

function check() {
  https.get('https://officebazzar.com/products', (res) => {
    console.log('Status:', res.statusCode);
    console.log('Age header:', res.headers['age']);
    console.log('x-vercel-cache:', res.headers['x-vercel-cache']);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Contains 383:', data.includes('383'));
      console.log('Contains /assets/placeholder-product.svg:', data.includes('/assets/placeholder-product.svg'));
      console.log('Contains /assets/products/catalog_2026/:', data.includes('/assets/products/catalog_2026/'));
      const oldAssets = data.match(/\/assets\/products\/(?!catalog_2026)[^\s"'`)]+/g);
      console.log('Old product assets on live HTML:', oldAssets ? oldAssets.length : 0);
      if (oldAssets) console.log('Found old:', oldAssets);
    });
  }).on('error', (err) => console.error(err));
}

check();
