import https from 'https';

https.get('https://montexpen.com/', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const re = /https?:\/\/[^"']+\.(?:jpg|png|webp|jpeg)/gi;
    const matches = Array.from(new Set(data.match(re) || []));
    console.log(`Found ${matches.length} unique images:`);
    matches.filter(m => m.includes('wp-content')).forEach(m => console.log(m));
  });
}).on('error', console.error);
