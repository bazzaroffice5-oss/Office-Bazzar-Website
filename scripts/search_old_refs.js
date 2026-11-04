const fs = require('fs');
const path = require('path');

function search(dir, regexes) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (['node_modules', '.next', '.git', 'Office Bazzar New Images'].includes(entry.name)) continue;
    if (entry.isDirectory()) {
      search(full, regexes);
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs|json|sql|md)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      for (const { label, reg } of regexes) {
        const matches = content.match(reg);
        if (matches) {
          console.log(`[${label}] in ${full}:`);
          console.log(matches.slice(0, 5));
        }
      }
    }
  }
}

const regexes = [
  { label: 'old_assets_products', reg: /\/assets\/products\/(?!catalog_2026)[^\s"'`)]+/g },
  { label: 'images_products', reg: /\/images\/products[^\s"'`)]*/g },
  { label: 'legacy_or_old_img', reg: /(legacy_products|old_product_images|old_images|legacy_images)/gi },
  { label: 'placeholder_fallback', reg: /fallback.*image|placeholder.*image/gi }
];

search('d:/Office Bazzar Website', regexes);

