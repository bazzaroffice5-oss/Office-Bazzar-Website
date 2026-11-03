const fs = require('fs');

// 1. Wishlist page
let w = fs.readFileSync('src/app/wishlist/page.tsx', 'utf8');
w = w.replaceAll('src={product.images[0]}', 'src={product.images?.[0] || "/assets/placeholder-product.svg"}');
fs.writeFileSync('src/app/wishlist/page.tsx', w, 'utf8');
console.log('Updated src/app/wishlist/page.tsx');

// 2. CartDrawer
let cd = fs.readFileSync('src/components/cart/CartDrawer.tsx', 'utf8');
cd = cd.replaceAll('src={item.product.images[0]}', 'src={item.product.images?.[0] || "/assets/placeholder-product.svg"}');
fs.writeFileSync('src/components/cart/CartDrawer.tsx', cd, 'utf8');
console.log('Updated src/components/cart/CartDrawer.tsx');

// 3. Order Success
let os = fs.readFileSync('src/app/order-success/[orderId]/page.tsx', 'utf8');
os = os.replaceAll('src={item.productImage}', 'src={item.productImage || "/assets/placeholder-product.svg"}');
fs.writeFileSync('src/app/order-success/[orderId]/page.tsx', os, 'utf8');
console.log('Updated src/app/order-success/[orderId]/page.tsx');

// 4. CustomerOrdersClient
let co = fs.readFileSync('src/components/account/CustomerOrdersClient.tsx', 'utf8');
co = co.replaceAll('src={item.productImage}', 'src={item.productImage || "/assets/placeholder-product.svg"}');
fs.writeFileSync('src/components/account/CustomerOrdersClient.tsx', co, 'utf8');
console.log('Updated src/components/account/CustomerOrdersClient.tsx');

