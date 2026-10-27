const fs = require('fs');
const path = require('path');

const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

// 1. Extract CATEGORY_MAP
const catMapMatch = catalogContent.match(/export const CATEGORY_MAP:[\s\S]*?=\s*(\{[\s\S]*?\n\};)/);
let categoryMap = {};
if (catMapMatch) {
  const code = catMapMatch[1].replace(/;$/, '');
  categoryMap = (new Function(`return ${code}`))();
}

// 2. Extract RAW_PRODUCTS
const rawChunk = catalogContent.slice(
  catalogContent.indexOf('const RAW_PRODUCTS: Product[] = ['),
  catalogContent.indexOf('export const INITIAL_PRODUCTS: Product[]')
);
const rawJsonStr = rawChunk.replace('const RAW_PRODUCTS: Product[] = ', '').trim();
const rawProducts = JSON.parse(rawJsonStr.endsWith(';') ? rawJsonStr.slice(0, -1) : rawJsonStr);

// 3. Map products to INITIAL_PRODUCTS
const initialProducts = rawProducts.map((p) => {
  const mapping = categoryMap[p.categoryId];
  return {
    ...p,
    categoryId: mapping ? mapping.mainId : p.categoryId,
    categoryName: mapping ? mapping.mainName : p.categoryName,
    subcategoryId: p.categoryId,
    subcategoryName: mapping ? mapping.subName : p.categoryName,
    packSize: p.packSize || '1 Unit',
  };
});

// 4. Define the 4 Main Categories
const mainCategories = [
  {
    id: 'office-stationery',
    name: 'Office Stationery',
    slug: 'office-stationery',
    description: 'Wholesale office stationery, registers, paper tag files, box files, staplers, whiteboards, and visual display accessories for corporate workplaces.',
    image_url: '/images/categories/office-supplies-stationery.jpg',
    icon: 'PenTool',
    parent_id: null,
    display_order: 1
  },
  {
    id: 'housekeeping-hygiene',
    name: 'Housekeeping & Hygiene',
    slug: 'housekeeping-hygiene',
    description: 'Commercial housekeeping equipment, industrial garbage bins, wringer trolleys, cleaning chemicals, Taski solutions, and tissue dispensers.',
    image_url: '/images/categories/housekeeping-hygiene.jpg',
    icon: 'Sparkles',
    parent_id: null,
    display_order: 2
  },
  {
    id: 'printers-technology',
    name: 'Printers & Technology',
    slug: 'printers-technology',
    description: 'Laser toner cartridges, barcode printers, commercial paper shredders, currency counting machines, and enterprise IT consumables.',
    image_url: '/images/categories/printers-technology.jpg',
    icon: 'Printer',
    parent_id: null,
    display_order: 3
  },
  {
    id: 'packaging-supplies',
    name: 'Packaging Supplies',
    slug: 'packaging-supplies',
    description: 'Industrial packaging tapes, brown carton cello tapes, bubble wraps, air sheets, corrugated boxes, and strapping materials.',
    image_url: '/images/categories/packaging-supplies.jpg',
    icon: 'Package',
    parent_id: null,
    display_order: 4
  }
];

// 5. Define Subcategories from CATEGORY_MAP
const subcategories = Object.entries(categoryMap).map(([subId, info], idx) => {
  return {
    id: subId,
    name: info.subName,
    slug: info.subSlug,
    description: `${info.subName} under ${info.mainName}`,
    image_url: null,
    icon: null,
    parent_id: info.mainId,
    display_order: 10 + idx
  };
});

