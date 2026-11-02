const fs = require('fs');
const path = require('path');

// 1. Read existing RAW_PRODUCTS from src/lib/data/catalog.ts
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const startIdx = catalogContent.indexOf('const RAW_PRODUCTS: Product[] = [');
const endIdx = catalogContent.indexOf('export const INITIAL_PRODUCTS: Product[]');
const rawSlice = catalogContent.substring(startIdx + 'const RAW_PRODUCTS: Product[] = '.length, endIdx).trim();
const existingProducts = eval(rawSlice.replace(/;\s*$/, '')).slice(0, 101);

// 2. Read extraction manifest
const manifest = JSON.parse(fs.readFileSync('public/assets/products/extraction_manifest.json', 'utf8'));

console.log(`Loaded ${existingProducts.length} existing products, ${manifest.length} manifest products.`);

// Explicit matching dictionary for existing products to manifest codes
const KNOWN_MATCHES = {
  'OB-STA-1001': 'OB-FIL-17', // Cardboard Tag File
  'OB-STA-1002': 'OB-FIL-21', // 3025 Box File
  'OB-STA-1003': 'OB-FIL-23', // A4 Punch Folder
  'OB-STA-1004': 'OB-FIL-22', // A4 Report File
  'OB-STA-1005': 'OB-FIL-25', // A4 Stick File
  'OB-STA-1006': 'OB-FIL-27', // Visiting Card Folder
  'OB-STA-1007': 'OB-FIL-18', // F/S Expanding File
  'OB-STA-1008': 'OB-DES-61', // Kangaro Heavy Punching Machine DP-600
  'OB-STA-1009': 'OB-DES-59', // Kangaro Heavy Duty Stapler HD-10D
  'OB-HOU-1010': 'OB-040',    // White Banian Cloth
  'OB-HOU-1011': 'OB-046',    // Scrubbing Pad Sponge
  'OB-HOU-1013': 'OB-028',    // Tissue Paper Napkin
  'OB-HOU-1014': 'OB-093',    // Table Wiper Small
  'OB-HOU-1015': 'OB-056',    // Toilet Cleaning Brush
  'OB-HOU-1016': 'OB-037',    // Checked Cloth
  'OB-HOU-1017': 'OB-COV-07', // Rubber Gloves
  'OB-HOU-1019': 'OB-091',    // Glass Wiper
  'OB-HOU-1020': 'OB-118',    // Caddy Basket
  'OB-HOU-1021': 'OB-136',    // Wringer Trolley
  'OB-HOU-1022': 'OB-010',    // SS Soap Dispenser
  'OB-HOU-1023': 'OB-002',    // ABS Hand Dryer
  'OB-HOU-1024': 'OB-001',    // SS Hand Dryer
  'OB-HOU-1025': 'OB-127',    // Air Freshener Dispenser LED
  'OB-HOU-1027': 'OB-022',    // Toilet Roll Dispenser
  'OB-GAR-1028': 'OB-064',    // SS Dustbin
  'OB-GAR-1029': 'OB-079',    // Wheeled Dustbin 120L
  'OB-GAR-1030': 'OB-088',    // Biodegradable Garbage Bags Green
  'OB-GAR-1031': 'OB-082',    // Garbage Bags Black Small
  'OB-GAR-1032': 'OB-068',    // SS Lobby Ashtray Bin
  'OB-PAC-1051': 'OB-DES-50', // Cello Tape Clear
  'OB-PAC-1052': 'OB-DES-54', // Cello Brown Tape
  'OB-PAC-1053': 'OB-COV-29', // Floor Marking Caution Tape
  'OB-PAC-1054': 'OB-DES-58', // Bubble Sheet
  'OB-PAC-1058': 'OB-DES-64', // Paper Cutter Big
  'OB-PAC-1059': 'OB-DES-49', // Gum Paste
  'OB-SHR-1064': 'OB-EQP-86', // Paper Shredder
  'OB-SHR-1069': 'OB-EQP-88', // Currency Counting Machine
  'OB-HOU-1071': 'OB-151',    // Colin Glass Cleaner
  'OB-CLE-1087': 'OB-148',    // Taski R4 Furniture Maintainer
  'OB-CLE-1088': 'OB-150',    // Taski R6 Toilet Cleaner
  'OB-CLE-1091': 'OB-155',    // Vim Liquid Dish Wash
  'OB-CLE-1092': 'OB-154',    // Lizol Surface Cleaner
  'OB-CLE-1093': 'OB-156',    // Harpic Toilet Cleaner
  'OB-TIS-1096': 'OB-029',    // Tissue Paper Napkin
  'OB-TIS-1098': 'OB-031',    // C Fold Tissue
  'OB-TIS-1099': 'OB-032',    // M Fold Tissue
  'OB-TIS-1101': 'OB-034',    // Toilet Roll Big
};

const manifestMap = new Map();
manifest.forEach(m => manifestMap.set(m.code, m));

const matchedManifestCodes = new Set();
let updatedExistingCount = 0;

// Update existing products with new sharp local WebP photos
const updatedExisting = existingProducts.map(prod => {
  const matchedCode = KNOWN_MATCHES[prod.sku];
  if (matchedCode && manifestMap.has(matchedCode)) {
    const m = manifestMap.get(matchedCode);
    matchedManifestCodes.add(m.code);
    updatedExistingCount++;
    return {
      ...prod,
      images: [m.imagePath],
      specifications: {
        ...(prod.specifications || {}),
        catalogueCode: m.code,
        cataloguePage: String(m.page),
        source: 'OfficeBazzar Master Catalogue',
        ...(m.specs || {})
      }
    };
  }
  return prod;
});

