import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getProductAdminSession } from '@/lib/product-admin/auth';
import { getProductsFromZoho, createZohoProduct, updateProductInLiveCache, invalidateZohoProductCache } from '@/lib/zoho/products';
import { saveProduct } from '@/lib/db/store';
import { saveProductImage } from '@/lib/products/image-store';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getProductAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.toLowerCase().trim() || '';
    const category = searchParams.get('category')?.toLowerCase().trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));

    const isForceRefresh = searchParams.get('refresh') === 'true';
    const allProducts = await getProductsFromZoho(isForceRefresh);

    let filtered = allProducts;
    if (query) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.brandName?.toLowerCase().includes(query) ||
          p.categoryName?.toLowerCase().includes(query)
      );
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(
        (p) =>
          p.categoryId?.toLowerCase() === category ||
          p.categoryName?.toLowerCase() === category
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filtered.slice(startIndex, startIndex + limit);

    // Compute real metrics directly from Zoho CRM catalog records (zero hardcoded counts)
    const totalCount = allProducts.length;
    const publishedCount = allProducts.filter((p) => p.isActive === true && (p as any).publishStatus !== 'draft' && (p as any).publishStatus !== 'unpublished').length;
    const draftCount = allProducts.filter((p) => (p as any).publishStatus === 'draft').length;
    const unpublishedCount = allProducts.filter((p) => (p as any).publishStatus === 'unpublished' || (p.isActive === false && (p as any).publishStatus !== 'draft')).length;

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentlyAddedCount = allProducts.filter((p) => {
      const t = p.createdAt || (p as any).createdTime;
      return t ? new Date(t).getTime() > thirtyDaysAgo : false;
    }).length;
    const recentlyUpdatedCount = allProducts.filter((p) => {
      const t = p.updatedAt || (p as any).modifiedTime;
      return t ? new Date(t).getTime() > thirtyDaysAgo : false;
    }).length;

    // Recently added: top 10 products
    const recentlyAdded = allProducts.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      categoryName: p.categoryName,
      price: p.price,
    }));

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      metrics: {
        totalProducts: totalCount,
        publishedProducts: publishedCount,
        draftProducts: draftCount,
        unpublishedProducts: unpublishedCount,
        recentlyAddedProducts: recentlyAddedCount,
        recentlyUpdatedProducts: recentlyUpdatedCount,
        // Backwards compatibility aliases
        activeProducts: publishedCount,
        recentlyAddedCount,
        recentlyUpdatedCount,
      },
      recentlyAdded,
    });
  } catch (error) {
    console.error('[Product Admin API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve products from Zoho CRM.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getProductAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let productData: Partial<Product> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const name = formData.get('name') as string;
      const sku = formData.get('sku') as string;
      const categoryId = formData.get('categoryId') as string;
      const categoryName = formData.get('categoryName') as string;
      const subcategoryId = formData.get('subcategoryId') as string;
      const subcategoryName = formData.get('subcategoryName') as string;
      const brandName = formData.get('brandName') as string;
      const packSize = formData.get('packSize') as string;
      const description = formData.get('description') as string;
      const price = formData.get('price') ? parseFloat(formData.get('price') as string) : undefined;
      const publishStatus = (formData.get('publishStatus') as string) || 'published';
      const file = formData.get('imageFile') as File | null;
      const imageUrlInput = formData.get('imageUrl') as string | null;

      if (!name || !sku) {
        return NextResponse.json(
          { error: 'Product Name and Product Code (SKU) are mandatory.' },
          { status: 400 }
        );
      }

      const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '_').toUpperCase();
      const imagesList: string[] = [];

      // Handle Image URL input if provided
      if (imageUrlInput && imageUrlInput.trim()) {
        imagesList.push(imageUrlInput.trim());
      }

      // Handle Image Upload if provided
      if (file && file.size > 0) {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const stored = await saveProductImage({
            filename: file.name,
            buffer,
            mimeType: file.type,
            sku: cleanSku,
          });
          imagesList.unshift(stored.publicUrl);
        } catch (uploadErr) {
          console.error('[Product Admin] Image upload persistence error:', uploadErr);
        }
      }

      const isActive = publishStatus === 'published';

      productData = {
        name: name.trim(),
        sku: cleanSku,
        categoryId: categoryId || 'office-stationery',
        categoryName: categoryName || 'Office Stationery',
        subcategoryId: subcategoryId || undefined,
        subcategoryName: subcategoryName || undefined,
        brandName: brandName?.trim() || 'OfficeBazzar',
        packSize: packSize?.trim() || '1 Unit',
        description: description?.trim() || '',
        price: price || 0,
        isActive,
        publishStatus: publishStatus as 'published' | 'draft' | 'unpublished',
        images: imagesList,
        specifications: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      const body = await request.json();
      productData = body;
    }

    if (!productData.name || !productData.sku) {
      return NextResponse.json(
        { error: 'Product Name and Product Code (SKU) are required.' },
        { status: 400 }
      );
    }

    const cleanSku = productData.sku.replace(/[^a-zA-Z0-9-_]/g, '_').toUpperCase();
    const cleanId = productData.id || `prod-${cleanSku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const cleanSlug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const cleanActive = productData.isActive !== undefined ? productData.isActive : (productData as any).publishStatus !== 'unpublished';

    productData = {
      ...productData,
      id: cleanId,
      sku: cleanSku,
      slug: cleanSlug,
      isActive: cleanActive,
    };

    // 1. Create product record in Zoho CRM
    let zohoId: string | undefined = undefined;
    const zohoResult = await createZohoProduct(productData);
    if (zohoResult.success && zohoResult.zohoId) {
      zohoId = zohoResult.zohoId;
    }

    // 2. Persist in website catalogue store and custom products file
    const saved = await saveProduct({
      ...productData,
      zohoProductId: zohoId,
    } as any);

    // 3. Immediately update the live in-memory cache with the new product and bust stale timestamps
    updateProductInLiveCache(saved);
    invalidateZohoProductCache();

    // 4. Targeted Live Next.js Cache Invalidation
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/product-admin-panel');
      revalidatePath('/products');
      revalidatePath('/categories');
      if (saved.categoryId) {
        revalidatePath(`/category/${saved.categoryId}`);
      }
      if (saved.slug) {
        revalidatePath(`/product/${saved.slug}`);
      }
      if (saved.sku) {
        revalidatePath(`/product/${saved.sku.toLowerCase()}`);
      }
    } catch (revalidateErr) {
      console.warn('[Product Admin] Revalidation notice:', revalidateErr);
    }

    const productResponse = {
      ...saved,
      status: saved.isActive ? 'active' : 'draft',
      publishStatus: saved.isActive ? 'published' : 'draft',
    };

    return NextResponse.json({
      success: true,
      message: 'Product successfully created and synchronized with Zoho CRM and the live website.',
      product: productResponse,
      zohoSynced: Boolean(zohoId),
      zohoId,
      zohoError: zohoResult.error,
    });
  } catch (error) {
    console.error('[Product Admin API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save product.' },
      { status: 500 }
    );
  }
}
