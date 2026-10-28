import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/adminSession';
import {
  getProductById,
  saveProduct,
  updateProductPublishStatus,
  deleteProduct,
  getAdminProducts,
  getCategories,
  getBrands,
} from '@/lib/db/store';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error retrieving product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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

    if (name && !name.trim()) {
      return NextResponse.json({ error: 'Product name cannot be empty.' }, { status: 400 });
    }

    if (sku) {
      const cleanSku = sku.trim().toUpperCase();
      const allProducts = await getAdminProducts();
      const isDuplicate = allProducts.some(
        (p) => p.id !== id && p.sku.toUpperCase() === cleanSku
      );
      if (isDuplicate) {
        return NextResponse.json(
          { error: `SKU "${cleanSku}" is already taken by another product.` },
          { status: 409 }
        );
      }
    }

    const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

    const resolvedCategory = categoryId
      ? categories.find((c) => c.id === categoryId || c.slug === categoryId)
      : undefined;

    const resolvedBrand = brandId
      ? brands.find((b) => b.id === brandId || b.slug === brandId)
      : undefined;

    const updatedData: Partial<Product> = {
      ...existing,
      id,
      name: name !== undefined ? name.trim() : existing.name,
      sku: sku !== undefined ? sku.trim().toUpperCase() : existing.sku,
      images: Array.isArray(images) && images.length > 0 ? images : existing.images,
      packSize: packSize !== undefined ? packSize.trim() : existing.packSize,
      categoryId: resolvedCategory?.id || categoryId || existing.categoryId,
      categoryName: resolvedCategory?.name || categoryName || existing.categoryName,
      subcategoryId: subcategoryId !== undefined ? subcategoryId : existing.subcategoryId,
      subcategoryName: subcategoryName !== undefined ? subcategoryName : existing.subcategoryName,
      brandId: resolvedBrand?.id || brandId || existing.brandId,
      brandName: resolvedBrand?.name || brandName || existing.brandName,
      description: description !== undefined ? description.trim() : existing.description,
      shortDescription: shortDescription !== undefined ? shortDescription.trim() : existing.shortDescription,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      specifications: specifications || existing.specifications,
    };

    const saved = await saveProduct(updatedData);

    return NextResponse.json({
      success: true,
      product: saved,
      message: 'Product updated successfully.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error updating product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { isActive } = body;

    if (isActive === undefined) {
      return NextResponse.json({ error: 'Missing isActive parameter.' }, { status: 400 });
    }

    const updated = await updateProductPublishStatus(id, Boolean(isActive));
    if (!updated) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: updated,
      message: updated.isActive
        ? 'Product published successfully. Now visible to public customers.'
        : 'Product unpublished. Now saved as a private draft.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error toggling publish status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteProduct(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete product or product not found.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted permanently from catalogue.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error deleting product' },
      { status: 500 }
    );
  }
}
