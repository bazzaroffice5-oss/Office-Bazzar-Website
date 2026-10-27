-- ====================================================================
-- Office Bazzar — Corrected Catalogue Seed Script (Production Safe)
-- Database: Supabase PostgreSQL (Project: flwuweqvmxxfoyzgsbpi)
-- Generated: 2026-10-27T13:01:12.425Z
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
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('office-stationery', 'Office Stationery', 'office-stationery', 'Wholesale office stationery, registers, paper tag files, box files, staplers, whiteboards, and visual display accessories for corporate workplaces.', '/images/categories/office-supplies-stationery.jpg', 'PenTool', NULL, 1, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('housekeeping-hygiene', 'Housekeeping & Hygiene', 'housekeeping-hygiene', 'Commercial housekeeping equipment, industrial garbage bins, wringer trolleys, cleaning chemicals, Taski solutions, and tissue dispensers.', '/images/categories/housekeeping-hygiene.jpg', 'Sparkles', NULL, 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('printers-technology', 'Printers & Technology', 'printers-technology', 'Laser toner cartridges, barcode printers, commercial paper shredders, currency counting machines, and enterprise IT consumables.', '/images/categories/printers-technology.jpg', 'Printer', NULL, 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('packaging-supplies', 'Packaging Supplies', 'packaging-supplies', 'Industrial packaging tapes, brown carton cello tapes, bubble wraps, air sheets, corrugated boxes, and strapping materials.', '/images/categories/packaging-supplies.jpg', 'Package', NULL, 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-stationery', 'Desk Stationery & Files', 'desk-stationery-files', 'Desk Stationery & Files under Office Stationery', NULL, NULL, 'office-stationery', 10, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-boards', 'Boards & Accessories', 'boards-accessories', 'Boards & Accessories under Office Stationery', NULL, NULL, 'office-stationery', 11, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-display-stand', 'Display Stands & Nameplates', 'display-stands-nameplates', 'Display Stands & Nameplates under Office Stationery', NULL, NULL, 'office-stationery', 12, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-housekeeping', 'Housekeeping Equipment & Tools', 'housekeeping-equipment-tools', 'Housekeeping Equipment & Tools under Housekeeping & Hygiene', NULL, NULL, 'housekeeping-hygiene', 13, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-cleaning-chemicals', 'Cleaning Chemicals & Taski', 'cleaning-chemicals-taski', 'Cleaning Chemicals & Taski under Housekeeping & Hygiene', NULL, NULL, 'housekeeping-hygiene', 14, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-garbage-bin', 'Industrial Garbage Bins', 'industrial-garbage-bins', 'Industrial Garbage Bins under Housekeeping & Hygiene', NULL, NULL, 'housekeeping-hygiene', 15, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-housekeeping-accessories', 'Housekeeping Accessories & Sprays', 'housekeeping-accessories-sprays', 'Housekeeping Accessories & Sprays under Housekeeping & Hygiene', NULL, NULL, 'housekeeping-hygiene', 16, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-tissue-napkin', 'Tissue Paper & Napkins', 'tissue-paper-napkins', 'Tissue Paper & Napkins under Housekeeping & Hygiene', NULL, NULL, 'housekeeping-hygiene', 17, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-printer-cartridges', 'Laser Toners & Cartridges', 'laser-toners-cartridges', 'Laser Toners & Cartridges under Printers & Technology', NULL, NULL, 'printers-technology', 18, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-computer-consumables', 'Computer Consumables & Peripherals', 'computer-consumables-peripherals', 'Computer Consumables & Peripherals under Printers & Technology', NULL, NULL, 'printers-technology', 19, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-shredders-currency', 'Paper Shredders & Currency Counters', 'paper-shredders-currency-counters', 'Paper Shredders & Currency Counters under Printers & Technology', NULL, NULL, 'printers-technology', 20, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-packaging', 'Packaging Materials & Tapes', 'packaging-materials-tapes', 'Packaging Materials & Tapes under Packaging Supplies', NULL, NULL, 'packaging-supplies', 21, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-packaging-tapes', 'Packaging Tapes & Adhesives', 'packaging-tapes-adhesives', 'Packaging Tapes & Adhesives under Packaging Supplies', NULL, NULL, 'packaging-supplies', 22, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;
INSERT INTO categories (id, name, slug, description, image_url, icon, parent_id, display_order, is_active)
VALUES ('cat-protective-materials', 'Protective & Strapping Materials', 'protective-strapping-materials', 'Protective & Strapping Materials under Packaging Supplies', NULL, NULL, 'packaging-supplies', 23, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
    icon = COALESCE(EXCLUDED.icon, categories.icon),
    parent_id = EXCLUDED.parent_id,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;

-- STEP 2: SEED BRANDS (28 Brands)
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-officebazzar', 'OfficeBazzar', 'officebazzar', 'Direct corporate brand procurement and supply.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-officebazzar', 'OfficeBazzar', 'brand-officebazzar', 'Direct corporate brand procurement and supply.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-kangaro', 'Kangaro', 'kangaro', 'Leading manufacturer of staplers, paper punches, and tackers.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-kangaro', 'Kangaro', 'brand-kangaro', 'Leading manufacturer of staplers, paper punches, and tackers.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-nilkamal', 'Nilkamal / Aristo', 'nilkamal', 'Heavy-duty industrial dustbins and material handling equipment.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-nilkamal-aristo', 'Nilkamal / Aristo', 'nilkamal-aristo', 'Heavy-duty industrial dustbins and material handling equipment.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-gobbler', 'Gobbler', 'gobbler', 'Commercial paper shredding and currency counting machinery.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-gobbler', 'Gobbler', 'brand-gobbler', 'Commercial paper shredding and currency counting machinery.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-taski', 'Diversey / Taski', 'taski', 'Professional cleaning chemicals, disinfectants, and housekeeping formulations.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-diversey-taski', 'Diversey / Taski', 'diversey-taski', 'Professional cleaning chemicals, disinfectants, and housekeeping formulations.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-kimberly', 'Kimberly-Clark', 'kimberly-clark', 'Enterprise hygiene tissue dispensers and hand towels.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-kimberly-clark', 'Kimberly-Clark', 'brand-kimberly-clark', 'Enterprise hygiene tissue dispensers and hand towels.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-hp', 'HP', 'hp', 'Enterprise LaserJet toner cartridges and imaging drums.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-hp', 'HP', 'brand-hp', 'Enterprise LaserJet toner cartridges and imaging drums.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-canon', 'Canon', 'canon', 'Genuine laser cartridges and enterprise printing supplies.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-canon', 'Canon', 'brand-canon', 'Genuine laser cartridges and enterprise printing supplies.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('b-alkosign', 'Alkosign', 'alkosign', 'Premium visual communication boards, whiteboards and display stands.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-alkosign', 'Alkosign', 'brand-alkosign', 'Premium visual communication boards, whiteboards and display stands.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-epson', 'Epson', 'epson', 'EcoTank and high-yield enterprise inkjet solutions.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-kent', 'Kent', 'kent', 'Water purification and corporate workplace appliances.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-sandisk', 'SanDisk', 'sandisk', 'High-speed storage, USB flash drives, and data storage solutions.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-innofitt', 'Innofitt', 'innofitt', 'Ergonomic workplace monitor arms and desk cable managers.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-colin', 'Colin', 'colin', 'Commercial glass and smooth surface cleaning formulations.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-dettol', 'Dettol', 'dettol', 'Antiseptic liquids and corporate hand hygiene sanitizers.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-samsung', 'Samsung', 'samsung', 'Commercial displays, memory, and laser toner products.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-vim', 'Vim', 'vim', 'Commercial cafeteria dishwashing and grease removal solutions.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-lizol', 'Lizol', 'lizol', 'Surface floor cleaners and multi-surface disinfectants.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;
INSERT INTO brands (id, name, slug, description, is_featured)
VALUES ('brand-harpic', 'Harpic', 'harpic', 'Restroom and sanitary washroom cleaning chemicals.', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured;

-- STEP 3: SEED PRODUCTS (101 Verified Products with Explicit Review Flags)
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-cardboard-tag-file',
    'Cardboard Tag File',
    'cardboard-tag-file',
    'OB-STA-1001',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-officebazzar',
    'OfficeBazzar',
    'Cardboard Tag File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Cardboard Tag File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/cardboard-tag-file-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Cardboard Tag File | Office Bazzar',
    'Cardboard Tag File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-3025-box-file',
    '3025 Box File',
    '3025-box-file',
    'OB-STA-1002',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-officebazzar',
    'OfficeBazzar',
    '3025 Box File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '3025 Box File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/officebazzar-com-3025-box-file-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    '3025 Box File | Office Bazzar',
    '3025 Box File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-a4-punch-folder',
    'A/4 Punch Folder',
    'a4-punch-folder',
    'OB-STA-1003',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-officebazzar',
    'OfficeBazzar',
    'A/4 Punch Folder supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'A/4 Punch Folder supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/a-4-punch-folder-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'A/4 Punch Folder | Office Bazzar',
    'A/4 Punch Folder supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-a4-report-file',
    'A/4 Report File',
    'a4-report-file',
    'OB-STA-1004',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-officebazzar',
    'OfficeBazzar',
    'A/4 Report File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'A/4 Report File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/a-2f4-report-file-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'A/4 Report File | Office Bazzar',
    'A/4 Report File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-a4-stick-file',
    'A/4 Stick File',
    'a4-stick-file',
    'OB-STA-1005',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-officebazzar',
    'OfficeBazzar',
    'A/4 Stick File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'A/4 Stick File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/a-2f4-stick-file-500x500-1-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'A/4 Stick File | Office Bazzar',
    'A/4 Stick File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-visiting-card-folder',
    'Visiting Card Folder',
    'visiting-card-folder',
    'OB-STA-1006',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-officebazzar',
    'OfficeBazzar',
    'Visiting Card Folder supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Visiting Card Folder supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/visiting-card-folder-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Visiting Card Folder | Office Bazzar',
    'Visiting Card Folder supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-fs-expanding-file',
    'F/S Expanding File',
    'fs-expanding-file',
    'OB-STA-1007',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-officebazzar',
    'OfficeBazzar',
    'F/S Expanding File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'F/S Expanding File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/f-s-expending-file-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'F/S Expanding File | Office Bazzar',
    'F/S Expanding File supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-punching-machine-dp-600-kangaroo',
    'Punching Machine DP 600 Kangaroo',
    'punching-machine-dp-600-kangaroo',
    'OB-STA-1008',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-kangaro',
    'Kangaro',
    'Punching Machine DP 600 Kangaroo supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Punching Machine DP 600 Kangaroo supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/kangaro-punching-machine-dp52-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Punching Machine DP 600 Kangaroo | Office Bazzar',
    'Punching Machine DP 600 Kangaroo supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-kangaro-staplers-hd-10d',
    'Kangaro Staplers HD 10D',
    'kangaro-staplers-hd-10d',
    'OB-STA-1009',
    'office-stationery',
    'Office Stationery',
    'cat-stationery',
    'Desk Stationery & Files',
    'brand-kangaro',
    'Kangaro',
    'Kangaro Staplers HD 10D supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Kangaro Staplers HD 10D supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/staplers-machine-kangaroo-hd-10d-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Kangaro Staplers HD 10D | Office Bazzar',
    'Kangaro Staplers HD 10D supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-white-banian-cloth',
    'White Banian Cloth',
    'white-banian-cloth',
    'OB-HOU-1010',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'White Banian Cloth supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'White Banian Cloth supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/banian-cloth-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'White Banian Cloth | Office Bazzar',
    'White Banian Cloth supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-scrubbing-pad',
    'Scrubbing Pad',
    'scrubbing-pad',
    'OB-HOU-1011',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Scrubbing Pad supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Scrubbing Pad supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/scrubbing-pad-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Scrubbing Pad | Office Bazzar',
    'Scrubbing Pad supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-housekeeping-cleaning-chemicals',
    'Housekeeping Cleaning Chemicals',
    'housekeeping-cleaning-chemicals',
    'OB-HOU-1012',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Housekeeping Cleaning Chemicals supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Housekeeping Cleaning Chemicals supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/housekeeping-cleaning-chemicals-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Housekeeping Cleaning Chemicals | Office Bazzar',
    'Housekeeping Cleaning Chemicals supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-tissue-paper-napkin',
    'Tissue Paper Napkin',
    'tissue-paper-napkin',
    'OB-HOU-1013',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Tissue Paper Napkin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Tissue Paper Napkin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/house-keeping-items-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Tissue Paper Napkin | Office Bazzar',
    'Tissue Paper Napkin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-table-wiper',
    'Table Wiper',
    'table-wiper',
    'OB-HOU-1014',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Table Wiper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Table Wiper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/table-wiper-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Table Wiper | Office Bazzar',
    'Table Wiper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-toilet-cleaning-brush',
    'Toilet Cleaning Brush',
    'toilet-cleaning-brush',
    'OB-HOU-1015',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Toilet Cleaning Brush supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Toilet Cleaning Brush supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/toilet-cleaning-brush-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Toilet Cleaning Brush | Office Bazzar',
    'Toilet Cleaning Brush supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-checked-cloth',
    'Checked Cloth',
    'checked-cloth',
    'OB-HOU-1016',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Checked Cloth supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Checked Cloth supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/checked-cloth-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Checked Cloth | Office Bazzar',
    'Checked Cloth supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-rubber-gloves',
    'Rubber Gloves',
    'rubber-gloves',
    'OB-HOU-1017',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Rubber Gloves supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Rubber Gloves supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/rubber-gloves-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Rubber Gloves | Office Bazzar',
    'Rubber Gloves supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-kangaro-staplers-hd-10d-1',
    'Kangaro Staplers HD 10D',
    'kangaro-staplers-hd-10d-1',
    'OB-HOU-1018',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-kangaro',
    'Kangaro',
    'Kangaro Staplers HD 10D supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Kangaro Staplers HD 10D supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/staplers-machine-kangaroo-hd-10d-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Kangaro Staplers HD 10D | Office Bazzar',
    'Kangaro Staplers HD 10D supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-glass-wiper',
    'Glass Wiper',
    'glass-wiper',
    'OB-HOU-1019',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Glass Wiper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Glass Wiper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/glass-wiper-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Glass Wiper | Office Bazzar',
    'Glass Wiper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-caddy-basket',
    'Caddy Basket',
    'caddy-basket',
    'OB-HOU-1020',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Caddy Basket supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Caddy Basket supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/caddy-basket-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Caddy Basket | Office Bazzar',
    'Caddy Basket supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-wringer-trolley',
    'Wringer Trolley',
    'wringer-trolley',
    'OB-HOU-1021',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Wringer Trolley supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Wringer Trolley supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/wringer-trolley-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Wringer Trolley | Office Bazzar',
    'Wringer Trolley supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-stainess-steel-hand-soap-dispenser',
    'Stainess Steel Hand Soap Dispenser',
    'stainess-steel-hand-soap-dispenser',
    'OB-HOU-1022',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Stainess Steel Hand Soap Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Stainess Steel Hand Soap Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/stainess-steel-handwash-dispenser-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Stainess Steel Hand Soap Dispenser | Office Bazzar',
    'Stainess Steel Hand Soap Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-abs-hand-dryer-machine',
    'ABS Hand Dryer Machine',
    'abs-hand-dryer-machine',
    'OB-HOU-1023',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'ABS Hand Dryer Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'ABS Hand Dryer Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/abs-hand-dryer-machine-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'ABS Hand Dryer Machine | Office Bazzar',
    'ABS Hand Dryer Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-stainless-steel-hand-dryer-machine',
    'Stainless Steel Hand Dryer Machine',
    'stainless-steel-hand-dryer-machine',
    'OB-HOU-1024',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Stainless Steel Hand Dryer Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Stainless Steel Hand Dryer Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/stainless-steel-hand-dryer-machine-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Stainless Steel Hand Dryer Machine | Office Bazzar',
    'Stainless Steel Hand Dryer Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-air-freshener-dispenser-led',
    'Air Freshener Dispenser LED',
    'air-freshener-dispenser-led',
    'OB-HOU-1025',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Air Freshener Dispenser LED supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Air Freshener Dispenser LED supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/air-freshner-dispenser-led-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Air Freshener Dispenser LED | Office Bazzar',
    'Air Freshener Dispenser LED supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-copper-water-bottle',
    'Copper Water Bottle',
    'copper-water-bottle',
    'OB-HOU-1026',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Copper Water Bottle supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Copper Water Bottle supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/copper-water-bottle-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Copper Water Bottle | Office Bazzar',
    'Copper Water Bottle supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-toilet-roll-dispenser',
    'Toilet Roll Dispenser',
    'toilet-roll-dispenser',
    'OB-HOU-1027',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping',
    'Housekeeping Equipment & Tools',
    'brand-officebazzar',
    'OfficeBazzar',
    'Toilet Roll Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Toilet Roll Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/toilet-roll-dispenser-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Toilet Roll Dispenser | Office Bazzar',
    'Toilet Roll Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-stainless-steel-dustbin',
    'Stainless Steel Dustbin',
    'stainless-steel-dustbin',
    'OB-GAR-1028',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-garbage-bin',
    'Industrial Garbage Bins',
    'brand-officebazzar',
    'OfficeBazzar',
    'Stainless Steel Dustbin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Stainless Steel Dustbin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/stainless-steel-dustbin-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Stainless Steel Dustbin | Office Bazzar',
    'Stainless Steel Dustbin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-aristo-wheeled-dust-bin-120-litre-with-pedal',
    'Aristo Wheeled Dust Bin 120 Litre With Pedal',
    'aristo-wheeled-dust-bin-120-litre-with-pedal',
    'OB-GAR-1029',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-garbage-bin',
    'Industrial Garbage Bins',
    'brand-nilkamal-aristo',
    'Nilkamal / Aristo',
    'Aristo Wheeled Dust Bin 120 Litre With Pedal supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Aristo Wheeled Dust Bin 120 Litre With Pedal supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/nilkamal-120-litres-dustbin-wb120l1-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Aristo Wheeled Dust Bin 120 Litre With Pedal | Office Bazzar',
    'Aristo Wheeled Dust Bin 120 Litre With Pedal supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-green-biodegradable-garbage-bag',
    'Green Biodegradable Garbage Bag',
    'green-biodegradable-garbage-bag',
    'OB-GAR-1030',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-garbage-bin',
    'Industrial Garbage Bins',
    'brand-officebazzar',
    'OfficeBazzar',
    'Green Biodegradable Garbage Bag supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Green Biodegradable Garbage Bag supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/green-biodegradable-garbage-bag-500x500-2.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Green Biodegradable Garbage Bag | Office Bazzar',
    'Green Biodegradable Garbage Bag supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-garbage-bag-small',
    'Garbage Bag - Small',
    'garbage-bag-small',
    'OB-GAR-1031',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-garbage-bin',
    'Industrial Garbage Bins',
    'brand-officebazzar',
    'OfficeBazzar',
    'Garbage Bag - Small supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Garbage Bag - Small supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/garbage-bag-small-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Garbage Bag - Small | Office Bazzar',
    'Garbage Bag - Small supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-silver-stainless-steel-ss-lobby-ashtray-bin-capacity-8x24',
    'Silver Stainless Steel SS Lobby Ashtray Bin, Capacity: 8x24',
    'silver-stainless-steel-ss-lobby-ashtray-bin-capacity-8x24',
    'OB-GAR-1032',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-garbage-bin',
    'Industrial Garbage Bins',
    'brand-officebazzar',
    'OfficeBazzar',
    'Silver Stainless Steel SS Lobby Ashtray Bin, Capacity: 8x24 supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Silver Stainless Steel SS Lobby Ashtray Bin, Capacity: 8x24 supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chen',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/s-s-lobby-ash-tray-bin-14-x-28-500x500-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Silver Stainless Steel SS Lobby Ashtray Bin, Capacity: 8x24 | Office Bazzar',
    'Silver Stainless Steel SS Lobby Ashtray Bin, Capacity: 8x24 supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-cartoon-character-dustbin',
    'Cartoon Character Dustbin',
    'cartoon-character-dustbin',
    'OB-GAR-1033',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-garbage-bin',
    'Industrial Garbage Bins',
    'brand-officebazzar',
    'OfficeBazzar',
    'Cartoon Character Dustbin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Cartoon Character Dustbin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/cartoon-character-dustbin-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Cartoon Character Dustbin | Office Bazzar',
    'Cartoon Character Dustbin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-external-hard-disk',
    'External Hard Disk',
    'external-hard-disk',
    'OB-COM-1034',
    'printers-technology',
    'Printers & Technology',
    'cat-computer-consumables',
    'Computer Consumables & Peripherals',
    'brand-officebazzar',
    'OfficeBazzar',
    'External Hard Disk supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'External Hard Disk supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/external-hard-disk-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'External Hard Disk | Office Bazzar',
    'External Hard Disk supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-epson-ecotank-l6160-wi-fi-duplex-multi-function-ink-tank-printer',
    'Epson Ecotank L6160 Wi-Fi Duplex Multi Function Ink Tank Printer',
    'epson-ecotank-l6160-wi-fi-duplex-multi-function-ink-tank-printer',
    'OB-COM-1035',
    'printers-technology',
    'Printers & Technology',
    'cat-computer-consumables',
    'Computer Consumables & Peripherals',
    'brand-epson',
    'Epson',
    'Epson Ecotank L6160 Wi-Fi Duplex Multi Function Ink Tank Printer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Epson Ecotank L6160 Wi-Fi Duplex Multi Function Ink Tank Printer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/epson-l6170-wi-fi-duplex-multifunction-inktank-printer-with-adf-500x500-1-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Epson Ecotank L6160 Wi-Fi Duplex Multi Function Ink Tank Printer | Office Bazzar',
    'Epson Ecotank L6160 Wi-Fi Duplex Multi Function Ink Tank Printer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-kent-ks-12-lamination-machine',
    'Kent KS 12 Lamination Machine',
    'kent-ks-12-lamination-machine',
    'OB-COM-1036',
    'printers-technology',
    'Printers & Technology',
    'cat-computer-consumables',
    'Computer Consumables & Peripherals',
    'brand-kent',
    'Kent',
    'Kent KS 12 Lamination Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Kent KS 12 Lamination Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/kent-ks-12-lamination-machine-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Kent KS 12 Lamination Machine | Office Bazzar',
    'Kent KS 12 Lamination Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-keyboard-tray-metal',
    'Keyboard Tray Metal',
    'keyboard-tray-metal',
    'OB-COM-1037',
    'printers-technology',
    'Printers & Technology',
    'cat-computer-consumables',
    'Computer Consumables & Peripherals',
    'brand-officebazzar',
    'OfficeBazzar',
    'Keyboard Tray Metal supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Keyboard Tray Metal supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/keyboard-drawer-metal-19-innofitt-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Keyboard Tray Metal | Office Bazzar',
    'Keyboard Tray Metal supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-sandisk-pen-drive',
    'SanDisk Pen Drive',
    'sandisk-pen-drive',
    'OB-COM-1038',
    'printers-technology',
    'Printers & Technology',
    'cat-computer-consumables',
    'Computer Consumables & Peripherals',
    'brand-sandisk',
    'SanDisk',
    'SanDisk Pen Drive supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'SanDisk Pen Drive supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/16-gb-pen-drive-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'SanDisk Pen Drive | Office Bazzar',
    'SanDisk Pen Drive supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-spiral-binding-machine',
    'spiral binding machine',
    'spiral-binding-machine',
    'OB-COM-1039',
    'printers-technology',
    'Printers & Technology',
    'cat-computer-consumables',
    'Computer Consumables & Peripherals',
    'brand-officebazzar',
    'OfficeBazzar',
    'spiral binding machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'spiral binding machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/whatsapp-image-2021-03-10-at-11-16-31-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'spiral binding machine | Office Bazzar',
    'spiral binding machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-barcode-printer',
    'Barcode Printer',
    'barcode-printer',
    'OB-COM-1040',
    'printers-technology',
    'Printers & Technology',
    'cat-computer-consumables',
    'Computer Consumables & Peripherals',
    'brand-officebazzar',
    'OfficeBazzar',
    'Barcode Printer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Barcode Printer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/canon-mk2500-ferrule-printer-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Barcode Printer | Office Bazzar',
    'Barcode Printer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-adaptor-cable',
    'Adaptor Cable',
    'adaptor-cable',
    'OB-COM-1041',
    'printers-technology',
    'Printers & Technology',
    'cat-computer-consumables',
    'Computer Consumables & Peripherals',
    'brand-officebazzar',
    'OfficeBazzar',
    'Adaptor Cable supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Adaptor Cable supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/adaptor-cable-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Adaptor Cable | Office Bazzar',
    'Adaptor Cable supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-white-board-for-school',
    'White Board For School',
    'white-board-for-school',
    'OB-BOA-1042',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-officebazzar',
    'OfficeBazzar',
    'White Board For School supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'White Board For School supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/white-board-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'White Board For School | Office Bazzar',
    'White Board For School supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-golden-letter-for-welcome-board',
    'Golden Letter for Welcome Board',
    'golden-letter-for-welcome-board',
    'OB-BOA-1043',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-officebazzar',
    'OfficeBazzar',
    'Golden Letter for Welcome Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Golden Letter for Welcome Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/golden-letter-for-welcome-board-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Golden Letter for Welcome Board | Office Bazzar',
    'Golden Letter for Welcome Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-alkosign-motorized-dependent-up-down-boards',
    'Alkosign Motorized Dependent Up Down Boards',
    'alkosign-motorized-dependent-up-down-boards',
    'OB-BOA-1044',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-alkosign',
    'Alkosign',
    'Alkosign Motorized Dependent Up Down Boards supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Alkosign Motorized Dependent Up Down Boards supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/alkosign-motorised-dependent-up-down-boards-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Alkosign Motorized Dependent Up Down Boards | Office Bazzar',
    'Alkosign Motorized Dependent Up Down Boards supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-alkosign-horizontal-sliding-board',
    'Alkosign Horizontal Sliding Board',
    'alkosign-horizontal-sliding-board',
    'OB-BOA-1045',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-alkosign',
    'Alkosign',
    'Alkosign Horizontal Sliding Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Alkosign Horizontal Sliding Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/alkosign-horizantal-sliding-board-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Alkosign Horizontal Sliding Board | Office Bazzar',
    'Alkosign Horizontal Sliding Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-pin-up-notice-board',
    'Pin Up / Notice Board',
    'pin-up-notice-board',
    'OB-BOA-1046',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-officebazzar',
    'OfficeBazzar',
    'Pin Up / Notice Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Pin Up / Notice Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/pin-up-notice-board-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Pin Up / Notice Board | Office Bazzar',
    'Pin Up / Notice Board supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-alkosign-pegboard',
    'Alkosign Pegboard',
    'alkosign-pegboard',
    'OB-BOA-1047',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-alkosign',
    'Alkosign',
    'Alkosign Pegboard supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Alkosign Pegboard supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/alkosign-pegboard-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Alkosign Pegboard | Office Bazzar',
    'Alkosign Pegboard supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-ms-black-magazine-rack',
    'Ms Black Magazine Rack',
    'ms-black-magazine-rack',
    'OB-BOA-1048',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-officebazzar',
    'OfficeBazzar',
    'Ms Black Magazine Rack supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Ms Black Magazine Rack supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/magazine-stand-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Ms Black Magazine Rack | Office Bazzar',
    'Ms Black Magazine Rack supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-white-board-duster',
    'White Board Duster',
    'white-board-duster',
    'OB-BOA-1049',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-officebazzar',
    'OfficeBazzar',
    'White Board Duster supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'White Board Duster supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/white-board-duster-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'White Board Duster | Office Bazzar',
    'White Board Duster supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-a4-display-folders',
    'A4 Display Folders',
    'a4-display-folders',
    'OB-BOA-1050',
    'office-stationery',
    'Office Stationery',
    'cat-boards',
    'Boards & Accessories',
    'brand-officebazzar',
    'OfficeBazzar',
    'A4 Display Folders supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'A4 Display Folders supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/boards-and-accessories-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'A4 Display Folders | Office Bazzar',
    'A4 Display Folders supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-cello-tape',
    'Cello Tape',
    'cello-tape',
    'OB-PAC-1051',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-packaging-tapes',
    'Packaging Tapes & Adhesives',
    'brand-officebazzar',
    'OfficeBazzar',
    'Cello Tape supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Cello Tape supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/cello-tape-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Cello Tape | Office Bazzar',
    'Cello Tape supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-cello-brown-tape',
    'Cello Brown Tape',
    'cello-brown-tape',
    'OB-PAC-1052',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-packaging-tapes',
    'Packaging Tapes & Adhesives',
    'brand-officebazzar',
    'OfficeBazzar',
    'Cello Brown Tape supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Cello Brown Tape supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/cello-brown-tape-2-inch-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Cello Brown Tape | Office Bazzar',
    'Cello Brown Tape supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-floor-marking-tapes',
    'Floor Marking Tapes',
    'floor-marking-tapes',
    'OB-PAC-1053',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-packaging-tapes',
    'Packaging Tapes & Adhesives',
    'brand-officebazzar',
    'OfficeBazzar',
    'Floor Marking Tapes supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Floor Marking Tapes supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/floor-masking-tapes-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Floor Marking Tapes | Office Bazzar',
    'Floor Marking Tapes supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-bubble-sheet',
    'Bubble Sheet',
    'bubble-sheet',
    'OB-PAC-1054',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-protective-materials',
    'Protective & Strapping Materials',
    'brand-officebazzar',
    'OfficeBazzar',
    'Bubble Sheet supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Bubble Sheet supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/bubble-sheet-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Bubble Sheet | Office Bazzar',
    'Bubble Sheet supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-foam-thermocol',
    'Foam Thermocol',
    'foam-thermocol',
    'OB-PAC-1055',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-protective-materials',
    'Protective & Strapping Materials',
    'brand-officebazzar',
    'OfficeBazzar',
    'Foam Thermocol supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Foam Thermocol supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/foam-and-thermocol-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Foam Thermocol | Office Bazzar',
    'Foam Thermocol supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-packing-patti-roll',
    'Packing Patti Roll',
    'packing-patti-roll',
    'OB-PAC-1056',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-protective-materials',
    'Protective & Strapping Materials',
    'brand-officebazzar',
    'OfficeBazzar',
    'Packing Patti Roll supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Packing Patti Roll supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/packing-patti-roll-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Packing Patti Roll | Office Bazzar',
    'Packing Patti Roll supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-magic-tape-with-dispenser',
    'Magic Tape With Dispenser',
    'magic-tape-with-dispenser',
    'OB-PAC-1057',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-packaging-tapes',
    'Packaging Tapes & Adhesives',
    'brand-officebazzar',
    'OfficeBazzar',
    'Magic Tape With Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Magic Tape With Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/magic-tape-with-dispenser-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Magic Tape With Dispenser | Office Bazzar',
    'Magic Tape With Dispenser supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-paper-cutter-big',
    'Paper Cutter Big',
    'paper-cutter-big',
    'OB-PAC-1058',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-protective-materials',
    'Protective & Strapping Materials',
    'brand-officebazzar',
    'OfficeBazzar',
    'Paper Cutter Big supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Paper Cutter Big supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/paper-cutter-big-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Paper Cutter Big | Office Bazzar',
    'Paper Cutter Big supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-gum-paste',
    'Gum Paste',
    'gum-paste',
    'OB-PAC-1059',
    'packaging-supplies',
    'Packaging Supplies',
    'cat-packaging-tapes',
    'Packaging Tapes & Adhesives',
    'brand-officebazzar',
    'OfficeBazzar',
    'Gum Paste supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Gum Paste supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/paste-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Gum Paste | Office Bazzar',
    'Gum Paste supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-double-sided-newspaper-stand',
    'Double Sided Newspaper Stand',
    'double-sided-newspaper-stand',
    'OB-DIS-1060',
    'office-stationery',
    'Office Stationery',
    'cat-display-stand',
    'Display Stands & Nameplates',
    'brand-officebazzar',
    'OfficeBazzar',
    'Double Sided Newspaper Stand supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Double Sided Newspaper Stand supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/double-sided-newspaper-stand-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Double Sided Newspaper Stand | Office Bazzar',
    'Double Sided Newspaper Stand supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-wooden-stand-for-boards',
    'Wooden Stand for Boards',
    'wooden-stand-for-boards',
    'OB-DIS-1061',
    'office-stationery',
    'Office Stationery',
    'cat-display-stand',
    'Display Stands & Nameplates',
    'brand-officebazzar',
    'OfficeBazzar',
    'Wooden Stand for Boards supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Wooden Stand for Boards supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/wooden-stand-for-boards-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Wooden Stand for Boards | Office Bazzar',
    'Wooden Stand for Boards supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-tripod-stand',
    'Tripod Stand',
    'tripod-stand',
    'OB-DIS-1062',
    'office-stationery',
    'Office Stationery',
    'cat-display-stand',
    'Display Stands & Nameplates',
    'brand-officebazzar',
    'OfficeBazzar',
    'Tripod Stand supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Tripod Stand supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/tripod-stand-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Tripod Stand | Office Bazzar',
    'Tripod Stand supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-name-plate-plain-innofitt',
    'Name Plate Plain -Innofitt',
    'name-plate-plain-innofitt',
    'OB-DIS-1063',
    'office-stationery',
    'Office Stationery',
    'cat-display-stand',
    'Display Stands & Nameplates',
    'brand-innofitt',
    'Innofitt',
    'Name Plate Plain -Innofitt supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Name Plate Plain -Innofitt supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/name-plate-innofitt-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Name Plate Plain -Innofitt | Office Bazzar',
    'Name Plate Plain -Innofitt supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-gobbler-gs8cd-paper-shredding-machine',
    'Gobbler GS8CD Paper Shredding Machine',
    'gobbler-gs8cd-paper-shredding-machine',
    'OB-SHR-1064',
    'printers-technology',
    'Printers & Technology',
    'cat-shredders-currency',
    'Paper Shredders & Currency Counters',
    'brand-gobbler',
    'Gobbler',
    'Gobbler GS8CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Gobbler GS8CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/gobbler-gs8cd-paper-shredding-machine-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Gobbler GS8CD Paper Shredding Machine | Office Bazzar',
    'Gobbler GS8CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-gobbler-gs15cd-paper-shredding-machine',
    'Gobbler GS15CD Paper Shredding Machine',
    'gobbler-gs15cd-paper-shredding-machine',
    'OB-SHR-1065',
    'printers-technology',
    'Printers & Technology',
    'cat-shredders-currency',
    'Paper Shredders & Currency Counters',
    'brand-gobbler',
    'Gobbler',
    'Gobbler GS15CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Gobbler GS15CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/gobbler-gs15cd-paper-shredding-machine-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Gobbler GS15CD Paper Shredding Machine | Office Bazzar',
    'Gobbler GS15CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-gobbler-a2326-paper-shredding-machine',
    'Gobbler A2326 Paper Shredding Machine',
    'gobbler-a2326-paper-shredding-machine',
    'OB-SHR-1066',
    'printers-technology',
    'Printers & Technology',
    'cat-shredders-currency',
    'Paper Shredders & Currency Counters',
    'brand-gobbler',
    'Gobbler',
    'Gobbler A2326 Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Gobbler A2326 Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/gobbler-a2326-paper-shredding-machine-500x500-1.jpg"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Gobbler A2326 Paper Shredding Machine | Office Bazzar',
    'Gobbler A2326 Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-gobbler-s3135-heavy-duty-paper-shredding-machine',
    'Gobbler S3135 Heavy Duty Paper Shredding Machine',
    'gobbler-s3135-heavy-duty-paper-shredding-machine',
    'OB-SHR-1067',
    'printers-technology',
    'Printers & Technology',
    'cat-shredders-currency',
    'Paper Shredders & Currency Counters',
    'brand-gobbler',
    'Gobbler',
    'Gobbler S3135 Heavy Duty Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Gobbler S3135 Heavy Duty Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/gobbler-s3135-heavy-duty-paper-shredding-machine-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Gobbler S3135 Heavy Duty Paper Shredding Machine | Office Bazzar',
    'Gobbler S3135 Heavy Duty Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-gobbler-gs-10-cd-paper-shredding-machine',
    'Gobbler GS 10 CD Paper Shredding Machine',
    'gobbler-gs-10-cd-paper-shredding-machine',
    'OB-SHR-1068',
    'printers-technology',
    'Printers & Technology',
    'cat-shredders-currency',
    'Paper Shredders & Currency Counters',
    'brand-gobbler',
    'Gobbler',
    'Gobbler GS 10 CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Gobbler GS 10 CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/gobbler-gs10cd-paper-shredding-machine-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Gobbler GS 10 CD Paper Shredding Machine | Office Bazzar',
    'Gobbler GS 10 CD Paper Shredding Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-gobbler-px9900-currency-counting-machine',
    'Gobbler PX9900 Currency Counting Machine',
    'gobbler-px9900-currency-counting-machine',
    'OB-SHR-1069',
    'printers-technology',
    'Printers & Technology',
    'cat-shredders-currency',
    'Paper Shredders & Currency Counters',
    'brand-gobbler',
    'Gobbler',
    'Gobbler PX9900 Currency Counting Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Gobbler PX9900 Currency Counting Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/gobbler-px9900-currency-counting-machine-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Gobbler PX9900 Currency Counting Machine | Office Bazzar',
    'Gobbler PX9900 Currency Counting Machine supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-royal-napkins',
    'Royal Napkins',
    'royal-napkins',
    'OB-HOU-1070',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping-accessories',
    'Housekeeping Accessories & Sprays',
    'brand-officebazzar',
    'OfficeBazzar',
    'Royal Napkins supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Royal Napkins supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/royal-napkins-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Royal Napkins | Office Bazzar',
    'Royal Napkins supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-colin-glass-cleaner-500-ml',
    'Colin Glass Cleaner 500 Ml',
    'colin-glass-cleaner-500-ml',
    'OB-HOU-1071',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping-accessories',
    'Housekeeping Accessories & Sprays',
    'brand-colin',
    'Colin',
    'Colin Glass Cleaner 500 Ml supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Colin Glass Cleaner 500 Ml supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/colin-glass-cleaner-500-ml-500x500-1.webp"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Colin Glass Cleaner 500 Ml | Office Bazzar',
    'Colin Glass Cleaner 500 Ml supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-plastic-storage-box',
    'Plastic Storage Box',
    'plastic-storage-box',
    'OB-HOU-1072',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping-accessories',
    'Housekeeping Accessories & Sprays',
    'brand-officebazzar',
    'OfficeBazzar',
    'Plastic Storage Box supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Plastic Storage Box supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/plastic-storage-box-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Plastic Storage Box | Office Bazzar',
    'Plastic Storage Box supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-butter-paper',
    'Butter Paper',
    'butter-paper',
    'OB-HOU-1073',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping-accessories',
    'Housekeeping Accessories & Sprays',
    'brand-officebazzar',
    'OfficeBazzar',
    'Butter Paper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Butter Paper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/butter-paper-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Butter Paper | Office Bazzar',
    'Butter Paper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-dettol-disinfectant-spray',
    'Dettol Disinfectant Spray',
    'dettol-disinfectant-spray',
    'OB-HOU-1074',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-housekeeping-accessories',
    'Housekeeping Accessories & Sprays',
    'brand-dettol',
    'Dettol',
    'Dettol Disinfectant Spray supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Dettol Disinfectant Spray supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/dettol-disinfectant-spray-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Dettol Disinfectant Spray | Office Bazzar',
    'Dettol Disinfectant Spray supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-best-print-12a-compatible-toner-cartridge',
    'Best Print 12A Compatible Toner Cartridge',
    'best-print-12a-compatible-toner-cartridge',
    'OB-PRI-1075',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-officebazzar',
    'OfficeBazzar',
    'Best Print 12A Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Best Print 12A Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/best-print-12a-compatible-toner-cartridge-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Best Print 12A Compatible Toner Cartridge | Office Bazzar',
    'Best Print 12A Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-canon-ep-303-toner-cartridge',
    'Canon EP 303 Toner Cartridge',
    'canon-ep-303-toner-cartridge',
    'OB-PRI-1076',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-canon',
    'Canon',
    'Canon EP 303 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Canon EP 303 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/canon-ep-303-toner-cartridge-500x500-1.webp"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Canon EP 303 Toner Cartridge | Office Bazzar',
    'Canon EP 303 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-canon-308-toner-cartridge',
    'Canon 308 Toner Cartridge',
    'canon-308-toner-cartridge',
    'OB-PRI-1077',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-canon',
    'Canon',
    'Canon 308 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Canon 308 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/canon-308-toner-cartridge-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Canon 308 Toner Cartridge | Office Bazzar',
    'Canon 308 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-label-cartridges',
    'Label Cartridges',
    'label-cartridges',
    'OB-PRI-1078',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-officebazzar',
    'OfficeBazzar',
    'Label Cartridges supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Label Cartridges supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/dymo-label-cartridges-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Label Cartridges | Office Bazzar',
    'Label Cartridges supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-canon-refilling-cartridge',
    'Canon Refilling Cartridge',
    'canon-refilling-cartridge',
    'OB-PRI-1079',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-canon',
    'Canon',
    'Canon Refilling Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Canon Refilling Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/canon-refilling-catridge-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Canon Refilling Cartridge | Office Bazzar',
    'Canon Refilling Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-compatible-toner-cartridge',
    'Compatible Toner Cartridge',
    'compatible-toner-cartridge',
    'OB-PRI-1080',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-officebazzar',
    'OfficeBazzar',
    'Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/cf403a-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Compatible Toner Cartridge | Office Bazzar',
    'Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-samsung-mlt-d116s-black-toner-cartridge-packaging-type-box',
    'Samsung MLT-D116S Black Toner Cartridge, Packaging Type: Box',
    'samsung-mlt-d116s-black-toner-cartridge-packaging-type-box',
    'OB-PRI-1081',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-samsung',
    'Samsung',
    'Samsung MLT-D116S Black Toner Cartridge, Packaging Type: Box supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Samsung MLT-D116S Black Toner Cartridge, Packaging Type: Box supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Che',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/samsung-mlt-d116s-black-toner-cartridge-500x500-a-500x500-1.webp"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Samsung MLT-D116S Black Toner Cartridge, Packaging Type: Box | Office Bazzar',
    'Samsung MLT-D116S Black Toner Cartridge, Packaging Type: Box supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-hp-126a-laser-jet-toner-cartridge',
    'HP 126A Laser Jet Toner Cartridge',
    'hp-126a-laser-jet-toner-cartridge',
    'OB-PRI-1082',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-hp',
    'HP',
    'HP 126A Laser Jet Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'HP 126A Laser Jet Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/hp-126a-laserjet-toner-cartridge-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'HP 126A Laser Jet Toner Cartridge | Office Bazzar',
    'HP 126A Laser Jet Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-canon-npg-51-toner-cartridge',
    'Canon Npg 51 Toner Cartridge',
    'canon-npg-51-toner-cartridge',
    'OB-PRI-1083',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-canon',
    'Canon',
    'Canon Npg 51 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Canon Npg 51 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/npg-51-compatible-toner-cartridge-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Canon Npg 51 Toner Cartridge | Office Bazzar',
    'Canon Npg 51 Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-best-print-88a-compatible-toner-cartridge',
    'Best Print 88A Compatible Toner Cartridge',
    'best-print-88a-compatible-toner-cartridge',
    'OB-PRI-1084',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-officebazzar',
    'OfficeBazzar',
    'Best Print 88A Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Best Print 88A Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/best-india-print-88a-compatible-toner-cartridge-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Best Print 88A Compatible Toner Cartridge | Office Bazzar',
    'Best Print 88A Compatible Toner Cartridge supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-hp-802-small-black-ink-cartridge-ch561zz',
    'HP 802 Small Black Ink Cartridge - CH561ZZ',
    'hp-802-small-black-ink-cartridge-ch561zz',
    'OB-PRI-1085',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-hp',
    'HP',
    'HP 802 Small Black Ink Cartridge - CH561ZZ supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'HP 802 Small Black Ink Cartridge - CH561ZZ supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/hp-802-small-black-ink-cartridge-ch561zz-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'HP 802 Small Black Ink Cartridge - CH561ZZ | Office Bazzar',
    'HP 802 Small Black Ink Cartridge - CH561ZZ supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-hp-678-tri-color-ink-cartridge-cz108aa',
    'HP 678 Tri-Color Ink Cartridge - CZ108AA',
    'hp-678-tri-color-ink-cartridge-cz108aa',
    'OB-PRI-1086',
    'printers-technology',
    'Printers & Technology',
    'cat-printer-cartridges',
    'Laser Toners & Cartridges',
    'brand-hp',
    'HP',
    'HP 678 Tri-Color Ink Cartridge - CZ108AA supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'HP 678 Tri-Color Ink Cartridge - CZ108AA supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2022/12/hp-678-tri-color-ink-cartridge-cz108aa-500x500-1.webp"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'HP 678 Tri-Color Ink Cartridge - CZ108AA | Office Bazzar',
    'HP 678 Tri-Color Ink Cartridge - CZ108AA supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-taski-r4-furniture-maintainer',
    'Taski R4 Furniture Maintainer',
    'taski-r4-furniture-maintainer',
    'OB-CLE-1087',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-diversey-taski',
    'Diversey Taski',
    'Taski R4 Furniture Maintainer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Taski R4 Furniture Maintainer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/taski-r4-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Taski R4 Furniture Maintainer | Office Bazzar',
    'Taski R4 Furniture Maintainer supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-taski-r6-toilet-cleaner',
    'Taski R6 Toilet Cleaner',
    'taski-r6-toilet-cleaner',
    'OB-CLE-1088',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-diversey-taski',
    'Diversey Taski',
    'Taski R6 Toilet Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Taski R6 Toilet Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/taski-r6-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Taski R6 Toilet Cleaner | Office Bazzar',
    'Taski R6 Toilet Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-liquid-white-phenyl',
    'Liquid White Phenyl',
    'liquid-white-phenyl',
    'OB-CLE-1089',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-officebazzar',
    'OfficeBazzar',
    'Liquid White Phenyl supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Liquid White Phenyl supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/liquid-white-phenyl-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Liquid White Phenyl | Office Bazzar',
    'Liquid White Phenyl supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-humic-acid-liquid',
    'Humic Acid Liquid',
    'humic-acid-liquid',
    'OB-CLE-1090',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-officebazzar',
    'OfficeBazzar',
    'Humic Acid Liquid supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Humic Acid Liquid supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/liquid-acid-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Humic Acid Liquid | Office Bazzar',
    'Humic Acid Liquid supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-vim-liquid-dish-wash',
    'Vim Liquid Dish Wash',
    'vim-liquid-dish-wash',
    'OB-CLE-1091',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-vim',
    'Vim',
    'Vim Liquid Dish Wash supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Vim Liquid Dish Wash supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/vim-liquid-dish-wash-500x500-1.webp"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Vim Liquid Dish Wash | Office Bazzar',
    'Vim Liquid Dish Wash supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-lizol-liquid-cleaner',
    'Lizol Liquid Cleaner',
    'lizol-liquid-cleaner',
    'OB-CLE-1092',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-lizol',
    'Lizol',
    'Lizol Liquid Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Lizol Liquid Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/lizol-liquid-cleaner-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Lizol Liquid Cleaner | Office Bazzar',
    'Lizol Liquid Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-harpic-toilet-cleaner',
    'Harpic Toilet Cleaner',
    'harpic-toilet-cleaner',
    'OB-CLE-1093',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-harpic',
    'Harpic',
    'Harpic Toilet Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Harpic Toilet Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/harpic-toilet-cleaner-500-ml-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Harpic Toilet Cleaner | Office Bazzar',
    'Harpic Toilet Cleaner supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-hi-clean-floor-cleaner-5-ltr',
    'Hi Clean Floor Cleaner 5 ltr',
    'hi-clean-floor-cleaner-5-ltr',
    'OB-CLE-1094',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-officebazzar',
    'OfficeBazzar',
    'Hi Clean Floor Cleaner 5 ltr supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Hi Clean Floor Cleaner 5 ltr supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/hi-clean-floor-cleaner-5-ltr-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Hi Clean Floor Cleaner 5 ltr | Office Bazzar',
    'Hi Clean Floor Cleaner 5 ltr supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-hi-clean-liquid-soap-oil',
    'Hi Clean Liquid Soap Oil',
    'hi-clean-liquid-soap-oil',
    'OB-CLE-1095',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-cleaning-chemicals',
    'Cleaning Chemicals & Taski',
    'brand-officebazzar',
    'OfficeBazzar',
    'Hi Clean Liquid Soap Oil supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Hi Clean Liquid Soap Oil supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/hi-clean-liquid-soap-1-ltr-500x500-1.jpg"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Hi Clean Liquid Soap Oil | Office Bazzar',
    'Hi Clean Liquid Soap Oil supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-tissue-paper-napkin-1',
    'Tissue Paper Napkin',
    'tissue-paper-napkin-1',
    'OB-TIS-1096',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-tissue-napkin',
    'Tissue Paper & Napkins',
    'brand-officebazzar',
    'OfficeBazzar',
    'Tissue Paper Napkin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Tissue Paper Napkin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/tissue-paper-napkin-500x500-1.webp"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Tissue Paper Napkin | Office Bazzar',
    'Tissue Paper Napkin supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-royal-napkins-tissue-paper',
    'Royal Napkins Tissue Paper',
    'royal-napkins-tissue-paper',
    'OB-TIS-1097',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-tissue-napkin',
    'Tissue Paper & Napkins',
    'brand-officebazzar',
    'OfficeBazzar',
    'Royal Napkins Tissue Paper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Royal Napkins Tissue Paper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/royal-napkins-tissue-paper-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Royal Napkins Tissue Paper | Office Bazzar',
    'Royal Napkins Tissue Paper supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-c-fold-tissue',
    'C Fold Tissue',
    'c-fold-tissue',
    'OB-TIS-1098',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-tissue-napkin',
    'Tissue Paper & Napkins',
    'brand-officebazzar',
    'OfficeBazzar',
    'C Fold Tissue supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'C Fold Tissue supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/c-fold-tissue-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'C Fold Tissue | Office Bazzar',
    'C Fold Tissue supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-m-fold-tissue',
    'M Fold Tissue',
    'm-fold-tissue',
    'OB-TIS-1099',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-tissue-napkin',
    'Tissue Paper & Napkins',
    'brand-officebazzar',
    'OfficeBazzar',
    'M Fold Tissue supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'M Fold Tissue supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/m-fold-tissue-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'M Fold Tissue | Office Bazzar',
    'M Fold Tissue supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-kimsoft-smile-c-fold-towels-180-towels-30-sleeves-031500',
    'KIMSOFT Smile C Fold Towels 180 Towels 30 Sleeves 031500',
    'kimsoft-smile-c-fold-towels-180-towels-30-sleeves-031500',
    'OB-TIS-1100',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-tissue-napkin',
    'Tissue Paper & Napkins',
    'brand-kimberly-clark',
    'Kimberly-Clark',
    'KIMSOFT Smile C Fold Towels 180 Towels 30 Sleeves 031500 supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'KIMSOFT Smile C Fold Towels 180 Towels 30 Sleeves 031500 supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/kimsoft-smile-c-fold-towels-180-towels-30-sleeves-031500-500x500-1.webp"]'::jsonb,
    TRUE,
    FALSE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'KIMSOFT Smile C Fold Towels 180 Towels 30 Sleeves 031500 | Office Bazzar',
    'KIMSOFT Smile C Fold Towels 180 Towels 30 Sleeves 031500 supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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
INSERT INTO products (
    id, name, slug, sku, category_id, category_name, subcategory_id, subcategory_name,
    brand_id, brand_name, description, short_description, specifications, price, mrp,
    gst_percent, hsn_code, stock_quantity, min_order_quantity, pack_size, images,
    is_featured, is_bestseller, is_active, is_price_verified, requires_manual_review,
    rating, review_count, meta_title, meta_description
) VALUES (
    'prod-toilet-roll-big',
    'Toilet Roll Big',
    'toilet-roll-big',
    'OB-TIS-1101',
    'housekeeping-hygiene',
    'Housekeeping & Hygiene',
    'cat-tissue-napkin',
    'Tissue Paper & Napkins',
    'brand-officebazzar',
    'OfficeBazzar',
    'Toilet Roll Big supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    'Toilet Roll Big supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.',
    '{"pricing_model":"B2B Request for Quotation (RFQ)","pricing_status":"Unpublished on official source website. Manual quotation required."}'::jsonb,
    NULL, -- Price unverified / RFQ model (NOT 0)
    NULL, -- MRP unverified (NOT 0)
    18,
    NULL,
    0,    -- Stock unverified / on-demand B2B procurement
    1,
    'Standard Pack',
    '["https://officebazzar.co.in/wp-content/uploads/2023/01/toilet-roll-big-500x500-1.webp"]'::jsonb,
    TRUE,
    TRUE,
    TRUE,
    FALSE, -- is_price_verified: explicitly marked false
    TRUE,  -- requires_manual_review: flagged for administrative review
    NULL,  -- No fabricated star rating
    0,     -- No fabricated review count
    'Toilet Roll Big | Office Bazzar',
    'Toilet Roll Big supplied by OfficeBazzar for corporate offices, enterprises, and facility managers in Chennai.'
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

COMMIT;

-- Verify final counts and audit review status
SELECT 
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM brands) as total_brands,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM products WHERE price IS NOT NULL) as products_with_price,
    (SELECT COUNT(*) FROM products WHERE requires_manual_review = TRUE) as products_requiring_review;
