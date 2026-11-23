import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getProductAdminSession } from '@/lib/product-admin/auth';
import { updateZohoProduct, deleteZohoProduct, updateProductInLiveCache, removeProductFromLiveCache, invalidateZohoProductCache, getProductsFromZoho } from '@/lib/zoho/products';
import { saveProduct, deleteProduct, getProductById, getProductBySlug } from '@/lib/db/store';
import { saveProductImage } from '@/lib/products/image-store';
import { INITIAL_PRODUCTS } from '@/lib/data/catalog';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getProductAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getProductAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await getProductById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Product record not found.' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    let updates: Partial<Product> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const name = formData.get('name') as string | null;
      const sku = formData.get('sku') as string | null;
      const categoryId = formData.get('categoryId') as string | null;
      const categoryName = formData.get('categoryName') as string | null;
      const subcategoryId = formData.get('subcategoryId') as string | null;
      const subcategoryName = formData.get('subcategoryName') as string | null;
      const brandName = formData.get('brandName') as string | null;
      const packSize = formData.get('packSize') as string | null;
      const description = formData.get('description') as string | null;
      const priceStr = formData.get('price') as string | null;
      const isActiveStr = formData.get('isActive') as string | null;
      const publishStatus = formData.get('publishStatus') as string | null;
      const file = formData.get('imageFile') as File | null;
      const imageUrlInput = formData.get('imageUrl') as string | null;
      const specificationsStr = formData.get('specifications') as string | null;

      let determinedActive = existing.isActive;
      if (publishStatus) {
        determinedActive = publishStatus === 'published';
      } else if (isActiveStr !== null) {
        determinedActive = isActiveStr === 'true';
      }

      let parsedSpecs: Record<string, string> | undefined = undefined;
      if (specificationsStr) {
        try {
          parsedSpecs = JSON.parse(specificationsStr);
        } catch {
          // ignore invalid specifications JSON
        }
      }

      updates = {
        name: name ? name.trim() : existing.name,
        sku: sku ? sku.trim().toUpperCase() : existing.sku,
        categoryId: categoryId || existing.categoryId,
        categoryName: categoryName || existing.categoryName,
        subcategoryId: subcategoryId !== null ? subcategoryId : existing.subcategoryId,
        subcategoryName: subcategoryName !== null ? subcategoryName : existing.subcategoryName,
        brandName: brandName ? brandName.trim() : existing.brandName,
        packSize: packSize ? packSize.trim() : existing.packSize,
        description: description !== null ? description.trim() : existing.description,
        isActive: determinedActive,
        specifications: parsedSpecs || existing.specifications,
      };

      if (priceStr !== null) {
        const parsedPrice = parseFloat(priceStr);
        if (!isNaN(parsedPrice)) {
          updates.price = parsedPrice;
        }
      }

      if (publishStatus) {
        updates.publishStatus = publishStatus as 'published' | 'draft' | 'unpublished';
      }
      updates.updatedAt = new Date().toISOString();

      // Handle Image Replacement:
      // Priority 1: File Upload (new image chosen)
      // Priority 2: Direct URL Input (URL provided or edited)
      if (file && file.size > 0) {
        if (file.size > 2 * 1024 * 1024) {
          return NextResponse.json(
            {
              error: `Image file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 2MB limit. Please upload an image under 2MB.`,
            },
            { status: 400 }
          );
        }
        try {
          const cleanSku = (updates.sku || existing.sku).replace(/[^a-zA-Z0-9-_]/g, '_').toUpperCase();
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const stored = await saveProductImage({
            filename: file.name,
            buffer,
            mimeType: file.type,
            sku: cleanSku,
          });
          updates.images = [stored.publicUrl];
          (updates as any).image = stored.publicUrl;
          (updates as any).imageUrl = stored.publicUrl;
        } catch (uploadErr) {
          console.error('[Product Admin] Image replacement persistence error:', uploadErr);
        }
      } else if (imageUrlInput && imageUrlInput.trim()) {
        updates.images = [imageUrlInput.trim()];
        (updates as any).image = imageUrlInput.trim();
        (updates as any).imageUrl = imageUrlInput.trim();
      }
    } else {
      const body = await request.json();
      updates = body;
      if ((body as any).commercialPrice !== undefined && (body as any).price === undefined) {
        const parsedPrice = parseFloat(String((body as any).commercialPrice));
        if (!isNaN(parsedPrice)) {
          updates.price = parsedPrice;
        }
      }
      if ((body as any).publishStatus) {
        updates.isActive = (body as any).publishStatus === 'published';
      } else if ((body as any).isActive !== undefined) {
        updates.isActive = Boolean((body as any).isActive);
      }
    }

    const mergedProduct: Product = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    // 1 & 2: Update in Zoho CRM and persist in website catalogue store concurrently
    const zohoTargetId = (existing as any).zohoProductId || existing.sku;
    const zohoPromise: Promise<{ success: boolean; zohoId?: string; error?: string }> = zohoTargetId
      ? updateZohoProduct(zohoTargetId, mergedProduct, existing.sku)
      : Promise.resolve({ success: false, zohoId: undefined, error: 'No Zoho ID or SKU provided' });
    const storePromise = saveProduct(mergedProduct);

    const [zohoResult, saved] = await Promise.all([zohoPromise, storePromise]);
    const zohoSynced = zohoResult.success;

    if (!zohoSynced) {
      console.error('[Product Admin API] Zoho sync failure:', zohoResult.error);
      return NextResponse.json(
        {
          success: false,
          error: `Zoho CRM persistence failed: ${zohoResult.error || 'Unable to persist product note to Zoho Account.'}`,
        },
        { status: 500 }
      );
    }

    // 3. Immediately update the live in-memory cache and bust stale sync timestamps
    updateProductInLiveCache(saved, {
      id: existing.id,
      sku: existing.sku,
      slug: existing.slug,
    });
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
      if (existing?.categoryId && existing.categoryId !== saved.categoryId) {
        revalidatePath(`/category/${existing.categoryId}`);
      }
      if (saved.slug) {
        revalidatePath(`/product/${saved.slug}`);
      }
      if (saved.sku) {
        revalidatePath(`/product/${saved.sku.toLowerCase()}`);
      }
      if (existing?.slug && existing.slug !== saved.slug) {
        revalidatePath(`/product/${existing.slug}`);
      }
      if (existing?.sku && existing.sku.toLowerCase() !== saved.sku.toLowerCase()) {
        revalidatePath(`/product/${existing.sku.toLowerCase()}`);
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
      message: 'Product updated successfully across Zoho CRM and live website.',
      product: productResponse,
      zohoSynced,
      zohoError: zohoResult.error,
    });
  } catch (error) {
    console.error('[Product Admin API] PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product.' },
      { status: 500 }
    );
  }
}

