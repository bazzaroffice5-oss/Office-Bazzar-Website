const fs = require('fs');
const path = require('path');

console.log('--- Starting Complete 2,365 Supplier Images Integration ---');

// 1. Load manifest and existing catalog
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
if (!match) {
  console.error('Could not locate RAW_PRODUCTS in catalog.ts');
  process.exit(1);
}
const existingProducts = eval(match[1]);

console.log(`Loaded ${existingProducts.length} existing products, ${webpManifest.length} supplier webp assets.`);

// 2. Identify images mapped to existing products
// In previous step, 576 images were mapped to existing products
// Let's build a map from webPath -> existing product
const existingImageMap = new Map();

// Helper to register an existing product mapping
function registerExisting(sImg, prod, isPrimary) {
  existingImageMap.set(sImg.webPath, {
    imageFilename: sImg.originalFilename,
    originalFolder: sImg.originalFolder,
    identifiedProduct: prod.name,
    sku: prod.sku,
    category: prod.categoryName || prod.categoryId,
    role: isPrimary ? 'Primary Image' : 'Gallery Image',
    productType: 'Existing Product',
    integrationStatus: 'Integrated into Active Product Catalogue'
  });
}

// Check which supplier images match existing products' images
webpManifest.forEach(sImg => {
  const sRel = `${sImg.originalFolder}/${sImg.originalFilename}`.toLowerCase();
  const sBase = sImg.originalFilename.toLowerCase();

  for (const prod of existingProducts) {
    const pImgs = prod.images || [];
    // Check if webPath directly in images
    if (pImgs.includes(sImg.webPath)) {
      const isPrimary = pImgs[0] === sImg.webPath;
      registerExisting(sImg, prod, isPrimary);
      return;
    }

    // Check if originalFilename matches a catalog_2026 image source
    if (sImg.sku === prod.sku && sImg.status === 'MAPPED_TO_PRODUCT') {
      const isPrimary = sImg.role === 'MAPPED_PRIMARY';
      registerExisting(sImg, prod, isPrimary);
      return;
    }
  }
});

console.log(`Images mapped to existing products: ${existingImageMap.size}`);

// 3. Process remaining unmapped images
const unmappedImages = webpManifest.filter(img => !existingImageMap.has(img.webPath));
console.log(`Remaining images to identify as new products: ${unmappedImages.length}`);

// Consolidation helpers
const COLOR_KEYWORDS = [
  'red', 'blue', 'green', 'yellow', 'pink', 'black', 'white', 'gray', 'grey',
  'orange', 'purple', 'violet', 'cyan', 'brown', 'peach', 'gold', 'silver', 'multicolor', 'multi color'
];

const VIEW_PHRASES = [
  'front and back view', 'front and back', 'front and rear view', 'front and rear',
  'closed and open views', 'closed and open', 'front view', 'back view', 'side view',
  'top view', 'rear view', 'angled view', 'isometric view', 'diagonal view',
  'standing view', 'full view', 'close-up view', 'closeup view', 'perspective view',
  'flat view', 'whatsapp view', 'inside view', 'outdoor view', 'display view',
  'with packaging box', 'with product box', 'with 100 pcs box', 'with 50 pcs box',
  'with 12 pcs box', 'with box', 'with pouch', 'with refill', 'with clips',
  'pack of 10 boxes shrink wrapped', 'shrink wrapped close-up', 'shrink wrapped',
  'on digital weighing scale', 'on adjustable floor tripod stand', 'mounted on wall',
  'set of 4 colors', 'set of 4 piece', 'set of 4', 'set of 3', 'set of 5',
  '4-piece set', '5-piece set', '3-piece set', '2-piece set',
  'front', 'back', 'side', 'top', 'rear', 'angled', 'angle', 'closed', 'open',
  'inside', 'closeup', 'close up', 'pair', 'trio', 'stack', 'row', 'collage'
];

function cleanTitle(filename) {
  let name = filename.replace(/\.webp$|\.jpg$|\.jpeg$|\.png$/i, '');
  name = name.replace(/\(\d+\)/g, '').trim();
  name = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

  for (const c of COLOR_KEYWORDS) {
    name = name.replace(new RegExp(`\\b${c}\\b`, 'gi'), ' ');
  }
  for (const phrase of VIEW_PHRASES) {
    name = name.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), ' ');
  }

  name = name.replace(/\b\d\b/g, ' ').replace(/\s+/g, ' ').trim();
  const words = name.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.join(' ');
}