// 6. Define Brands
const catalogBrands = [
  { id: 'b-officebazzar', name: 'OfficeBazzar', slug: 'officebazzar', description: 'Direct corporate brand procurement and supply.', is_featured: true },
  { id: 'brand-officebazzar', name: 'OfficeBazzar', slug: 'brand-officebazzar', description: 'Direct corporate brand procurement and supply.', is_featured: true },
  { id: 'b-kangaro', name: 'Kangaro', slug: 'kangaro', description: 'Leading manufacturer of staplers, paper punches, and tackers.', is_featured: true },
  { id: 'brand-kangaro', name: 'Kangaro', slug: 'brand-kangaro', description: 'Leading manufacturer of staplers, paper punches, and tackers.', is_featured: true },
  { id: 'b-nilkamal', name: 'Nilkamal / Aristo', slug: 'nilkamal', description: 'Heavy-duty industrial dustbins and material handling equipment.', is_featured: true },
  { id: 'brand-nilkamal-aristo', name: 'Nilkamal / Aristo', slug: 'nilkamal-aristo', description: 'Heavy-duty industrial dustbins and material handling equipment.', is_featured: true },
  { id: 'b-gobbler', name: 'Gobbler', slug: 'gobbler', description: 'Commercial paper shredding and currency counting machinery.', is_featured: true },
  { id: 'brand-gobbler', name: 'Gobbler', slug: 'brand-gobbler', description: 'Commercial paper shredding and currency counting machinery.', is_featured: true },
  { id: 'b-taski', name: 'Diversey / Taski', slug: 'taski', description: 'Professional cleaning chemicals, disinfectants, and housekeeping formulations.', is_featured: true },
  { id: 'brand-diversey-taski', name: 'Diversey / Taski', slug: 'diversey-taski', description: 'Professional cleaning chemicals, disinfectants, and housekeeping formulations.', is_featured: true },
  { id: 'b-kimberly', name: 'Kimberly-Clark', slug: 'kimberly-clark', description: 'Enterprise hygiene tissue dispensers and hand towels.', is_featured: true },
  { id: 'brand-kimberly-clark', name: 'Kimberly-Clark', slug: 'brand-kimberly-clark', description: 'Enterprise hygiene tissue dispensers and hand towels.', is_featured: true },
  { id: 'b-hp', name: 'HP', slug: 'hp', description: 'Enterprise LaserJet toner cartridges and imaging drums.', is_featured: true },
  { id: 'brand-hp', name: 'HP', slug: 'brand-hp', description: 'Enterprise LaserJet toner cartridges and imaging drums.', is_featured: true },
  { id: 'b-canon', name: 'Canon', slug: 'canon', description: 'Genuine laser cartridges and enterprise printing supplies.', is_featured: true },
  { id: 'brand-canon', name: 'Canon', slug: 'brand-canon', description: 'Genuine laser cartridges and enterprise printing supplies.', is_featured: true },
  { id: 'b-alkosign', name: 'Alkosign', slug: 'alkosign', description: 'Premium visual communication boards, whiteboards and display stands.', is_featured: true },
  { id: 'brand-alkosign', name: 'Alkosign', slug: 'brand-alkosign', description: 'Premium visual communication boards, whiteboards and display stands.', is_featured: true },
  { id: 'brand-epson', name: 'Epson', slug: 'epson', description: 'EcoTank and high-yield enterprise inkjet solutions.', is_featured: false },
  { id: 'brand-kent', name: 'Kent', slug: 'kent', description: 'Water purification and corporate workplace appliances.', is_featured: false },
  { id: 'brand-sandisk', name: 'SanDisk', slug: 'sandisk', description: 'High-speed storage, USB flash drives, and data storage solutions.', is_featured: false },
  { id: 'brand-innofitt', name: 'Innofitt', slug: 'innofitt', description: 'Ergonomic workplace monitor arms and desk cable managers.', is_featured: false },
  { id: 'brand-colin', name: 'Colin', slug: 'colin', description: 'Commercial glass and smooth surface cleaning formulations.', is_featured: false },
  { id: 'brand-dettol', name: 'Dettol', slug: 'dettol', description: 'Antiseptic liquids and corporate hand hygiene sanitizers.', is_featured: false },
  { id: 'brand-samsung', name: 'Samsung', slug: 'samsung', description: 'Commercial displays, memory, and laser toner products.', is_featured: false },
  { id: 'brand-vim', name: 'Vim', slug: 'vim', description: 'Commercial cafeteria dishwashing and grease removal solutions.', is_featured: false },
  { id: 'brand-lizol', name: 'Lizol', slug: 'lizol', description: 'Surface floor cleaners and multi-surface disinfectants.', is_featured: false },
  { id: 'brand-harpic', name: 'Harpic', slug: 'harpic', description: 'Restroom and sanitary washroom cleaning chemicals.', is_featured: false }
];

