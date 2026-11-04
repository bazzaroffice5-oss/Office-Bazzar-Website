const fs = require('fs');

// 1. CartDrawer.tsx
const drawerFile = 'src/components/cart/CartDrawer.tsx';
let drawerContent = fs.readFileSync(drawerFile, 'utf8');
const badDrawer = `src={((item.(product.images?.[0]?.startsWith('/assets/products/catalog_2026/') || product.images?.[0]?.startsWith('/assets/supplier-library/')) || item.product.images?.[0]?.startsWith('/assets/supplier-library/')) ? item.product.images[0] : '/assets/placeholder-product.svg')}`;
const goodDrawer = `src={((item.product.images?.[0]?.startsWith('/assets/products/catalog_2026/') || item.product.images?.[0]?.startsWith('/assets/supplier-library/')) ? item.product.images[0] : '/assets/placeholder-product.svg')}`;
drawerContent = drawerContent.replace(badDrawer, goodDrawer);
fs.writeFileSync(drawerFile, drawerContent, 'utf8');
console.log('Fixed CartDrawer.tsx');

// 2. RequestQuoteClient.tsx
const quoteFile = 'src/components/quote/RequestQuoteClient.tsx';
let quoteContent = fs.readFileSync(quoteFile, 'utf8');
const badQuote = `productImage: (it.(product.images?.[0]?.startsWith('/assets/products/catalog_2026/') || product.images?.[0]?.startsWith('/assets/supplier-library/')) ? it.product.images[0] : '/assets/placeholder-product.svg'),`;
const goodQuote = `productImage: ((it.product.images?.[0]?.startsWith('/assets/products/catalog_2026/') || it.product.images?.[0]?.startsWith('/assets/supplier-library/')) ? it.product.images[0] : '/assets/placeholder-product.svg'),`;
quoteContent = quoteContent.replace(badQuote, goodQuote);
fs.writeFileSync(quoteFile, quoteContent, 'utf8');
console.log('Fixed RequestQuoteClient.tsx');

