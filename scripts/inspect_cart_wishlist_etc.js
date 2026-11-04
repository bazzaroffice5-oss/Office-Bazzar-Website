const fs = require('fs');

const files = [
  'src/components/cart/CartDrawer.tsx',
  'src/app/cart/page.tsx',
  'src/app/wishlist/page.tsx',
  'src/components/account/CustomerOrdersClient.tsx',
  'src/app/order-success/[orderId]/page.tsx',
  'src/components/quote/RequestQuoteClient.tsx'
];

for (const f of files) {
  const p = 'd:/Office Bazzar Website/' + f;
  if (fs.existsSync(p)) {
    console.log('=== ' + f + ' ===');
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (l.includes('images') || l.includes('image') || l.includes('Image') || l.includes('FALLBACK')) {
        console.log(`L${i+1}: ${l.trim()}`);
      }
    });
  }
}