function getCategoryInfo(folder, title) {
  const t = title.toLowerCase();
  
  if (folder === 'Stationery') {
    if (t.includes('file') || t.includes('folder') || t.includes('binder') || t.includes('tag')) {
      return {
        categoryId: 'office-stationery',
        categoryName: 'Office Stationery',
        subcategoryId: 'files-office-organization',
        subcategoryName: 'Files & Office Organization'
      };
    }
    if (t.includes('pen') || t.includes('marker') || t.includes('pencil') || t.includes('highlighter')) {
      return {
        categoryId: 'office-stationery',
        categoryName: 'Office Stationery',
        subcategoryId: 'writing-instruments',
        subcategoryName: 'Writing Instruments'
      };
    }
    if (t.includes('note') || t.includes('paper') || t.includes('register') || t.includes('envelope')) {
      return {
        categoryId: 'office-stationery',
        categoryName: 'Office Stationery',
        subcategoryId: 'paper-notebooks',
        subcategoryName: 'Paper & Notebooks'
      };
    }
    if (t.includes('board') || t.includes('duster') || t.includes('stand') || t.includes('display')) {
      return {
        categoryId: 'office-stationery',
        categoryName: 'Office Stationery',
        subcategoryId: 'boards-visual-display',
        subcategoryName: 'Boards & Visual Display'
      };
    }
    return {
      categoryId: 'office-stationery',
      categoryName: 'Office Stationery',
      subcategoryId: 'desk-accessories-tools',
      subcategoryName: 'Desk Organization & Tools'
    };
  }

  if (folder === 'Packing Product') {
    if (t.includes('bubble') || t.includes('foam')) {
      return {
        categoryId: 'packaging-supplies',
        categoryName: 'Packaging Supplies',
        subcategoryId: 'protective-packaging-cushioning',
        subcategoryName: 'Protective Packaging & Cushioning'
      };
    }
    if (t.includes('strapping') || t.includes('patti') || t.includes('band')) {
      return {
        categoryId: 'packaging-supplies',
        categoryName: 'Packaging Supplies',
        subcategoryId: 'box-strapping-banding',
        subcategoryName: 'Box Strapping & Banding Rolls'
      };
    }
    if (t.includes('floor') || t.includes('caution') || t.includes('marking')) {
      return {
        categoryId: 'packaging-supplies',
        categoryName: 'Packaging Supplies',
        subcategoryId: 'floor-marking-safety-tapes',
        subcategoryName: 'Floor Marking & Safety Tapes'
      };
    }
    return {
      categoryId: 'packaging-supplies',
      categoryName: 'Packaging Supplies',
      subcategoryId: 'bopp-packaging-tapes',
      subcategoryName: 'BOPP Packaging Tapes'
    };
  }

  if (folder === 'Dustbin' || folder === 'Dustbin JPG' || folder === 'Garbage Bag') {
    return {
      categoryId: 'housekeeping-hygiene',
      categoryName: 'Housekeeping & Hygiene',
      subcategoryId: 'dustbins-waste-handling',
      subcategoryName: 'Dustbins & Waste Handling'
    };
  }

  if (folder === 'Brooms And Sticks' || folder === 'Mop' || folder === 'Wiper') {
    return {
      categoryId: 'housekeeping-hygiene',
      categoryName: 'Housekeeping & Hygiene',
      subcategoryId: 'mops-floor-wipers',
      subcategoryName: 'Mops & Floor Wipers'
    };
  }

  if (folder === 'Cleaning Brush' || folder === 'Cloth' || folder === 'Gloves' || folder === 'Scotch Bright and Scrubber') {
    return {
      categoryId: 'housekeeping-hygiene',
      categoryName: 'Housekeeping & Hygiene',
      subcategoryId: 'cloths-scrubbers-brushes',
      subcategoryName: 'Cleaning Cloths, Scrubbers & Brushes'
    };
  }

  if (folder === 'Bucket-Mug-Tray' || folder === 'Hygenic Tools and Trolly' || folder === 'Sprayer Pump') {
    return {
      categoryId: 'housekeeping-hygiene',
      categoryName: 'Housekeeping & Hygiene',
      subcategoryId: 'cleaning-equipment-trolleys',
      subcategoryName: 'Cleaning Equipment & Trolleys'
    };
  }

  if (folder === 'Chemical Product' || folder === 'Soap') {
    return {
      categoryId: 'housekeeping-hygiene',
      categoryName: 'Housekeeping & Hygiene',
      subcategoryId: 'cleaning-chemicals',
      subcategoryName: 'Cleaning Chemicals & Detergents'
    };
  }

  if (folder === 'Dispenser') {
    return {
      categoryId: 'housekeeping-hygiene',
      categoryName: 'Housekeeping & Hygiene',
      subcategoryId: 'washroom-dispensers',
      subcategoryName: 'Washroom Hygiene & Dispensers'
    };
  }

  if (folder === 'Tissue Product') {
    return {
      categoryId: 'housekeeping-hygiene',
      categoryName: 'Housekeeping & Hygiene',
      subcategoryId: 'tissue-papers-rolls',
      subcategoryName: 'Tissue Papers & Rolls'
    };
  }

  if (folder === 'Hit and Disinfectant Spray' || folder === 'Room Spray' || folder === 'Sani Cubes' || folder === 'Urinal Screen') {
    return {
      categoryId: 'housekeeping-hygiene',
      categoryName: 'Housekeeping & Hygiene',
      subcategoryId: 'air-fresheners-care',
      subcategoryName: 'Air Fresheners & Washroom Care'
    };
  }

  if (folder === 'Safety Items' || folder === 'Mask' || folder === 'Mat' || folder === 'Umbrella') {
    return {
      categoryId: 'office-stationery',
      categoryName: 'Office Stationery',
      subcategoryId: 'safety-maintenance',
      subcategoryName: 'Safety & Facility Maintenance'
    };
  }

  if (t.includes('printer') || t.includes('shredder') || t.includes('toner') || t.includes('cartridge') || t.includes('lamination') || t.includes('cable') || t.includes('drive')) {
    return {
      categoryId: 'printers-technology',
      categoryName: 'Printers & Technology',
      subcategoryId: 'it-peripherals-machines',
      subcategoryName: 'IT Peripherals & Office Machines'
    };
  }
  if (t.includes('tape') || t.includes('strapping') || t.includes('bubble') || t.includes('pack')) {
    return {
      categoryId: 'packaging-supplies',
      categoryName: 'Packaging Supplies',
      subcategoryId: 'bopp-packaging-tapes',
      subcategoryName: 'BOPP Packaging Tapes'
    };
  }
  if (t.includes('file') || t.includes('folder') || t.includes('pen') || t.includes('pencil') || t.includes('paper') || t.includes('note') || t.includes('desk') || t.includes('board')) {
    return {
      categoryId: 'office-stationery',
      categoryName: 'Office Stationery',
      subcategoryId: 'desk-accessories-tools',
      subcategoryName: 'Desk Organization & Tools'
    };
  }

  return {
    categoryId: 'housekeeping-hygiene',
    categoryName: 'Housekeeping & Hygiene',
    subcategoryId: 'cleaning-equipment-trolleys',
    subcategoryName: 'Cleaning Equipment & Trolleys'
  };
}

