const https = require('https');

https.get('https://officebazzar.com/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Look for count
    const m = data.match(/Showing <strong[^>]*>(\d+)<\/strong> of (\d+) products/i) || data.match(/(\d+)\s+of\s+(\d+)\s+products/i);
    if (m) {
      console.log('LIVE PRODUCTS COUNT:', m[0]);
    } else {
      console.log('Full count string not found, searching for occurrences of "products":');
      const allMatches = [...data.matchAll(/(\d+)\s+(?:of\s+\d+\s+)?products/gi)].map(x => x[0]);
      console.log(allMatches);
    }

    // Check card blocks
    const cardBlocks = data.split(/class="[^"]*group relative flex flex-col justify-between/);
    console.log(`\nTotal cards rendered on Page 1: ${cardBlocks.length - 1}`);

    let okCount = 0;
    let placeholderCount = 0;

    for (let i = 1; i < cardBlocks.length; i++) {
      const block = cardBlocks[i];
      const slugMatch = block.match(/href="\/product\/([^"]+)"/);
      const nameMatch = block.match(/<h3[^>]*>([^<]+)<\/h3>/);
      const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);

      const slug = slugMatch ? slugMatch[1] : 'unknown';
      const name = nameMatch ? nameMatch[1] : 'unknown';
      const img = imgMatch ? imgMatch[1] : 'none';
      const isPlaceholder = img.includes('placeholder');

      if (isPlaceholder) placeholderCount++;
      else okCount++;

      console.log(`${i.toString().padStart(2, ' ')}. [${isPlaceholder ? 'PLACEHOLDER' : 'OK'}] ${slug} | ${name}`);
    }

    console.log(`\nPage 1 Summary: ${okCount} with authentic supplier images, ${placeholderCount} with placeholder`);
  });
});

