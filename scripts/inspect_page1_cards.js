const https = require('https');

https.get('https://officebazzar.com/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Look at each product card in the HTML
    // A card has href="/product/{slug}" and an image src
    // In Next.js SSR, let's extract each <a href="/product/..."> ... </a> block or search for product cards
    const cardRegex = /href="\/product\/([^"]+)"[\s\S]*?<img[^>]+src="([^"]+)"/g;
    const cards = [...data.matchAll(cardRegex)];

    console.log(`Found ${cards.length} card matches:`);
    const seen = new Set();
    cards.forEach((c, idx) => {
      const slug = c[1];
      const img = c[2];
      if (!seen.has(slug)) {
        seen.add(slug);
        const isPlaceholder = img.includes('placeholder');
        console.log(`${seen.size}. [${isPlaceholder ? 'PLACEHOLDER' : 'REAL IMAGE'}] /product/${slug} -> ${img.slice(0, 70)}...`);
      }
    });
  });
});