async function resolveProductForDeletion(rawId: string): Promise<Product> {
  const cleanId = decodeURIComponent(rawId).trim();
  const cleanUpper = cleanId.toUpperCase();
  const cleanLower = cleanId.toLowerCase();

  // 1. Try standard getProductById
  try {
    const p = await getProductById(cleanId);
    if (p) return p;
  } catch {}

  // 2. Try standard getProductBySlug
  try {
    const p = await getProductBySlug(cleanId);
    if (p) return p;
  } catch {}

  // 3. Search getProductsFromZoho (authoritative notes & active catalog)
  try {
    const zohoList = await getProductsFromZoho(true);
    const found = zohoList.find(
      (p) =>
        (p.id && p.id.toLowerCase() === cleanLower) ||
        (p.sku && p.sku.toUpperCase() === cleanUpper) ||
        (p.slug && p.slug.toLowerCase() === cleanLower)
    );
    if (found) return found;
  } catch {}

  // 4. Search INITIAL_PRODUCTS static baseline
  const baseline = INITIAL_PRODUCTS.find(
    (p) =>
      (p.id && p.id.toLowerCase() === cleanLower) ||
      (p.sku && p.sku.toUpperCase() === cleanUpper) ||
      (p.slug && p.slug.toLowerCase() === cleanLower)
  );
  if (baseline) return baseline;

  // 5. Fallback descriptor: synthesize product object so deletion never 404s
  return {
    id: cleanId,
    sku: cleanUpper,
    slug: cleanLower,
    name: cleanId,
    categoryId: '',
    categoryName: '',
    brandId: '',
    brandName: '',
    description: '',
    price: null,
    stockQuantity: 0,
    packSize: '1 Unit',
    images: [],
    isActive: false,
  } as unknown as Product;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getProductAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await resolveProductForDeletion(id);

    // Collect all identifiers to guarantee complete elimination across id, sku, and slug
    const allIdentifiers = Array.from(
      new Set(
        [existing.id, existing.sku, existing.slug, id, decodeURIComponent(id)]
          .filter((x): x is string => !!x && typeof x === 'string' && x.trim().length > 0)
      )
    );

    // 1 & 2. Delete / deactivate in Zoho CRM and store in parallel
    const zohoTargetId = (existing as any).zohoProductId || existing.sku;
    const zohoPromise: Promise<{ success: boolean; zohoId?: string; error?: string }> = zohoTargetId
      ? deleteZohoProduct(zohoTargetId, existing.sku, existing)
      : Promise.resolve({ success: false, error: 'No Zoho ID or SKU provided' });

    const deletePromise = (async () => {
      for (const ident of allIdentifiers) {
        await deleteProduct(ident);
      }
    })();

    const [zohoResult] = await Promise.all([zohoPromise, deletePromise]);
    const zohoSynced = zohoResult.success;

    if (!zohoSynced) {
      return NextResponse.json(
        {
          error: zohoResult.error || 'Failed to synchronize product deletion with Zoho CRM.',
          zohoError: zohoResult.error,
        },
        { status: 500 }
      );
    }

    // 3. Immediately update live in-memory cache and bust stale sync timestamps
    for (const ident of allIdentifiers) {
      removeProductFromLiveCache(ident);
    }
    invalidateZohoProductCache();

    // 4. Targeted Live Next.js Cache Invalidation
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/product-admin-panel');
      revalidatePath('/products');
      revalidatePath('/categories');
      revalidatePath('/shop');
      if (existing.categoryId) {
        revalidatePath(`/category/${existing.categoryId}`);
      }
      if (existing.slug) {
        revalidatePath(`/product/${existing.slug}`);
      }
      if (existing.sku) {
        revalidatePath(`/product/${existing.sku.toLowerCase()}`);
      }
    } catch (revalidateErr) {
      console.warn('[Product Admin] Revalidation notice:', revalidateErr);
    }

    return NextResponse.json({
      success: true,
      message: `Product "${existing.name}" (${existing.sku}) successfully deleted and synchronized with Zoho CRM.`,
      deletedId: existing.id,
      deletedSku: existing.sku,
      zohoSynced,
      zohoError: zohoResult.error,
    });
  } catch (error) {
    console.error('[Product Admin API] DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product.' },
      { status: 500 }
    );
  }
}
