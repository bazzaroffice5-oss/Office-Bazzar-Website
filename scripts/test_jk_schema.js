const https = require('https');

https.get('https://officebazzar.com/product/ob-pap-04-jk-copier-paper-75-gsm-a4', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const jsonLdMatches = data.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
    if (jsonLdMatches) {
      jsonLdMatches.forEach(m => {
        const jsonStr = m.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed['@type'] === 'Product') {
            console.log('JK Copier Product Schema:', parsed.name);
            console.log('Price:', parsed.offers?.price, parsed.offers?.priceCurrency);
            console.log('Availability:', parsed.offers?.availability);
            console.log('SKU:', parsed.sku);
            console.log('URL:', parsed.url);
          }
        } catch {}
      });
    }
  });
});
