import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/adminSession';
import { getAdminProducts, saveProduct, getCategories, getBrands } from '@/lib/db/store';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const status = searchParams.get('status') || 'all'; // all | published | draft
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';

    const allProducts = await getAdminProducts();

    const publishedCount = allProducts.filter((p) => p.isActive).length;
    const draftCount = allProducts.filter((p) => !p.isActive).length;

    let filtered = allProducts;

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.categoryName?.toLowerCase().includes(search) ||
          p.brandName?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    if (status === 'published') {
      filtered = filtered.filter((p) => p.isActive);
    } else if (status === 'draft') {
      filtered = filtered.filter((p) => !p.isActive);
    }

    if (category) {
      filtered = filtered.filter(
        (p) => p.categoryId === category || p.categoryName.toLowerCase() === category.toLowerCase()
      );
    }

    if (brand) {
      filtered = filtered.filter(
        (p) => p.brandId === brand || p.brandName.toLowerCase() === brand.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      products: filtered,
      total: filtered.length,
      publishedCount,
      draftCount,
      totalCount: allProducts.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error fetching products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      sku,
      images,
      packSize,
      categoryId,
      categoryName,
      subcategoryId,
      subcategoryName,
      brandId,
      brandName,
      description,
      shortDescription,
      isActive,
      specifications,
    } = body;

    // Field Validations
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    }

    if (!sku || typeof sku !== 'string' || !sku.trim()) {
      return NextResponse.json({ error: 'Product code / SKU is required.' }, { status: 400 });
    }

    if (!images || !Array.isArray(images) || images.length === 0 || !images[0]) {
      return NextResponse.json(
        { error: 'At least one primary product image is required.' },
        { status: 400 }
      );
    }

    // Check SKU uniqueness among existing products
    const existingProducts = await getAdminProducts();
    const cleanSku = sku.trim().toUpperCase();
    const isDuplicateSku = existingProducts.some(
      (p) => p.sku.toUpperCase() === cleanSku
    );

    if (isDuplicateSku) {
      return NextResponse.json(
        { error: `Product code / SKU "${cleanSku}" already exists. SKU must be unique.` },
        { status: 409 }
      );
    }

    // Resolve category name and brand name if not provided
    const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

    const resolvedCategory = categories.find(
      (c) => c.id === categoryId || c.slug === categoryId || c.name.toLowerCase() === (categoryName || '').toLowerCase()
    );

    const resolvedBrand = brands.find(
      (b) => b.id === brandId || b.slug === brandId || b.name.toLowerCase() === (brandName || '').toLowerCase()
    );

    const productPayload: Partial<Product> = {
      name: name.trim(),
      sku: cleanSku,
      images: images.filter((img) => typeof img === 'string' && img.trim().length > 0),
      packSize: packSize?.trim() || 'Standard Pack',
      categoryId: resolvedCategory?.id || categoryId || 'office-supplies-stationery',
      categoryName: resolvedCategory?.name || categoryName || 'Office Supplies & Stationery',
      subcategoryId: subcategoryId || undefined,
      subcategoryName: subcategoryName || undefined,
      brandId: resolvedBrand?.id || brandId || 'officebazzar',
      brandName: resolvedBrand?.name || brandName || 'OfficeBazzar',
      description: description?.trim() || '',
      shortDescription: shortDescription?.trim() || '',
      isActive: isActive !== false, // default to true if published, false if draft
      specifications: specifications || {},
      minOrderQuantity: 1,
      stockQuantity: 100,
      gstPercent: 18,
    };

    const createdProduct = await saveProduct(productPayload);

    return NextResponse.json({
      success: true,
      product: createdProduct,
      message: createdProduct.isActive
        ? 'Product published successfully and visible in public store.'
        : 'Product saved as private draft.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error creating product' },
      { status: 500 }
    );
  }
}
