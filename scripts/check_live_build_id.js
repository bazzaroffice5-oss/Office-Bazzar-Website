const https = require('https');

https.get('https://officebazzar.com/products', res => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const m = html.match(/Showing[\s\S]{1,150}products/i);
    console.log('Badge in HTML:', m ? m[0].replace(/\s+/g, ' ') : 'not found');
    const bId = html.match(/"buildId":"([^"]+)"/);
    console.log('Build ID:', bId ? bId[1] : 'not found');
  });
});

