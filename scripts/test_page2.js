const https = require('https');

https.get('https://officebazzar.com/products?page=2', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const titleMatch = data.match(/<title>([^<]+)<\/title>/);
    const canonicalMatch = data.match(/<link rel="canonical" href="([^"]+)"/);
    console.log('Page 2 Status:', res.statusCode);
    console.log('Page 2 Title:', titleMatch ? titleMatch[1] : 'NONE');
    console.log('Page 2 Canonical:', canonicalMatch ? canonicalMatch[1] : 'NONE');
  });
});
