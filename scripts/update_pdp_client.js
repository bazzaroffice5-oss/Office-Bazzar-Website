const fs = require('fs');

const file = 'src/components/product/ProductDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = '  // Active image selector (supports multiple product images)\r\n  const productImages = product.images && product.images.length > 0 ? product.images : [FALLBACK_IMAGE];\r\n  const [activeImage, setActiveImage] = useState<string>(productImages[0]);';

const replacement = '  // Active image selector (strictly new supplier catalog only)\r\n  const validImages = (product.images && product.images.length > 0 ? product.images : []).filter(\r\n    (img) => typeof img === \'string\' && img.startsWith(\'/assets/products/catalog_2026/\')\r\n  );\r\n  const productImages = validImages.length > 0 ? validImages : [FALLBACK_IMAGE];\r\n  const [activeImage, setActiveImage] = useState<string>(productImages[0]);';

if (!content.includes(target)) {
  console.error('Target not found in', file);
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated', file);