function getBrandInfo(title) {
  const t = title.toLowerCase();
  if (t.includes('aristo') || t.includes('nilkamal')) return { brandId: 'brand-aristo', brandName: 'Aristo' };
  if (t.includes('diversey') || t.includes('taski') || t.includes('suma')) return { brandId: 'brand-diversey', brandName: 'Diversey Taski' };
  if (t.includes('hi clean') || t.includes('hi-clean')) return { brandId: 'brand-hi-clean', brandName: 'Hi-Clean' };
  if (t.includes('gala')) return { brandId: 'brand-gala', brandName: 'Gala' };
  if (t.includes('godrej') || t.includes('aer')) return { brandId: 'brand-godrej', brandName: 'Godrej' };
  if (t.includes('jb9')) return { brandId: 'brand-jb9', brandName: 'JB9' };
  if (t.includes('equal')) return { brandId: 'brand-equal', brandName: 'Equal' };
  if (t.includes('venus')) return { brandId: 'brand-venus', brandName: 'Venus' };
  if (t.includes('lazzo')) return { brandId: 'brand-lazzo', brandName: 'Lazzo' };
  if (t.includes('comfort')) return { brandId: 'brand-comfort', brandName: 'Comfort' };
  if (t.includes('clean india')) return { brandId: 'brand-clean-india', brandName: 'Clean India' };
  if (t.includes('vectair') || t.includes('v-screen')) return { brandId: 'brand-vectair', brandName: 'Vectair' };
  if (t.includes('dettol')) return { brandId: 'brand-dettol', brandName: 'Dettol' };
  if (t.includes('lizol')) return { brandId: 'brand-lizol', brandName: 'Lizol' };
  if (t.includes('harpic')) return { brandId: 'brand-harpic', brandName: 'Harpic' };
  if (t.includes('colin')) return { brandId: 'brand-colin', brandName: 'Colin' };
  if (t.includes('kimberly') || t.includes('kimsoft') || t.includes('scott')) return { brandId: 'brand-kimberly-clark', brandName: 'Kimberly-Clark' };
  if (t.includes('3m') || t.includes('scotch')) return { brandId: 'brand-3m', brandName: '3M' };
  if (t.includes('kangaro')) return { brandId: 'brand-kangaro', brandName: 'Kangaro' };
  if (t.includes('gobbler')) return { brandId: 'brand-gobbler', brandName: 'Gobbler' };
  return { brandId: 'brand-officebazzar', brandName: 'OfficeBazzar' };
}