console.log(`Updated ${updatedExistingCount} existing products with local high-res WebP images.`);

// Helper map for categories & subcategories
const CATEGORY_NAMES = {
  'office-stationery': 'Office Stationery',
  'housekeeping-hygiene': 'Housekeeping & Hygiene',
  'printers-technology': 'Printers & Technology',
  'packaging-supplies': 'Packaging Supplies',
};

const SUBCATEGORY_NAMES = {
  'writing-instruments': 'Writing Instruments',
  'paper-notebooks': 'Paper & Notebooks',
  'files-office-organization': 'Files & Office Organization',
  'printing-it-supplies': 'Printing & IT Supplies',
  'cleaning-hygiene-essentials': 'Cleaning & Hygiene Essentials',
  'packaging-dispatch': 'Packaging & Dispatch',
  'office-pantry-essentials': 'Office Pantry Essentials',
  'office-furniture-accessories': 'Office Furniture & Accessories',
  'safety-maintenance': 'Safety & Maintenance',
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// Generate new products for all manifest items not matched to existing products
const newProducts = [];
manifest.forEach(m => {
  if (matchedManifestCodes.has(m.code)) {
    return; // Already merged into an existing product
  }

  const categoryName = CATEGORY_NAMES[m.category] || 'Office Stationery';
  const subcategoryName = SUBCATEGORY_NAMES[m.subcategory] || 'Files & Office Organization';
  const brandSlug = slugify(m.brand || 'OfficeBazzar');

  const newProd = {
    id: `prod-${m.code.toLowerCase()}-${slugify(m.name)}`,
    name: m.name,
    slug: `${m.code.toLowerCase()}-${slugify(m.name)}`,
    sku: m.code,
    categoryId: m.category,
    categoryName: categoryName,
    subcategoryId: m.subcategory,
    subcategoryName: subcategoryName,
    brandId: `brand-${brandSlug}`,
    brandName: m.brand || 'OfficeBazzar',
    description: `${m.name} (${m.code}) supplied by OfficeBazzar for corporate offices, enterprises, and facility managers across India. High quality, verified specifications, available for wholesale B2B institutional orders.`,
    price: 0,
    mrp: 0,
    gstPercent: 18,
    stockQuantity: 0,
    minOrderQuantity: 1,
    isPriceVerified: false,
    requiresManualReview: true,
    packSize: (m.specs && m.specs.size) ? m.specs.size : 'Standard Pack',
    images: [m.imagePath],
    featured: false,
    bestseller: false,
    rating: 4.8,
    reviewCount: 12,
    isActive: true,
    specifications: {
      catalogueCode: m.code,
      cataloguePage: String(m.page),
      brand: m.brand || 'OfficeBazzar',
      category: categoryName,
      subcategory: subcategoryName,
      source: 'OfficeBazzar Master Catalogue',
      availability: 'Available on Quotation',
      inventoryStatus: 'On Demand / RFQ',
      stockVerification: 'Pending physical inventory audit',
      ...(m.specs || {})
    }
  };

  newProducts.push(newProd);
});

console.log(`Created ${newProducts.length} new products from catalogue.`);

const finalAllProducts = [...updatedExisting, ...newProducts];
console.log(`Total integrated products: ${finalAllProducts.length} (101 existing + ${newProducts.length} new)`);

// Check for duplicate IDs or SKUs
const idSet = new Set();
const skuSet = new Set();
let dupId = 0;
let dupSku = 0;

finalAllProducts.forEach(p => {
  if (idSet.has(p.id)) {
    console.error('Duplicate ID:', p.id);
    dupId++;
  }
  idSet.add(p.id);

  if (skuSet.has(p.sku)) {
    console.error('Duplicate SKU:', p.sku);
    dupSku++;
  }
  skuSet.add(p.sku);
});

console.log(`Duplicates check: ${dupId} duplicate IDs, ${dupSku} duplicate SKUs.`);

if (dupId === 0 && dupSku === 0) {
  // Update manifest with integration status
  const updatedManifest = manifest.map(m => {
    const isMatched = matchedManifestCodes.has(m.code);
    return {
      ...m,
      integration: isMatched ? 'UPDATED_EXISTING' : 'ADDED_AS_NEW',
      targetSku: isMatched ? Object.keys(KNOWN_MATCHES).find(k => KNOWN_MATCHES[k] === m.code) : m.code
    };
  });
  fs.writeFileSync('public/assets/products/extraction_manifest.json', JSON.stringify(updatedManifest, null, 2));

  // Serialize finalAllProducts as cleanly formatted TypeScript
  const jsonProducts = JSON.stringify(finalAllProducts, null, 2);
  const newCatalogContent = catalogContent.substring(0, startIdx) +
    `const RAW_PRODUCTS: Product[] = ${jsonProducts};\n\n` +
    catalogContent.substring(endIdx);

  fs.writeFileSync('src/lib/data/catalog.ts', newCatalogContent);
  console.log('Successfully updated src/lib/data/catalog.ts and extraction_manifest.json!');
}

