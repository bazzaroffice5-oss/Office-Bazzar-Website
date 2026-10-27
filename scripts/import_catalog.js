/**
 * Office Bazzar — Resumable Server-Side Catalogue Importer
 * Safely imports categories, brands, and products into Supabase PostgreSQL.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to avoid external dependencies
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        env[key] = val;
      }
    }
  }
  return env;
}

const env = loadEnvLocal();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://flwuweqvmxxfoyzgsbpi.supabase.co';
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3zHbO8CzsmLRXN4bo0a8hA_cNwBA0jq';
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

// Load data prepared in generator
const catalogContent = fs.readFileSync('src/lib/data/catalog.ts', 'utf8');

const catMapMatch = catalogContent.match(/export const CATEGORY_MAP:[\s\S]*?=\s*(\{[\s\S]*?\n\};)/);
let categoryMap = {};
if (catMapMatch) {
  categoryMap = (new Function(`return ${catMapMatch[1].replace(/;$/, '')}`))();
}

const rawChunk = catalogContent.slice(
  catalogContent.indexOf('const RAW_PRODUCTS: Product[] = ['),
  catalogContent.indexOf('export const INITIAL_PRODUCTS: Product[]')
);
const rawJsonStr = rawChunk.replace('const RAW_PRODUCTS: Product[] = ', '').trim();
const rawProducts = JSON.parse(rawJsonStr.endsWith(';') ? rawJsonStr.slice(0, -1) : rawJsonStr);

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

const allCategories = [...mainCategories, ...subcategories];

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

async function checkDatabaseState(client) {
  const { count: catCount, error: catErr } = await client.from('categories').select('*', { count: 'exact', head: true });
  const { count: brandCount, error: brandErr } = await client.from('brands').select('*', { count: 'exact', head: true });
  const { count: prodCount, error: prodErr } = await client.from('products').select('*', { count: 'exact', head: true });

  return {
    categories: catCount ?? 0,
    brands: brandCount ?? 0,
    products: prodCount ?? 0,
    errors: {
      categories: catErr ? catErr.message : null,
      brands: brandErr ? brandErr.message : null,
      products: prodErr ? prodErr.message : null
    }
  };
}

async function main() {
  console.log('====================================================');
  console.log('Office Bazzar — Catalogue Import & Status Verifier');
  console.log('====================================================');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Publishable Key Present: ${Boolean(publishableKey)}`);
  console.log(`Service Role Key Present: ${Boolean(serviceRoleKey)}`);

  // 1. Check current public database state
  const publicClient = createClient(supabaseUrl, publishableKey);
  const initialState = await checkDatabaseState(publicClient);
  console.log('\nCurrent Database Counts (via Public Client):');
  console.log(`- Categories in DB: ${initialState.categories}`);
  console.log(`- Brands in DB:     ${initialState.brands}`);
  console.log(`- Products in DB:   ${initialState.products}`);

  if (initialState.products > 0 && initialState.categories > 0) {
    console.log('\n[SUCCESS] Supabase database already contains imported catalogue records!');
    console.log(`Verified counts: ${initialState.categories} categories, ${initialState.brands} brands, ${initialState.products} products.`);
    return;
  }

  // 2. If Service Role Key is available, perform programmatic import
  if (serviceRoleKey) {
    console.log('\n[PROCEEDING] Using SUPABASE_SERVICE_ROLE_KEY to perform privileged import...');
    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Step 2a: Small Validation Batch
    console.log('\n--- Step 1: Running Small Validation Batch ---');
    const valCategory = mainCategories[0];
    const valBrand = allBrands[0];
    const valProduct = initialProducts[0];

    console.log(`Testing category upsert: "${valCategory.name}" (${valCategory.id})...`);
    const { error: valCatErr } = await adminClient.from('categories').upsert(valCategory, { onConflict: 'id' });
    if (valCatErr) throw new Error(`Validation batch category failed: ${valCatErr.message}`);

    console.log(`Testing brand upsert: "${valBrand.name}" (${valBrand.id})...`);
    const { error: valBrandErr } = await adminClient.from('brands').upsert(valBrand, { onConflict: 'id' });
    if (valBrandErr) throw new Error(`Validation batch brand failed: ${valBrandErr.message}`);

    console.log(`Testing product upsert: "${valProduct.name}" (${valProduct.sku})...`);
    const { error: valProdErr } = await adminClient.from('products').upsert({
      id: valProduct.id,
      name: valProduct.name,
      slug: valProduct.slug,
      sku: valProduct.sku,
      category_id: valProduct.categoryId,
      category_name: valProduct.categoryName,
      subcategory_id: valProduct.subcategoryId,
      subcategory_name: valProduct.subcategoryName,
      brand_id: valProduct.brandId,
      brand_name: valProduct.brandName,
      description: valProduct.description,
      short_description: valProduct.shortDescription || valProduct.description.slice(0, 150),
      specifications: {
        ...(valProduct.specifications || {}),
        pricing_model: 'B2B Request for Quotation (RFQ)',
        pricing_status: 'Unpublished on official source. Manual quotation required.'
      },
      price: null,
      mrp: null,
      gst_percent: Number(valProduct.gstPercent || 18),
      hsn_code: valProduct.hsnCode || null,
      stock_quantity: 0,
      min_order_quantity: Number(valProduct.minOrderQuantity || 1),
      pack_size: valProduct.packSize || '1 Unit',
      images: Array.isArray(valProduct.images) ? valProduct.images : [],
      is_featured: Boolean(valProduct.featured),
      is_bestseller: Boolean(valProduct.bestseller),
      is_active: valProduct.isActive !== false,
      is_price_verified: false,
      requires_manual_review: true,
      rating: null,
      review_count: 0,
      meta_title: valProduct.metaTitle || `${valProduct.name} | Office Bazzar`,
      meta_description: valProduct.metaDescription || valProduct.description.slice(0, 160)
    }, { onConflict: 'sku' });
    if (valProdErr) throw new Error(`Validation batch product failed: ${valProdErr.message}`);

    console.log('[PASSED] Validation batch succeeded! Proceeding with full catalogue import...');

    // Step 2b: Import All Categories
    console.log(`\n--- Step 2: Upserting ${allCategories.length} Categories ---`);
    let importedCategories = 0;
    for (const cat of allCategories) {
      const { error } = await adminClient.from('categories').upsert(cat, { onConflict: 'id' });
      if (error) console.error(`Failed category ${cat.id}:`, error.message);
      else importedCategories++;
    }
    console.log(`Categories imported: ${importedCategories}/${allCategories.length}`);

    // Step 2c: Import All Brands
    console.log(`\n--- Step 3: Upserting ${allBrands.length} Brands ---`);
    let importedBrands = 0;
    for (const b of allBrands) {
      const { error } = await adminClient.from('brands').upsert(b, { onConflict: 'id' });
      if (error) console.error(`Failed brand ${b.id}:`, error.message);
      else importedBrands++;
    }
    console.log(`Brands imported: ${importedBrands}/${allBrands.length}`);

    // Step 2d: Import All Products in Batches
    console.log(`\n--- Step 4: Upserting ${initialProducts.length} Products ---`);
    let importedProducts = 0;
    let failedProducts = 0;
    const chunkSize = 20;

    for (let i = 0; i < initialProducts.length; i += chunkSize) {
      const chunk = initialProducts.slice(i, i + chunkSize);
      const rows = chunk.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        category_id: p.categoryId,
        category_name: p.categoryName,
        subcategory_id: p.subcategoryId,
        subcategory_name: p.subcategoryName,
        brand_id: p.brandId,
        brand_name: p.brandName,
        description: p.description,
        short_description: p.shortDescription || p.description.slice(0, 150),
        specifications: {
          ...(p.specifications || {}),
          pricing_model: 'B2B Request for Quotation (RFQ)',
          pricing_status: 'Unpublished on official source. Manual quotation required.'
        },
        price: null,
        mrp: null,
        gst_percent: Number(p.gstPercent || 18),
        hsn_code: p.hsnCode || null,
        stock_quantity: 0,
        min_order_quantity: Number(p.minOrderQuantity || 1),
        pack_size: p.packSize || '1 Unit',
        images: Array.isArray(p.images) ? p.images : [],
        is_featured: Boolean(p.featured),
        is_bestseller: Boolean(p.bestseller),
        is_active: p.isActive !== false,
        is_price_verified: false,
        requires_manual_review: true,
        rating: null,
        review_count: 0,
        meta_title: p.metaTitle || `${p.name} | Office Bazzar`,
        meta_description: p.metaDescription || p.description.slice(0, 160)
      }));

      const { error } = await adminClient.from('products').upsert(rows, { onConflict: 'sku' });
      if (error) {
        console.error(`Error in batch ${i} to ${i + rows.length}:`, error.message);
        failedProducts += rows.length;
      } else {
        importedProducts += rows.length;
        console.log(`Progress: ${importedProducts}/${initialProducts.length} products upserted.`);
      }
    }

    // Step 2e: Final Verification
    const finalState = await checkDatabaseState(publicClient);
    console.log('\n====================================================');
    console.log('FINAL IMPORT AUDIT REPORT:');
    console.log(`- Verified Source Products: ${initialProducts.length}`);
    console.log(`- Imported Products:        ${importedProducts}`);
    console.log(`- Failed Products:          ${failedProducts}`);
    console.log(`- Categories in DB:         ${finalState.categories}`);
    console.log(`- Brands in DB:             ${finalState.brands}`);
    console.log(`- Products in DB:           ${finalState.products}`);
    console.log('====================================================');
  } else {
    // Service role key is not set
    console.log('\n[NOTICE] Privileged SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local.');
    console.log('Row Level Security (RLS) prevents anonymous publishable keys from writing to catalog tables.');
    console.log('\nYou have TWO simple, secure ways to import the catalogue:');
    console.log('----------------------------------------------------');
    console.log('OPTION A (Recommended & Fastest — 5 seconds):');
    console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/flwuweqvmxxfoyzgsbpi');
    console.log('2. Navigate to SQL Editor.');
    console.log('3. Open or paste: supabase/seed_catalog.sql');
    console.log('4. Click "Run". It will idempotently insert all 18 categories, 28 brands, and 101 products.');
    console.log('----------------------------------------------------');
    console.log('OPTION B (Script-Based):');
    console.log('1. Add your service role key to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    console.log('2. Re-run: node scripts/import_catalog.js');
    console.log('----------------------------------------------------');
  }
}

main().catch(err => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
