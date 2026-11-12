const https = require('https');

https.get('https://officebazzar.com/product/cardboard-tag-file', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const jsonLdMatches = data.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
    console.log('JSON-LD scripts found:', jsonLdMatches ? jsonLdMatches.length : 0);
    if (jsonLdMatches) {
      jsonLdMatches.forEach((m, idx) => {
        const jsonStr = m.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        try {
          const parsed = JSON.parse(jsonStr);
          console.log(`\nScript ${idx + 1} (@type: ${parsed['@type']}):`);
          if (parsed['@type'] === 'Product') {
            console.log('  Name:', parsed.name);
            console.log('  SKU:', parsed.sku);
            console.log('  Brand:', parsed.brand?.name);
            console.log('  Price:', parsed.offers?.price, parsed.offers?.priceCurrency);
            console.log('  Availability:', parsed.offers?.availability);
          } else if (parsed['@type'] === 'BreadcrumbList') {
            console.log('  Breadcrumb items:', parsed.itemListElement.length);
          }
        } catch (e) {
          console.log('Parse error:', e.message);
        }
      });
    }
  });
});
