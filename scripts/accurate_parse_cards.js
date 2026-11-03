const https = require('https');

https.get('https://officebazzar.com/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // In ProductCard.tsx, each card has:
    // <Link href="/product/{slug}" ... > <img src="{src}" ... > </Link>
    // followed by <Link href="/product/{slug}" ... > <h3>{name}</h3> </Link>
    
    // Split by product card container:
    // <div ... class="group relative flex flex-col justify-between ...
    const cardBlocks = data.split(/class="[^"]*group relative flex flex-col justify-between/);
    console.log(`Total card blocks in HTML: ${cardBlocks.length - 1}`);

    for (let i = 1; i < cardBlocks.length; i++) {
      const block = cardBlocks[i];
      const slugMatch = block.match(/href="\/product\/([^"]+)"/);
      const nameMatch = block.match(/<h3[^>]*>([^<]+)<\/h3>/);
      const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);

      const slug = slugMatch ? slugMatch[1] : 'unknown';
      const name = nameMatch ? nameMatch[1] : 'unknown';
      const img = imgMatch ? imgMatch[1] : 'none';
      const isPlaceholder = img.includes('placeholder');

      console.log(`${i.toString().padStart(2, ' ')}. [${isPlaceholder ? 'PLACEHOLDER' : 'OK'}] ${slug} | ${name}`);
      console.log(`    Img: ${img.slice(0, 80)}`);
    }
  });
});
