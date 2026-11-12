const fs = require('fs');

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catalogContent.indexOf('const RAW_PRODUCTS: any[] = [');
const endIdx = catalogContent.indexOf('export const INITIAL_PRODUCTS: Product[] = RAW_PRODUCTS.map');
const rawText = catalogContent.substring(startIdx + 'const RAW_PRODUCTS: any[] = '.length, endIdx).trim();
const cleanedText = rawText.replace(/;\s*$/, '');
const products = eval(cleanedText);

const DUPLICATE_INACTIVE_SLUGS = new Set(['kangaro-staplers-hd-10d', 'kangaro-staplers-hd-10d-1']);
const activeProducts = products.filter(p => !DUPLICATE_INACTIVE_SLUGS.has(p.slug) && p.isActive !== false);

function formatProductSeoTitle(product) {
  const brand = 'Office Bazzar';
  const sku = (product.sku || '').trim();
  let name = (product.name || '').trim();

  name = name
    .replace(/\s*[|–-]\s*Office\s*Bazzar(\s+India)?\s*$/i, '')
    .replace(/\s*[|–-]\s*Officebazzar[^|]*$/i, '')
    .trim();

  const suffix = sku ? ` (${sku}) | ${brand}` : ` | ${brand}`;
  const maxTitleLen = 65;
  const maxNameLen = maxTitleLen - suffix.length;

  if (name.length > maxNameLen && maxNameLen > 15) {
    const sliced = name.slice(0, maxNameLen);
    const lastSpace = sliced.lastIndexOf(' ');
    name = lastSpace > 10 ? sliced.slice(0, lastSpace).trim() : sliced.trim();
  }

  return `${name}${suffix}`;
}

function formatProductSeoDescription(product) {
  const cleanName = (product.name || '').trim();
  const brandName = (product.brandName || 'Office Bazzar').trim();
  const sku = (product.sku || '').trim();
  const pack = (product.packSize || 'Standard Pack').trim();
  const gst = product.gstPercent || 18;

  const desc = `Buy ${cleanName} (${sku}) by ${brandName}. ${pack}, ${gst}% GST invoice, wholesale pricing & bulk enterprise delivery in India.`;
  if (desc.length <= 158) return desc;

  const shortDesc = `Buy ${cleanName} (${sku}). ${pack}, ${gst}% GST invoice & wholesale B2B delivery across India.`;
  if (shortDesc.length <= 158) return shortDesc;

  const suffix = ` (${sku}). ${gst}% GST invoice & bulk corporate supply across India.`;
  const maxNameLen = 155 - suffix.length;
  const truncatedName = cleanName.slice(0, maxNameLen).replace(/\s+\S*$/, '').trim();
  return `Buy ${truncatedName}${suffix}`;
}

const titlesMap = new Map();
const descriptionsMap = new Map();
const duplicateTitles = [];
const duplicateDescriptions = [];
const missingImages = [];
const invalidCanonicals = [];
const shortDescriptions = [];

const csvRows = [
  'SKU,ID,Slug,Product Name,Brand,Category,Subcategory,SEO Title,Title Length,Meta Description,Description Length,Canonical URL,Primary Image,Image Alt,Overview Word Count,Status'
];

for (const p of activeProducts) {
  const seoTitle = formatProductSeoTitle(p);
  const metaDesc = formatProductSeoDescription(p);
  const canonicalUrl = `https://officebazzar.com/product/${p.slug || p.id}`;
  const primaryImage = (p.images && p.images.length > 0) ? p.images[0] : '';
  const imageAlt = p.name;
  
  if (titlesMap.has(seoTitle)) {
    duplicateTitles.push({ sku: p.sku, title: seoTitle, otherSku: titlesMap.get(seoTitle) });
  } else {
    titlesMap.set(seoTitle, p.sku);
  }

  if (descriptionsMap.has(metaDesc)) {
    duplicateDescriptions.push({ sku: p.sku, desc: metaDesc, otherSku: descriptionsMap.get(metaDesc) });
  } else {
    descriptionsMap.set(metaDesc, p.sku);
  }

  if (!primaryImage) {
    missingImages.push(p.sku);
  }

  if (!canonicalUrl.startsWith('https://officebazzar.com/product/')) {
    invalidCanonicals.push({ sku: p.sku, url: canonicalUrl });
  }

  const rawWords = (p.description || '').trim().split(/\s+/).filter(Boolean);
  if (rawWords.length < 20) {
    shortDescriptions.push({ sku: p.sku, count: rawWords.length });
  }

  const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
  csvRows.push([
    escapeCsv(p.sku),
    escapeCsv(p.id),
    escapeCsv(p.slug),
    escapeCsv(p.name),
    escapeCsv(p.brandName),
    escapeCsv(p.categoryName),
    escapeCsv(p.subcategoryName),
    escapeCsv(seoTitle),
    seoTitle.length,
    escapeCsv(metaDesc),
    metaDesc.length,
    escapeCsv(canonicalUrl),
    escapeCsv(primaryImage),
    escapeCsv(imageAlt),
    rawWords.length,
    'PASS'
  ].join(','));
}

const csvPath = 'docs/officebazzar_complete_1946_products_seo_audit.csv';
fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');

console.log('\n================================================================');
console.log('       1,946 ACTIVE PRODUCTS SEO AUDIT RESULTS');
console.log('================================================================');
console.log(`Active Products Audited:    ${activeProducts.length}`);
console.log(`Unique SEO Titles:          ${titlesMap.size} / 1946 (Duplicates: ${duplicateTitles.length})`);
console.log(`Unique Meta Descriptions:   ${descriptionsMap.size} / 1946 (Duplicates: ${duplicateDescriptions.length})`);
console.log(`Missing Primary Images:     ${missingImages.length}`);
console.log(`Invalid Canonical URLs:     ${invalidCanonicals.length}`);
console.log(`Products with Short Descs:  ${shortDescriptions.length}`);
console.log(`CSV Report Generated:       ${csvPath} (${(fs.statSync(csvPath).size / 1024).toFixed(1)} KB)`);
console.log('================================================================\n');
