const fs = require('fs');
const path = require('path');

function searchSrc(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    if (entry.isDirectory()) {
      searchSrc(full);
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs|json|sql)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      
      // Look for any /assets/products/ not starting with /assets/products/catalog_2026/
      const badAssets = content.match(/\/assets\/products\/(?!catalog_2026)[^\s"'`)]+/g);
      if (badAssets) {
        console.log(`[OLD ASSET PATH] ${full}:`, badAssets);
      }

      // Look for any /images/products/
      const imgProducts = content.match(/\/images\/products[^\s"'`)]*/g);
      if (imgProducts) {
        console.log(`[IMAGES PRODUCTS] ${full}:`, imgProducts);
      }

      // Look for any FALLBACK_IMAGE or placeholder constants
      const fallbacks = content.match(/(FALLBACK_IMAGE|placeholder-product|default_image|DEFAULT_IMAGE)[^\s"'`)]*/g);
      if (fallbacks) {
        console.log(`[FALLBACK/PLACEHOLDER] ${full}:`, fallbacks);
      }
    }
  }
}

console.log('--- SCANNING src/ and supabase/ ---');
searchSrc('d:/Office Bazzar Website/src');
if (fs.existsSync('d:/Office Bazzar Website/supabase')) {
  searchSrc('d:/Office Bazzar Website/supabase');
}

