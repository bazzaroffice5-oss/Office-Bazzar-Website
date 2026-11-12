const https = require('https');

https.get('https://officebazzar.com/category/office-stationery', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Category HTML length:', data.length);
    console.log('Has Featured:', data.includes('Featured'));
    console.log('Has Essential:', data.includes('Essential'));
    console.log('Has OB-STA:', data.includes('OB-STA'));
    console.log('Has Office Stationery:', data.includes('Office Stationery'));
    
    // Find headings
    const h2s = data.match(/<h2[^>]*>([^<]+)<\/h2>/g);
    console.log('H2 headings found:', h2s);
  });
});
