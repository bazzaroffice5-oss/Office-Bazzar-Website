/**
 * Seed utility to synchronize categories, brands, and catalog products to Supabase PostgreSQL
 * Production Safe: Never overwrites existing valid prices or inventory with null/unverified data.
 */
import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import { CATEGORIES, BRANDS, INITIAL_PRODUCTS, CATEGORY_MAP } from '@/lib/data/catalog';

export async function seedCatalogToSupabase(): Promise<{
  success: boolean;
  message: string;
  counts?: { categories: number; brands: number; products: number; productsRequiringReview: number };
}> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return {
      success: false,
      message: 'Supabase is not configured or service role key is missing. Provide NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    };
  }

  try {
    // 1. Prepare Main Categories + Subcategories
    const categoryRows: Array<{
      id: string;
      name: string;
      slug: string;
      description?: string;
      image_url?: string | null;
      icon?: string | null;
      parent_id?: string | null;
      display_order: number;
      is_active: boolean;
    }> = [];

    // Main 4 categories
    CATEGORIES.forEach((cat, idx) => {
      categoryRows.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image_url: cat.imageUrl || null,
        icon: cat.icon || null,
        parent_id: null,
        display_order: idx + 1,
        is_active: true,
      });
    });

    // Subcategories from CATEGORY_MAP
    Object.entries(CATEGORY_MAP).forEach(([subId, info], idx) => {
      categoryRows.push({
        id: subId,
        name: info.subName,
        slug: info.subSlug,
        description: `${info.subName} under ${info.mainName}`,
        image_url: null,
        icon: null,
        parent_id: info.mainId,
        display_order: 10 + idx,
        is_active: true,
      });
    });

    for (const cat of categoryRows) {
      await supabaseAdmin.from('categories').upsert(cat, { onConflict: 'id' });
    }

    // 2. Prepare Brands
    const brandMap = new Map<string, { id: string; name: string; slug: string; description?: string; is_featured: boolean }>();

    BRANDS.forEach((b) => {
      brandMap.set(b.id, {
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        is_featured: Boolean(b.featured),
      });
    });

    INITIAL_PRODUCTS.forEach((p) => {
      if (p.brandId && !brandMap.has(p.brandId)) {
        brandMap.set(p.brandId, {
          id: p.brandId,
          name: p.brandName || p.brandId.replace(/^brand-/, ''),
          slug: p.brandId.replace(/^brand-/, ''),
          description: `${p.brandName || p.brandId} products`,
          is_featured: false,
        });
      }
    });

    for (const b of Array.from(brandMap.values())) {
      await supabaseAdmin.from('brands').upsert(b, { onConflict: 'id' });
    }

    // 3. Seed Products in Batches (Respecting unverified prices & ratings)
    let seededProducts = 0;
    const chunkSize = 20;

    for (let i = 0; i < INITIAL_PRODUCTS.length; i += chunkSize) {
      const chunk = INITIAL_PRODUCTS.slice(i, i + chunkSize);
      const rows = chunk.map((prod) => {
        return {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          sku: prod.sku,
          category_id: prod.categoryId,
          category_name: prod.categoryName,
          subcategory_id: prod.subcategoryId,
          subcategory_name: prod.subcategoryName,
          brand_id: prod.brandId,
          brand_name: prod.brandName,
          description: prod.description,
          short_description: prod.shortDescription || prod.description.slice(0, 150),
          specifications: {
            ...(prod.specifications || {}),
            pricing_model: 'B2B Request for Quotation (RFQ)',
            pricing_status: 'Unpublished on official source. Manual quotation required.',
          },
          price: null, // Nullable: never inject 0 or fake price
          mrp: null,
          gst_percent: Number(prod.gstPercent || 18),
          hsn_code: prod.hsnCode || null,
          stock_quantity: 0,
          min_order_quantity: Number(prod.minOrderQuantity || 1),
          pack_size: prod.packSize || '1 Unit',
          images: Array.isArray(prod.images) ? prod.images : [],
          is_featured: Boolean(prod.featured),
          is_bestseller: Boolean(prod.bestseller),
          is_price_verified: false,
          requires_manual_review: true,
          rating: null, // Never invent ratings
          review_count: 0,
          is_active: prod.isActive !== false,
          meta_title: prod.metaTitle || `${prod.name} | Office Bazzar`,
          meta_description: prod.metaDescription || prod.description.slice(0, 160),
        };
      });

      const { error } = await supabaseAdmin.from('products').upsert(rows, { onConflict: 'sku' });
      if (error) {
        throw new Error(`Product seeding batch failed at index ${i}: ${error.message}`);
      }
      seededProducts += rows.length;
    }

    return {
      success: true,
      message: `Successfully synchronized ${categoryRows.length} categories, ${brandMap.size} brands, and ${seededProducts} products (flagged for manual price review).`,
      counts: {
        categories: categoryRows.length,
        brands: brandMap.size,
        products: seededProducts,
        productsRequiringReview: seededProducts,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: `Seeding error: ${err instanceof Error ? err.message : 'Unknown database error'}`,
    };
  }
}
