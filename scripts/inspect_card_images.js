const fs = require('fs');

const pdc = fs.readFileSync('src/components/product/ProductDetailClient.tsx', 'utf8');
const lines = pdc.split('\n');
for (const line of lines) {
  if (line.includes('FALLBACK') || line.includes('productImages') || line.includes('activeImage')) {
    console.log('PDC:', line.trim());
  }
}

// Find ProductCard or Card component
const plc = fs.readFileSync('src/components/product/ProductListingClient.tsx', 'utf8');
const lines2 = plc.split('\n');
for (const line of lines2) {
  if (line.includes('images') || line.includes('img') || line.includes('Image')) {
    console.log('PLC:', line.trim());
  }
}

