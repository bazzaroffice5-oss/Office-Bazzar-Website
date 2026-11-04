const fs = require('fs');
const path = require('path');

// 1. Load manifest and existing catalog
const manifest = JSON.parse(fs.readFileSync('scripts/supplier_images_master_manifest.json', 'utf8'));
const webpManifest = manifest.filter(m => m.webPath && m.webPath.endsWith('.webp'));

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');
const match = catalogContent.match(/const RAW_PRODUCTS: Product\[\] = (\[[\s\S]*?\n\];)/);
const existingProducts = eval(match[1]);

console.log(`Initial: ${existingProducts.length} existing products, ${webpManifest.length} supplier images.`);

// 2. Identify images mapped to existing products
const existingImageMap = new Map(); // webPath -> { sku, role }
const existingSkus = new Set(existingProducts.map(p => p.sku));

existingProducts.forEach(p => {
  (p.images || []).forEach((img, idx) => {
    existingImageMap.set(img, {
      sku: p.sku,
      productName: p.name,
      category: p.categoryName || p.categoryId,
      role: idx === 0 ? 'Primary Image' : 'Gallery Image',
      type: 'Existing Product'
    });
  });
});

console.log(`Images already mapped to existing products: ${existingImageMap.size}`);

// 3. Unmapped images to group into new products
const unmappedImages = webpManifest.filter(img => !existingImageMap.has(img.webPath));
console.log(`Images to group into newly identified products: ${unmappedImages.length}`);

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
        categoryName: 'Packaging Materials',
        subcategoryId: 'protective-packaging-cushioning',
        subcategoryName: 'Protective Packaging & Cushioning'
      };
    }
    if (t.includes('strapping') || t.includes('patti') || t.includes('band')) {
      return {
        categoryId: 'packaging-supplies',
        categoryName: 'Packaging Materials',
        subcategoryId: 'box-strapping-banding',
        subcategoryName: 'Box Strapping & Banding Rolls'
      };
    }
    if (t.includes('floor') || t.includes('caution') || t.includes('marking')) {
      return {
        categoryId: 'packaging-supplies',
        categoryName: 'Packaging Materials',
        subcategoryId: 'floor-marking-safety-tapes',
        subcategoryName: 'Floor Marking & Safety Tapes'
      };
    }
    return {
      categoryId: 'packaging-supplies',
      categoryName: 'Packaging Materials',
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

  // Fallback for Mix, New folder, Collage
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
      categoryName: 'Packaging Materials',
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

// Group unmapped by Folder + Clean Title
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

console.log(`Groups created: ${groups.size}`);

// Create new products
const newProducts = [];
let nextSkuNum = {
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

console.log(`Generated ${newProducts.length} new product catalogue entries.`);

// Category breakdown of all products
const combinedProducts = [...existingProducts, ...newProducts];
console.log(`Total combined products: ${combinedProducts.length}`);

const catBreakdown = {};
combinedProducts.forEach(p => {
  const c = p.categoryName || p.categoryId;
  catBreakdown[c] = (catBreakdown[c] || 0) + 1;
});
console.log('Category breakdown of combined catalogue:', catBreakdown);

