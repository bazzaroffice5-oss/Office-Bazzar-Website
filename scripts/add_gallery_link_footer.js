const fs = require('fs');

const footerFile = 'src/components/layout/Footer.tsx';
let content = fs.readFileSync(footerFile, 'utf8');

const target = `              <li>
                <Link href="/products" className="hover:text-emerald-400 transition-colors">
                  All Products
                </Link>
              </li>`;

const replacement = `              <li>
                <Link href="/products" className="hover:text-emerald-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/supplier-gallery" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>Supplier Image Library</span>
                  <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded font-bold">2,369</span>
                </Link>
              </li>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(footerFile, content, 'utf8');
  console.log('Added Supplier Image Library to Footer.tsx');
} else {
  // Try CRLF variant
  const targetCRLF = target.replace(/\n/g, '\r\n');
  const replacementCRLF = replacement.replace(/\n/g, '\r\n');
  if (content.includes(targetCRLF)) {
    content = content.replace(targetCRLF, replacementCRLF);
    fs.writeFileSync(footerFile, content, 'utf8');
    console.log('Added Supplier Image Library to Footer.tsx (CRLF)');
  } else {
    console.error('Target not found in Footer.tsx');
  }
}

