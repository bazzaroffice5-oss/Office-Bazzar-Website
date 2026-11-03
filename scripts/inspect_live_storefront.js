const https = require('https');

https.get('https://officebazzar.com/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('HTML length:', data.length);
    
    // Extract images
    const imgMatches = [...data.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    const catalogImgs = imgMatches.filter(src => src.includes('catalog_2026') || src.includes('placeholder'));
    console.log('Total catalog/placeholder images in HTML:', catalogImgs.length);
    
    const placeholders = catalogImgs.filter(s => s.includes('placeholder'));
    const realImgs = catalogImgs.filter(s => s.includes('catalog_2026'));
    console.log('Real catalog_2026 images on page 1:', realImgs.length);
    console.log('Placeholder images on page 1:', placeholders.length);

    console.log('\nSample real images on page 1:');
    realImgs.slice(0, 10).forEach(s => console.log('  ', s));

    console.log('\nSample placeholders on page 1:');
    placeholders.slice(0, 10).forEach(s => console.log('  ', s));

    // Also check what products are shown on page 1
    const productLinks = [...data.matchAll(/href="\/product\/([^"]+)"/g)].map(m => m[1]);
    console.log('\nTotal product links on page 1:', productLinks.length);
    console.log('First 10 product slugs:');
    productLinks.slice(0, 10).forEach(s => console.log('  ', s));
  });
}).on('error', err => {
  console.error('Error fetching live products page:', err.message);
});
