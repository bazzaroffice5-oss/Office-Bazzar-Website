const fs = require('fs');

const content = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// Extract RAW_PRODUCTS array text
const startIdx = content.indexOf('const RAW_PRODUCTS: any[] = [');
const endIdx = content.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate RAW_PRODUCTS in catalog.ts');
  process.exit(1);
}

const rawText = content.substring(startIdx + 'const RAW_PRODUCTS: any[] = '.length, endIdx).trim();
// remove trailing semicolon if any
const cleanedText = rawText.replace(/;\s*$/, '');

let products = [];
try {
  products = eval(cleanedText);
  console.log('Successfully evaluated RAW_PRODUCTS! Total count:', products.length);
} catch (err) {
  console.error('Eval error:', err.message);
  // fallback json parse or regex
}

if (products.length > 0) {
  let activeCount = 0;
  let missingDesc = 0;
  let shortDesc = 0;
  let missingSku = 0;
  let missingImages = 0;
  const titles = new Map();
  const slugs = new Set();
  const duplicateSlugs = [];

  for (const p of products) {
    if (p.isActive !== false) activeCount++;
    if (!p.description || !p.description.trim()) missingDesc++;
    else if (p.description.trim().split(/\s+/).length < 20) shortDesc++;
    if (!p.sku) missingSku++;
    if (!p.images || p.images.length === 0) missingImages++;

    if (slugs.has(p.slug)) {
      duplicateSlugs.push(p.slug);
    } else {
      slugs.add(p.slug);
    }

    const t = (p.name || '').trim().toLowerCase();
    if (titles.has(t)) {
      titles.set(t, titles.get(t) + 1);
    } else {
      titles.set(t, 1);
    }
  }

  const dupTitles = Array.from(titles.entries()).filter(([k, v]) => v > 1);

  console.log('Active Products:', activeCount);
  console.log('Missing Descriptions:', missingDesc);
  console.log('Short Descriptions (<20 words):', shortDesc);
  console.log('Missing SKU:', missingSku);
  console.log('Missing Images:', missingImages);
  console.log('Duplicate Slugs count:', duplicateSlugs.length);
  if (duplicateSlugs.length > 0) console.log('Duplicate slugs sample:', duplicateSlugs.slice(0, 5));
  console.log('Duplicate Names/Titles count:', dupTitles.length);
  console.log('Sample Duplicate Titles:', dupTitles.slice(0, 10));
}
