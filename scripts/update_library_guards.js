const fs = require('fs');

const filesToUpdate = [
  'src/components/product/ProductCard.tsx',
  'src/components/product/ProductDetailClient.tsx',
  'src/components/cart/CartDrawer.tsx',
  'src/app/cart/page.tsx',
  'src/app/wishlist/page.tsx',
  'src/components/account/CustomerOrdersClient.tsx',
  'src/app/order-success/[orderId]/page.tsx',
  'src/components/quote/RequestQuoteClient.tsx'
];

for (const rel of filesToUpdate) {
  let content = fs.readFileSync(rel, 'utf8');
  // replace startsWith('/assets/products/catalog_2026/') with (path => path?.startsWith('/assets/products/catalog_2026/') || path?.startsWith('/assets/supplier-library/'))
  // Or simpler string replacement
  const replaced = content
    .replace(
      /typeof rawImg === 'string' && rawImg\.startsWith\('\/assets\/products\/catalog_2026\/'\)/g,
      "typeof rawImg === 'string' && (rawImg.startsWith('/assets/products/catalog_2026/') || rawImg.startsWith('/assets/supplier-library/'))"
    )
    .replace(
      /typeof rawImage === 'string' && rawImage\.startsWith\('\/assets\/products\/catalog_2026\/'\)/g,
      "typeof rawImage === 'string' && (rawImage.startsWith('/assets/products/catalog_2026/') || rawImage.startsWith('/assets/supplier-library/'))"
    )
    .replace(
      /typeof img === 'string' && img\.startsWith\('\/assets\/products\/catalog_2026\/'\)/g,
      "typeof img === 'string' && (img.startsWith('/assets/products/catalog_2026/') || img.startsWith('/assets/supplier-library/'))"
    )
    .replace(
      /item\.product\.images\?\.\[0\]\?\.startsWith\('\/assets\/products\/catalog_2026\/'\)/g,
      "(item.product.images?.[0]?.startsWith('/assets/products/catalog_2026/') || item.product.images?.[0]?.startsWith('/assets/supplier-library/'))"
    )
    .replace(
      /product\.images\?\.\[0\]\?\.startsWith\('\/assets\/products\/catalog_2026\/'\)/g,
      "(product.images?.[0]?.startsWith('/assets/products/catalog_2026/') || product.images?.[0]?.startsWith('/assets/supplier-library/'))"
    )
    .replace(
      /item\.productImage\?\.startsWith\('\/assets\/products\/catalog_2026\/'\)/g,
      "(item.productImage?.startsWith('/assets/products/catalog_2026/') || item.productImage?.startsWith('/assets/supplier-library/'))"
    )
    .replace(
      /it\.product\.images\?\.\[0\]\?\.startsWith\('\/assets\/products\/catalog_2026\/'\)/g,
      "(it.product.images?.[0]?.startsWith('/assets/products/catalog_2026/') || it.product.images?.[0]?.startsWith('/assets/supplier-library/'))"
    );

  if (replaced !== content) {
    fs.writeFileSync(rel, replaced, 'utf8');
    console.log('Updated guard in:', rel);
  } else {
    console.log('No change needed or already updated:', rel);
  }
}