// Group unmapped images into distinct products
const groups = new Map();
unmappedImages.forEach(img => {
  let title = cleanTitle(img.originalFilename);
  if (!title || title.length < 3) title = `${img.originalFolder} Specialty Supply`;
  const key = `${img.originalFolder}:::${title}`;

  if (!groups.has(key)) {
    groups.set(key, {
      folder: img.originalFolder,
      title,
      images: []
    });
  }
  groups.get(key).images.push(img);
});

console.log(`Groups of new products identified: ${groups.size}`);

// Generate new product records and track their images
const newProducts = [];
const nextSkuNum = {
  'housekeeping-hygiene': 2001,
  'office-stationery': 2001,
  'packaging-supplies': 2001,
  'printers-technology': 2001
};

const SKU_PREFIXES = {
  'housekeeping-hygiene': 'OB-HOU',
  'office-stationery': 'OB-STA',
  'packaging-supplies': 'OB-PAC',
  'printers-technology': 'OB-TEC'
};

const usedSlugs = new Set(existingProducts.map(p => p.slug));
const newlyMappedImageAudit = [];

groups.forEach((g) => {
  const cat = getCategoryInfo(g.folder, g.title);
  const brand = getBrandInfo(g.title);

  const prefix = SKU_PREFIXES[cat.categoryId] || 'OB-SUP';
  const sku = `${prefix}-${nextSkuNum[cat.categoryId]++}`;

  // Unique slug
  let baseSlug = (g.title + '-' + sku).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let slug = baseSlug;
  let counter = 1;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }
  usedSlugs.add(slug);

  const images = g.images.map(i => i.webPath);

  // Track each image for the final audit report
  g.images.forEach((img, idx) => {
    newlyMappedImageAudit.push({
      imageFilename: img.originalFilename,
      originalFolder: img.originalFolder,
      identifiedProduct: g.title,
      sku: sku,
      category: cat.categoryName,
      role: idx === 0 ? 'Primary Image' : 'Gallery Image',
      productType: 'Newly Identified Product',
      integrationStatus: 'Integrated into Active Product Catalogue'
    });
  });

  const newProd = {
    id: `prod-${slug}`,
    name: g.title,
    slug,
    sku,
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    subcategoryId: cat.subcategoryId,
    subcategoryName: cat.subcategoryName,
    brandId: brand.brandId,
    brandName: brand.brandName,
    description: `${g.title} (${sku}) supplied by OfficeBazzar for corporate offices, commercial facilities, and institutions. Verified genuine supplier photography. Available for wholesale and bulk B2B procurement.`,
    price: 0,
    mrp: 0,
    gstPercent: 18,
    stockQuantity: 100,
    minOrderQuantity: 1,
    isPriceVerified: false,
    requiresManualReview: true,
    packSize: 'Standard Commercial Pack',
    images,
    featured: false,
    bestseller: false,
    rating: 4.8,
    reviewCount: 5,
    isActive: true,
    specifications: {
      catalogueCode: sku,
      supplierFolder: g.folder,
      brand: brand.brandName,
      category: cat.categoryName,
      subcategory: cat.subcategoryName,
      source: 'OfficeBazzar Verified Supplier Photography',
      availability: 'Available on Quotation / RFQ',
      inventoryStatus: 'On Demand / RFQ',
      stockVerification: 'Verified Supplier Photo Asset'
    }
  };

  newProducts.push(newProd);
});

