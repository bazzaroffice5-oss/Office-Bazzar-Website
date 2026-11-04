const https = require('https');

async function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', (err) => resolve({ error: err }));
  });
}

async function run() {
  console.log('--- AUDITING ALL STOREFRONT PAGES (https://officebazzar.com) ---');

  const pages = [
    { name: 'Homepage', url: 'https://officebazzar.com/' },
    { name: 'All Products Listing', url: 'https://officebazzar.com/products' },
    { name: 'Office Stationery Category', url: 'https://officebazzar.com/category/office-stationery' },
    { name: 'Housekeeping & Hygiene Category', url: 'https://officebazzar.com/category/housekeeping-hygiene' },
    { name: 'Printers & Technology Category', url: 'https://officebazzar.com/category/printers-technology' },
    { name: 'Packaging Supplies Category', url: 'https://officebazzar.com/category/packaging-supplies' },
    { name: 'Cart Page', url: 'https://officebazzar.com/cart' },
    { name: 'Wishlist Page', url: 'https://officebazzar.com/wishlist' },
    { name: 'Quotation Request Page', url: 'https://officebazzar.com/request-quote' },
    { name: 'PDP - Cardboard Tag File', url: 'https://officebazzar.com/product/cardboard-tag-file' },
    { name: 'PDP - Stainless Steel Pedal Dustbin', url: 'https://officebazzar.com/product/ob-069-stainless-steel-pedal-dustbin' },
    { name: 'PDP - Gala No Dust Broom (Multi-Image)', url: 'https://officebazzar.com/product/ob-117-gala-no-dust-broom' },
    { name: 'PDP - Shoe Polish Machine', url: 'https://officebazzar.com/product/ob-007-shoe-polish-machine' }
  ];

  const results = [];
  for (const page of pages) {
    const res = await get(page.url);
    const pass = res.status === 200 && res.data && res.data.length > 500;
    
    // Check if response contains image tags or expected responsive elements
    const hasNextImage = res.data && (res.data.includes('img') || res.data.includes('Image') || res.data.includes('srcset'));
    const hasResponsiveContainer = res.data && (res.data.includes('max-w-') || res.data.includes('container') || res.data.includes('grid'));

    results.push({
      page: page.name,
      status: res.status,
      pass: pass ? 'PASS' : 'FAIL',
      hasImageTags: hasNextImage ? 'YES' : 'NO',
      responsiveLayout: hasResponsiveContainer ? 'YES' : 'NO'
    });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${page.name} (${res.status})`);
  }

  console.log('\n--- Storefront Page Audit Table ---');
  console.table(results);
}

run();