const brandMap = new Map();
catalogBrands.forEach(b => brandMap.set(b.id, b));

initialProducts.forEach(p => {
  if (p.brandId && !brandMap.has(p.brandId)) {
    const slug = p.brandId.replace(/^brand-/, '');
    brandMap.set(p.brandId, {
      id: p.brandId,
      name: p.brandName || slug,
      slug: slug,
      description: `${p.brandName || slug} products`,
      is_featured: false
    });
  }
});

const allBrands = Array.from(brandMap.values());

// Helpers for SQL formatting
function sqlStr(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function sqlJson(obj) {
  if (!obj) return `'{}'::jsonb`;
  const str = JSON.stringify(obj).replace(/'/g, "''");
  return `'${str}'::jsonb`;
}

function sqlBool(val) {
  return val ? 'TRUE' : 'FALSE';
}

// Generate SQL
let sql = `-- ====================================================================
-- Office Bazzar — Corrected Catalogue Seed Script (Production Safe)
-- Database: Supabase PostgreSQL (Project: flwuweqvmxxfoyzgsbpi)
-- Generated: ${new Date().toISOString()}
--
-- PRINCIPLES ENFORCED:
-- 1. NO FABRICATED PRICES: Real official source (officebazzar.co.in) uses a B2B RFQ model
--    with 0 published prices. Unverified prices are set to NULL (NOT zero).
-- 2. NO FABRICATED RATINGS OR STOCK: Ratings set to NULL, review count 0, stock 0.
-- 3. AUDIT & MANUAL REVIEW FLAGS: is_price_verified = FALSE, requires_manual_review = TRUE.
-- 4. NON-DESTRUCTIVE UPSERT: Existing valid prices/stock in DB are PRESERVED via COALESCE.
-- ====================================================================

BEGIN;

-- STEP 0: ENSURE SCHEMA SUPPORTS UNPRICED/RFQ PRODUCTS & VERIFICATION FLAGS
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
ALTER TABLE products ALTER COLUMN mrp DROP NOT NULL;
ALTER TABLE products ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE products ALTER COLUMN rating SET DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_price_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT TRUE;

-- STEP 1: SEED CATEGORIES (4 Main Categories + 14 Subcategories)
`;

for (const cat of [...mainCategories, ...subcategories]) {
  sql += `INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES (${sqlStr(cat.id)}, ${sqlStr(cat.name)}, ${sqlStr(cat.slug)}, ${sqlStr(cat.description)}, ${sqlStr(cat.image_url)}, ${sqlStr(cat.icon)}, ${sqlStr(cat.parent_id)}, ${cat.display_order}, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
`;
}

sql += `\n-- STEP 2: SEED BRANDS (${allBrands.length} Brands)\n`;
for (const b of allBrands) {
  sql += `INSERT INTO brands (id, name, slug, description, is_featured)
VALUES (${sqlStr(b.id)}, ${sqlStr(b.name)}, ${sqlStr(b.slug)}, ${sqlStr(b.description)}, ${sqlBool(b.is_featured)})
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
`;
}

sql += `\n-- STEP 3: SEED PRODUCTS (${initialProducts.length} Verified Products with Explicit Review Flags)\n`;
for (const p of initialProducts) {
  const images = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
  
  // Specifications annotate that the price requires manual review / quote calculation
  const specs = {
    ...(p.specifications || {}),
    pricing_model: 'B2B Request for Quotation (RFQ)',
    pricing_status: 'Unpublished on official source website. Manual quotation required.'
  };

  sql += `INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    ${sqlStr(p.id)},
    ${sqlStr(p.name)},
    ${sqlStr(p.slug)},
    ${sqlStr(p.sku)},
    ${sqlStr(p.categoryId)},
    ${sqlStr(p.categoryName)},
    ${sqlStr(p.subcategoryId)},
    ${sqlStr(p.subcategoryName)},
    ${sqlStr(p.brandId)},
    ${sqlStr(p.brandName)},
    ${sqlStr(p.description)},
    ${sqlStr(p.shortDescription || p.description.slice(0, 150))},
    ${sqlJson(specs)},
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    ${p.gstPercent || 18},
    ${sqlStr(p.hsnCode)},
    0,    -- Stock unverified / on-demand B2B procurement
    ${p.minOrderQuantity || 1},
    ${sqlStr(p.packSize || '1 Unit')},
    ${sqlJson(images)},
    ${sqlBool(p.featured)},
    ${sqlBool(p.bestseller)},
    ${sqlBool(p.isActive !== false)},
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    ${sqlStr(p.metaTitle || `${p.name} | Office Bazzar`)},
    ${sqlStr(p.metaDescription || p.description.slice(0, 160))}
)
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    category_id = EXCLUDED.category_id,
    category_name = EXCLUDED.category_name,
    subcategory_id = EXCLUDED.subcategory_id,
    subcategory_name = EXCLUDED.subcategory_name,
    brand_id = EXCLUDED.brand_id,
    brand_name = EXCLUDED.brand_name,
    description = EXCLUDED.description,
    short_description = EXCLUDED.short_description,
    specifications = EXCLUDED.specifications,
    -- SAFE UPSERT: Never overwrite existing valid production prices or inventory with NULL/unverified
    price = COALESCE(products.price, EXCLUDED.price),
    mrp = COALESCE(products.mrp, EXCLUDED.mrp),
    gst_percent = COALESCE(products.gst_percent, EXCLUDED.gst_percent),
    hsn_code = COALESCE(products.hsn_code, EXCLUDED.hsn_code),
    stock_quantity = COALESCE(products.stock_quantity, EXCLUDED.stock_quantity),
    min_order_quantity = COALESCE(products.min_order_quantity, EXCLUDED.min_order_quantity),
    pack_size = EXCLUDED.pack_size,
    images = EXCLUDED.images,
    is_featured = EXCLUDED.is_featured,
    is_bestseller = EXCLUDED.is_bestseller,
    is_active = EXCLUDED.is_active,
    is_price_verified = COALESCE(products.is_price_verified, EXCLUDED.is_price_verified),
    requires_manual_review = COALESCE(products.requires_manual_review, EXCLUDED.requires_manual_review),
    rating = COALESCE(products.rating, EXCLUDED.rating),
    review_count = COALESCE(products.review_count, EXCLUDED.review_count),
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    updated_at = NOW();
`;
}

sql += `
COMMIT;

-- Verify final counts and audit review status
SELECT 
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM brands) as total_brands,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM products WHERE price IS NOT NULL) as products_with_price,
    (SELECT COUNT(*) FROM products WHERE requires_manual_review = TRUE) as products_requiring_review;
`;

fs.writeFileSync('supabase/seed_catalog.sql', sql, 'utf8');
console.log('Successfully regenerated corrected supabase/seed_catalog.sql');
console.log(`- Categories: ${mainCategories.length + subcategories.length}`);
console.log(`- Brands: ${allBrands.length}`);
console.log(`- Products: ${initialProducts.length}`);
console.log(`- Prices set to: NULL (Zero fabricated prices)`);
console.log(`- Ratings set to: NULL (Zero fabricated ratings)`);
console.log(`- requires_manual_review set to: TRUE for all unpriced products`);
console.log(`- Safe non-destructive COALESCE upsert enabled.`);