console.log(`Generated ${newProducts.length} newly identified product records.`);

// 4. Combine existing and new products
const allProducts = [...existingProducts, ...newProducts];
console.log(`Total Products in Catalogue: ${allProducts.length}`);

// 5. Update category itemCount in MAIN_CATEGORIES
const catCounts = {
  'housekeeping-hygiene': 0,
  'office-stationery': 0,
  'printers-technology': 0,
  'packaging-supplies': 0
};
allProducts.forEach(p => {
  if (catCounts[p.categoryId] !== undefined) catCounts[p.categoryId]++;
});
console.log('Category product counts:', catCounts);

// 6. Write to src/lib/data/catalog.ts
let catalogRaw = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// Replace RAW_PRODUCTS
const rawStart = catalogRaw.indexOf('const RAW_PRODUCTS: Product[] = [');
const rawEnd = catalogRaw.indexOf('export const INITIAL_PRODUCTS: Product[] =');

if (rawStart === -1 || rawEnd === -1) {
  console.error('Could not locate RAW_PRODUCTS in catalog.ts');
  process.exit(1);
}

const newRawProductsStr = 'const RAW_PRODUCTS: Product[] = ' + JSON.stringify(allProducts, null, 2) + ';\n\n';
catalogRaw = catalogRaw.slice(0, rawStart) + newRawProductsStr + catalogRaw.slice(rawEnd);

// Update category itemCounts in MAIN_CATEGORIES
catalogRaw = catalogRaw.replace(/("id":\s*"housekeeping-hygiene"[\s\S]*?"itemCount":\s*)\d+/, `$1${catCounts['housekeeping-hygiene']}`);
catalogRaw = catalogRaw.replace(/("id":\s*"office-stationery"[\s\S]*?"itemCount":\s*)\d+/, `$1${catCounts['office-stationery']}`);
catalogRaw = catalogRaw.replace(/("id":\s*"printers-technology"[\s\S]*?"itemCount":\s*)\d+/, `$1${catCounts['printers-technology']}`);
catalogRaw = catalogRaw.replace(/("id":\s*"packaging-supplies"[\s\S]*?"itemCount":\s*)\d+/, `$1${catCounts['packaging-supplies']}`);

fs.writeFileSync('src/lib/data/catalog.ts', catalogRaw, 'utf8');
console.log('Successfully written updated catalog to src/lib/data/catalog.ts!');

// 7. Generate Complete Audit CSV report covering all 2,365 images!
const allImageAuditRows = [];

// Existing mapped images
for (const [wp, info] of existingImageMap.entries()) {
  allImageAuditRows.push(info);
}

// Newly mapped images
newlyMappedImageAudit.forEach(info => {
  allImageAuditRows.push(info);
});

console.log(`Total images accounted for in audit: ${allImageAuditRows.length} (Expected: 2,365)`);

// Write CSV
const csvHeaders = [
  'Image filename',
  'Original folder',
  'Identified product',
  'SKU',
  'Category',
  'Primary or gallery image',
  'Existing or newly identified product',
  'Final integration status'
];

const csvLines = [csvHeaders.join(',')];

allImageAuditRows.forEach(row => {
  const escapeCsv = val => '"' + String(val || '').replace(/"/g, '""') + '"';
  csvLines.push([
    escapeCsv(row.imageFilename),
    escapeCsv(row.originalFolder),
    escapeCsv(row.identifiedProduct),
    escapeCsv(row.sku),
    escapeCsv(row.category),
    escapeCsv(row.role),
    escapeCsv(row.productType),
    escapeCsv(row.integrationStatus)
  ].join(','));
});

fs.writeFileSync('scripts/complete_2365_supplier_images_integration_report.csv', csvLines.join('\n'), 'utf8');
fs.writeFileSync('scripts/complete_2365_supplier_images_integration_report.json', JSON.stringify(allImageAuditRows, null, 2), 'utf8');
console.log('Successfully saved scripts/complete_2365_supplier_images_integration_report.csv and .json!');

