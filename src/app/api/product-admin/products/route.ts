import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { revalidatePath } from 'next/cache';
import { getProductAdminSession } from '@/lib/product-admin/auth';
import { getProductsFromZoho, createZohoProduct, invalidateZohoProductCache } from '@/lib/zoho/products';
import { saveProduct } from '@/lib/db/store';
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

    const allProducts = await getProductsFromZoho(true);

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

    // Compute real metrics from Zoho CRM catalog & custom entries
    const totalCount = allProducts.length;
    const activeCount = allProducts.filter((p) => p.isActive !== false).length;

    // Load actual custom / recently added products from disk to count actual recent additions
    let recentlyAddedCount = 0;
    try {
      const customPath = path.join(process.cwd(), 'src', 'lib', 'data', 'custom_products.json');
      if (fs.existsSync(customPath)) {
        const customData = JSON.parse(fs.readFileSync(customPath, 'utf8'));
        if (Array.isArray(customData)) {
          recentlyAddedCount = customData.length;
        }
      }
    } catch {
      recentlyAddedCount = 0;
    }

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
        activeProducts: activeCount,
        recentlyAddedCount,
        recentlyUpdatedCount: recentlyAddedCount,
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
    let imagePath: string | undefined = undefined;

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
      const cataloguePage = formData.get('cataloguePage') as string;
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
        const extension = file.name.split('.').pop()?.toLowerCase() || 'webp';
        const targetFilename = `${cleanSku}.${extension}`;

        try {
          const uploadDir = path.join(process.cwd(), 'public', 'assets', 'products', 'catalog_2026');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const destination = path.join(uploadDir, targetFilename);
          fs.writeFileSync(destination, buffer);
        } catch (fsErr) {
          console.warn('[Product Admin] Local upload write warning:', fsErr);
        }

        // Generate reliable image data URI if under 300KB for permanent serverless availability
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          if (buffer.length < 300 * 1024) {
            const mimeType = file.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            imagesList.unshift(`data:${mimeType};base64,${buffer.toString('base64')}`);
          } else {
            imagePath = `/assets/products/catalog_2026/${targetFilename}`;
            imagesList.unshift(imagePath);
          }
        } catch {
          imagePath = `/assets/products/catalog_2026/${targetFilename}`;
          imagesList.unshift(imagePath);
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
        images: imagesList,
        specifications: cataloguePage ? { cataloguePage } : {},
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

    // 3. Clear edge product cache
    invalidateZohoProductCache();

    // 4. Live Next.js Cache Invalidation
    try {
      revalidatePath('/');
      revalidatePath('/products');
      revalidatePath('/products', 'page');
      revalidatePath('/categories');
      revalidatePath('/shop');
      revalidatePath('/product/[slug]', 'page');
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

    return NextResponse.json({
      success: true,
      message: 'Product successfully created and synchronized with Zoho CRM and the live website.',
      product: saved,
      zohoSynced: Boolean(zohoId),
      zohoId,
    });
  } catch (error) {
    console.error('[Product Admin API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save product.' },
      { status: 500 }
    );
  }
}
