const fs = require('fs');

function sanitizeImageRef(file, findPattern, replacePattern) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(findPattern)) {
    content = content.replace(findPattern, replacePattern);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Sanitized in:', file);
  } else {
    console.log('Pattern not found in:', file);
  }
}

// 1. cart/page.tsx
const cartFile = 'src/app/cart/page.tsx';
let cartContent = fs.readFileSync(cartFile, 'utf8');
cartContent = cartContent.replace(
  'const displayImage = product.images?.[0] || FALLBACK_IMAGE;',
  'const rawImg = product.images?.[0];\n                const displayImage = (typeof rawImg === \'string\' && rawImg.startsWith(\'/assets/products/catalog_2026/\')) ? rawImg : FALLBACK_IMAGE;'
);
fs.writeFileSync(cartFile, cartContent, 'utf8');
console.log('Updated cart/page.tsx');

// 2. CartDrawer.tsx
const drawerFile = 'src/components/cart/CartDrawer.tsx';
let drawerContent = fs.readFileSync(drawerFile, 'utf8');
drawerContent = drawerContent.replace(
  'src={item.product.images?.[0] || "/assets/placeholder-product.svg"}',
  'src={(item.product.images?.[0]?.startsWith(\'/assets/products/catalog_2026/\') ? item.product.images[0] : \'/assets/placeholder-product.svg\')}'
);
fs.writeFileSync(drawerFile, drawerContent, 'utf8');
console.log('Updated CartDrawer.tsx');

// 3. wishlist/page.tsx
const wishFile = 'src/app/wishlist/page.tsx';
let wishContent = fs.readFileSync(wishFile, 'utf8');
wishContent = wishContent.replace(
  'src={product.images?.[0] || "/assets/placeholder-product.svg"}',
  'src={(product.images?.[0]?.startsWith(\'/assets/products/catalog_2026/\') ? product.images[0] : \'/assets/placeholder-product.svg\')}'
);
fs.writeFileSync(wishFile, wishContent, 'utf8');
console.log('Updated wishlist/page.tsx');

// 4. CustomerOrdersClient.tsx
const ordersFile = 'src/components/account/CustomerOrdersClient.tsx';
let ordersContent = fs.readFileSync(ordersFile, 'utf8');
ordersContent = ordersContent.replace(
  'src={item.productImage || "/assets/placeholder-product.svg"}',
  'src={(item.productImage?.startsWith(\'/assets/products/catalog_2026/\') ? item.productImage : \'/assets/placeholder-product.svg\')}'
);
fs.writeFileSync(ordersFile, ordersContent, 'utf8');
console.log('Updated CustomerOrdersClient.tsx');

// 5. order-success/[orderId]/page.tsx
const orderSuccessFile = 'src/app/order-success/[orderId]/page.tsx';
let orderSuccessContent = fs.readFileSync(orderSuccessFile, 'utf8');
orderSuccessContent = orderSuccessContent.replace(
  'src={item.productImage || "/assets/placeholder-product.svg"}',
  'src={(item.productImage?.startsWith(\'/assets/products/catalog_2026/\') ? item.productImage : \'/assets/placeholder-product.svg\')}'
);
fs.writeFileSync(orderSuccessFile, orderSuccessContent, 'utf8');
console.log('Updated order-success page');

// 6. RequestQuoteClient.tsx
const rfqFile = 'src/components/quote/RequestQuoteClient.tsx';
let rfqContent = fs.readFileSync(rfqFile, 'utf8');
rfqContent = rfqContent.replace(
  'productImage: it.product.images[0] || \'\',',
  'productImage: (it.product.images?.[0]?.startsWith(\'/assets/products/catalog_2026/\') ? it.product.images[0] : \'/assets/placeholder-product.svg\'),'
);
fs.writeFileSync(rfqFile, rfqContent, 'utf8');
console.log('Updated RequestQuoteClient.tsx');

