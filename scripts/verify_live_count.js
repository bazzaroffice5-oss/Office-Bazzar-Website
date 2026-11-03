const https = require('https');

function check() {
  https.get('https://officebazzar.com/products', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      // Look for the count in the HTML:
      // "Showing <strong ...>{totalItems}</strong> of {activeProducts.length} products"
      const countMatch = data.match(/Showing <strong[^>]*>(\d+)<\/strong> of (\d+) products/);
      if (countMatch) {
        console.log(`Live Count Displayed: Showing ${countMatch[1]} of ${countMatch[2]} products`);
      } else {
        console.log('Count match not found in HTML. Searching for "products"...');
        const m = data.match(/(\d+)\s+products/i);
        if (m) console.log('Found:', m[0]);
      }

      // Check the newly pushed image URLs
      const urls = [
        '/assets/products/catalog_2026/OB-STA-1005.webp',
        '/assets/products/catalog_2026/OB-PAC-1057.webp',
        '/assets/products/catalog_2026/OB-NOT-79.webp',
        '/assets/products/catalog_2026/OB-BOA-1048.webp',
        '/assets/products/catalog_2026/OB-TIS-1096.webp'
      ];

      urls.forEach(u => {
        https.get(`https://officebazzar.com${u}`, (imgRes) => {
          console.log(`[${imgRes.statusCode}] https://officebazzar.com${u}`);
        });
      });
    });
  }).on('error', err => {
    console.error('Error:', err.message);
  });
}

// Wait 15s for deployment then check
console.log('Waiting 15 seconds for Vercel deployment of commit 2ef5bc7...');
setTimeout(check, 15000);

