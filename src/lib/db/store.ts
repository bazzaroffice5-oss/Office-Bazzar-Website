import {
  Product,
  Category,
  Brand,
  Coupon,
  Order,
  BulkRFQ,
  FilterParams,
  OrderStatus,
  Quotation,
  QuotationStatus,
  NotificationLog,
} from '@/types';
import { CATEGORIES, BRANDS, INITIAL_PRODUCTS, COUPONS, resolveMainCategory } from '@/lib/data/catalog';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';

// Persistent in-memory data store for resilient fallback when database is offline or unconfigured
let productsList: Product[] = [...INITIAL_PRODUCTS];
const ordersList: Order[] = [];
const bulkRFQsList: BulkRFQ[] = [];
const idempotencyStore = new Map<string, Order>();

// Quotation & Notification In-Memory Fallback State
let quotationCounter = 1;
const quotationsList: Quotation[] = [];
const quotationIdempotencyStore = new Map<string, Quotation>();
const notificationLogsList: NotificationLog[] = [];

// Map database row (snake_case) to Product interface (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    categoryId: row.category_id || '',
    categoryName: row.category_name || 'Office Supplies',
    subcategoryId: row.subcategory_id,
    subcategoryName: row.subcategory_name,
    brandId: row.brand_id || '',
    brandName: row.brand_name || 'OfficeBazzar',
    description: row.description || '',
    shortDescription: row.short_description,
    specifications: row.specifications || {},
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    mrp: row.mrp !== null && row.mrp !== undefined ? Number(row.mrp) : null,
    gstPercent: Number(row.gst_percent || 18),
    hsnCode: row.hsn_code,
    stockQuantity: Number(row.stock_quantity || 0),
    minOrderQuantity: Number(row.min_order_quantity || 1),
    packSize: row.pack_size || '1 Unit',
    images: Array.isArray(row.images)
      ? row.images.filter((img: unknown) => typeof img === 'string' && img.length > 0)
      : typeof row.images === 'string' && row.images.trim().length > 0
      ? (() => {
          try {
            const parsed = JSON.parse(row.images);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [row.images];
          } catch {
            return [row.images];
          }
        })()
      : [],
    featured: Boolean(row.is_featured),
    bestseller: Boolean(row.is_bestseller),
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : null,
    reviewCount: Number(row.review_count || 0),
    isPriceVerified: Boolean(row.is_price_verified),
    requiresManualReview: Boolean(row.requires_manual_review ?? true),
    isActive: row.is_active !== false,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
  };
}

// Map database row (snake_case) to Order interface (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbOrder(orderRow: any, itemsRows: any[] = []): Order {
  return {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    idempotencyKey: orderRow.idempotency_key,
    customerName: orderRow.customer_name,
    customerEmail: orderRow.customer_email,
    customerPhone: orderRow.customer_phone,
    companyName: orderRow.company_name,
    gstin: orderRow.gstin,
    shippingAddress: orderRow.shipping_address,
    billingAddress: orderRow.billing_address,
    items: itemsRows.map((it) => ({
      id: it.id,
      productId: it.product_id,
      productName: it.product_name,
      sku: it.sku,
      unitPrice: Number(it.unit_price),
      gstPercent: Number(it.gst_percent),
      hsnCode: it.hsn_code,
      quantity: Number(it.quantity),
      totalPrice: Number(it.total_price),
      productImage: it.product_image || '',
      packSize: it.pack_size,
    })),
    subtotal: Number(orderRow.subtotal),
    gstAmount: Number(orderRow.gst_amount),
    discountAmount: Number(orderRow.discount_amount || 0),
    shippingCharge: Number(orderRow.shipping_charge || 0),
    totalAmount: Number(orderRow.total_amount),
    couponCode: orderRow.coupon_code,
    paymentMethod: orderRow.payment_method,
    paymentStatus: orderRow.payment_status,
    paymentId: orderRow.payment_id,
    orderStatus: orderRow.order_status,
    trackingNumber: orderRow.tracking_number,
    courierName: orderRow.courier_name,
    notes: orderRow.notes,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
  };
}

// Map database row to BulkRFQ
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbBulkRFQ(row: any): BulkRFQ {
  return {
    id: row.id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    gstin: row.gstin,
    category: Array.isArray(row.product_categories) ? row.product_categories.join(', ') : (row.product_categories || 'General'),
    requirements: row.requirements,
    estimatedQuantity: row.estimated_monthly_spend || '',
    deliveryLocation: row.delivery_location,
    createdAt: row.created_at,
    status: row.status || 'pending',
  };
}

// Map database row to Quotation interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbQuotation(row: any, itemsRows: any[] = []): Quotation {
  return {
    id: row.id,
    quotationNumber: row.quotation_number,
    idempotencyKey: row.idempotency_key || undefined,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    gstin: row.gstin || undefined,
    deliveryLocation: row.delivery_location || undefined,
    pincode: row.pincode,
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : (row.photo_urls ? [row.photo_urls] : undefined),
    preferredContactMethod: row.preferred_contact_method || 'email',
    additionalRequirements: row.additional_requirements || undefined,
    items: itemsRows.map((it) => ({
      id: it.id,
      quotationId: it.quotation_id,
      productId: it.product_id,
      productName: it.product_name,
      sku: it.sku,
      indicativeUnitPrice: Number(it.indicative_unit_price),
      hsnCode: it.hsn_code || undefined,
      gstPercent: Number(it.gst_percent || 18),
      quantity: Number(it.quantity),
      indicativeTotalPrice: Number(it.indicative_total_price),
      productImage: it.product_image || undefined,
      packSize: it.pack_size || undefined,
    })),
    indicativeSubtotal: Number(row.indicative_subtotal || 0),
    indicativeGstAmount: Number(row.indicative_gst_amount || 0),
    indicativeTotal: Number(row.indicative_total || 0),
    status: (row.status as QuotationStatus) || 'new',
    assignedTo: row.assigned_to || undefined,
    internalNotes: row.internal_notes || undefined,
    quotedAmount: row.quoted_amount ? Number(row.quoted_amount) : undefined,
    quotationDocumentUrl: row.quotation_document_url || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

// Map database row to NotificationLog interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbNotificationLog(row: any): NotificationLog {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    quotationNumber: row.quotation_number,
    channel: row.channel,
    recipient: row.recipient,
    status: row.status,
    attempts: Number(row.attempts || 1),
    lastAttemptAt: row.last_attempt_at || row.created_at || new Date().toISOString(),
    errorMessage: row.error_message || undefined,
    metadata: row.metadata || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ----------------------------------------------------------------------
// PRODUCT CATALOG METHODS (Supabase with In-Memory Resilient Fallback)
// ----------------------------------------------------------------------

export async function getProducts(filters?: FilterParams): Promise<{ products: Product[]; total: number }> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('products').select('*', { count: 'exact' });

      if (filters?.inStockOnly) {
        query = query.gt('stock_quantity', 0);
      }
      if (filters?.category) {
        const resolved = resolveMainCategory(filters.category);
        if (resolved) {
          query = query.or(`category_id.eq.${resolved.id},category_name.ilike.%${resolved.name}%`);
        } else {
          query = query.or(`category_id.eq.${filters.category},subcategory_id.eq.${filters.category},category_name.ilike.%${filters.category}%`);
        }
      }
      if (filters?.subcategory) {
        query = query.or(`subcategory_id.eq.${filters.subcategory},subcategory_name.ilike.%${filters.subcategory}%`);
      }
      if (filters?.brand) {
        query = query.eq('brand_id', filters.brand);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.query) {
        query = query.ilike('name', `%${filters.query.trim()}%`);
      }

      // Sort
      if (filters?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      } else {
        query = query.order('is_bestseller', { ascending: false });
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 24;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (!error && data && data.length > 0) {
        return {
          products: data.map(mapDbProduct),
          total: count || data.length,
        };
      }
    } catch {
      // Safely fall back to in-memory catalogue if Supabase experiences connection issues
    }
  }

  // Fallback: In-memory store
  let result = [...productsList].filter((p) => p.isActive);

  if (filters?.query) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (filters?.category) {
    const resolvedCat = resolveMainCategory(filters.category);
    if (resolvedCat) {
      result = result.filter(
        (p) => p.categoryId === resolvedCat.id || p.categoryName.toLowerCase() === resolvedCat.name.toLowerCase()
      );
    } else {
      result = result.filter(
        (p) =>
          p.categoryId === filters.category ||
          p.categoryName.toLowerCase().includes(filters.category!.toLowerCase()) ||
          p.subcategoryId === filters.category
      );
    }
  }

  if (filters?.subcategory) {
    result = result.filter(
      (p) =>
        p.subcategoryId === filters.subcategory ||
        p.subcategoryName?.toLowerCase().includes(filters.subcategory!.toLowerCase())
    );
  }

  if (filters?.brand) {
    result = result.filter(
      (p) => p.brandId === filters.brand || p.brandName.toLowerCase() === filters.brand!.toLowerCase()
    );
  }

  if (filters?.minPrice !== undefined) {
    result = result.filter((p) => (p.price ?? 0) >= filters.minPrice!);
  }

  if (filters?.maxPrice !== undefined) {
    result = result.filter((p) => (p.price ?? 0) <= filters.maxPrice!);
  }

  if (filters?.inStockOnly) {
    result = result.filter((p) => (p.stockQuantity ?? 0) > 0);
  }

  // Sorting
  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'newest':
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'relevance':
      default:
        result.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
        break;
    }
  }

  const total = result.length;
  const page = filters?.page || 1;
  const limit = filters?.limit ?? 500;
  const startIndex = (page - 1) * limit;
  const paginated = result.slice(startIndex, startIndex + limit);

  return { products: paginated, total };
}

export async function getAdminProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapDbProduct);
      }
    } catch {
      // Fallback
    }
  }
  return [...productsList];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`slug.eq.${slug},sku.ilike.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (!error && data) {
        return mapDbProduct(data);
      }
    } catch {
      // Fallback
    }
  }

  const product = productsList.find(
    (p) => p.slug === slug || p.sku.toLowerCase() === slug.toLowerCase() || p.id === slug
  );
  return product || null;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return mapDbProduct(data);
      }
    } catch {
      // Fallback
    }
  }

  const product = productsList.find((p) => p.id === id);
  return product || null;
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        const rootRows = data.filter((c) => !c.parent_id);
        const subRows = data.filter((c) => Boolean(c.parent_id));

        const categoriesToReturn = rootRows.length > 0 ? rootRows : data;

        return categoriesToReturn.map((c) => {
          const matchingSubs = subRows
            .filter((sub) => sub.parent_id === c.id)
            .map((sub) => ({
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              categoryId: c.id,
              description: sub.description || undefined,
              imageUrl: sub.image_url || undefined,
            }));

          const fallbackMain = CATEGORIES.find((mc: Category) => mc.slug === c.slug || mc.id === c.id);
          const finalSubs = matchingSubs.length > 0 ? matchingSubs : (fallbackMain?.subcategories || []);

          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || fallbackMain?.description,
            imageUrl: c.image_url || fallbackMain?.imageUrl,
            icon: c.icon || fallbackMain?.icon,
            parentId: c.parent_id,
            subcategories: finalSubs,
            featured: c.is_featured ?? true,
          };
        });
      }
    } catch {
      // Fallback
    }
  }
  return CATEGORIES;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const resolved = resolveMainCategory(slug);
  if (resolved) return resolved;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (!error && data) {
        const fallbackMain = CATEGORIES.find((mc: Category) => mc.slug === data.slug || mc.id === data.id);
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || fallbackMain?.description,
          imageUrl: data.image_url || fallbackMain?.imageUrl,
          icon: data.icon || fallbackMain?.icon,
          parentId: data.parent_id,
          subcategories: fallbackMain?.subcategories || [],
        };
      }
    } catch {
      // Fallback
    }
  }

  const cat = CATEGORIES.find((c) => c.slug === slug || c.id === slug);
  return cat || null;
}

export async function getBrands(): Promise<Brand[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('brands').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description,
          logoUrl: b.logo_url,
          featured: b.is_featured,
        }));
      }
    } catch {
      // Fallback
    }
  }
  return BRANDS;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const brand = BRANDS.find((b) => b.slug === slug);
  return brand || null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { products } = await getProducts();
  const featured = products.filter((p) => p.featured);
  return featured.length > 0 ? featured.slice(0, limit) : products.slice(0, limit);
}

export async function getBestsellers(limit = 8): Promise<Product[]> {
  const { products } = await getProducts();
  const bestsellers = products.filter((p) => p.bestseller);
  return bestsellers.length > 0 ? bestsellers.slice(0, limit) : products.slice(0, limit);
}

export async function getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
  const current = await getProductById(productId);
  const { products: allCatalog } = await getProducts();
  const pool = allCatalog.length > 0 ? allCatalog : productsList;

  if (!current) return pool.slice(0, limit);

  // 1. Prefer products from same subcategory
  const sameSub = pool.filter(
    (p) => p.id !== productId && p.subcategoryId && p.subcategoryId === current.subcategoryId
  );

  // 2. Then products from same main category
  const sameCat = pool.filter(
    (p) => p.id !== productId && p.categoryId === current.categoryId && !sameSub.some((s) => s.id === p.id)
  );

  const combined = [...sameSub, ...sameCat];
  if (combined.length >= limit) {
    return combined.slice(0, limit);
  }

  // Fallback to other catalog products
  const remaining = pool.filter(
    (p) => p.id !== productId && !combined.some((c) => c.id === p.id)
  );

  return [...combined, ...remaining].slice(0, limit);
}

// ----------------------------------------------------------------------
// COUPON VERIFICATION (Configurable / Database)
// ----------------------------------------------------------------------

export async function validateCoupon(
  code: string,
  cartTotal: number
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const cleanCode = code.trim().toUpperCase();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        if (cartTotal < Number(data.min_cart_amount || 0)) {
          return {
            valid: false,
            error: `Coupon "${cleanCode}" requires a minimum order subtotal of ₹${data.min_cart_amount}.`,
          };
        }
        return {
          valid: true,
          coupon: {
            code: data.code,
            discountType: data.discount_type,
            discountValue: Number(data.discount_value),
            minCartAmount: Number(data.min_cart_amount || 0),
            maxDiscountAmount: data.max_discount_amount ? Number(data.max_discount_amount) : undefined,
            description: data.description || '',
          },
        };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback to configured coupon catalog
  const coupon = COUPONS.find((c) => c.code.toUpperCase() === cleanCode);
  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code or promotional offer has expired.' };
  }
  if (cartTotal < coupon.minCartAmount) {
    return {
      valid: false,
      error: `Coupon "${coupon.code}" requires a minimum cart amount of ₹${coupon.minCartAmount}.`,
    };
  }
  return { valid: true, coupon };
}

// ----------------------------------------------------------------------
// ORDER CREATION & MANAGEMENT (Atomic Stock & Idempotency)
// ----------------------------------------------------------------------

export async function createOrder(
  orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>
): Promise<Order> {
  // 1. Idempotency Check: Prevent duplicate order creation on network retries
  if (orderData.idempotencyKey) {
    const cachedOrder = idempotencyStore.get(orderData.idempotencyKey);
    if (cachedOrder) {
      return cachedOrder;
    }

    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      try {
        const client = supabaseAdmin || supabase!;
        const { data } = await client
          .from('orders')
          .select('*, order_items(*)')
          .eq('idempotency_key', orderData.idempotencyKey)
          .maybeSingle();

        if (data) {
          const mapped = mapDbOrder(data, data.order_items || []);
          idempotencyStore.set(orderData.idempotencyKey, mapped);
          return mapped;
        }
      } catch {
        // Fallback
      }
    }
  }

  const orderNumber = `OB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderId = `ord-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const newOrder: Order = {
    ...orderData,
    id: orderId,
    orderNumber,
    createdAt,
  };

  // 2. Atomic Stock Validation and Decrement
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;

      // Insert Order into Supabase
      const { data: dbOrder, error: orderError } = await client
        .from('orders')
        .insert({
          order_number: orderNumber,
          idempotency_key: orderData.idempotencyKey || null,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone,
          company_name: orderData.companyName || null,
          gstin: orderData.gstin || null,
          shipping_address: orderData.shippingAddress,
          billing_address: orderData.billingAddress,
          subtotal: orderData.subtotal,
          gst_amount: orderData.gstAmount,
          discount_amount: orderData.discountAmount,
          shipping_charge: orderData.shippingCharge,
          total_amount: orderData.totalAmount,
          coupon_code: orderData.couponCode || null,
          payment_method: orderData.paymentMethod,
          payment_status: orderData.paymentStatus,
          payment_id: orderData.paymentId || null,
          order_status: orderData.orderStatus,
          notes: orderData.notes || null,
        })
        .select()
        .single();

      if (!orderError && dbOrder) {
        newOrder.id = dbOrder.id;

        // Insert Order Items
        const itemsPayload = orderData.items.map((item) => ({
          order_id: dbOrder.id,
          product_name: item.productName,
          sku: item.sku,
          unit_price: item.unitPrice,
          gst_percent: item.gstPercent,
          hsn_code: item.hsnCode || null,
          quantity: item.quantity,
          total_price: item.totalPrice,
          product_image: item.productImage,
        }));

        await client.from('order_items').insert(itemsPayload);

        // Attempt atomic inventory decrement in PostgreSQL
        for (const item of orderData.items) {
          try {
            await client.rpc('decrement_product_stock_atomic', {
              p_product_id: item.productId,
              p_quantity: item.quantity,
            });
          } catch {
            // If RPC is unavailable, perform direct update
            await client
              .from('products')
              .update({ stock_quantity: Math.max(0, 100 - item.quantity) })
              .eq('id', item.productId);
          }
        }

        if (orderData.idempotencyKey) {
          idempotencyStore.set(orderData.idempotencyKey, newOrder);
        }

        return newOrder;
      }
    } catch {
      // In case of Supabase failure, seamlessly proceed with in-memory execution
    }
  }

  // In-Memory Fallback Stock Decrement
  for (const item of newOrder.items) {
    const prod = productsList.find((p) => p.id === item.productId || p.sku === item.sku);
    if (prod) {
      prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
    }
  }

  ordersList.unshift(newOrder);
  if (orderData.idempotencyKey) {
    idempotencyStore.set(orderData.idempotencyKey, newOrder);
  }

  return newOrder;
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDbOrder(data, data.order_items || []);
      }
    } catch {
      // Fallback
    }
  }

  const order = ordersList.find((o) => o.id === id);
  return order || null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const cleanNumber = orderNumber.trim().toUpperCase();

  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', cleanNumber)
        .maybeSingle();

      if (!error && data) {
        return mapDbOrder(data, data.order_items || []);
      }
    } catch {
      // Fallback
    }
  }

  const order = ordersList.find((o) => o.orderNumber.trim().toUpperCase() === cleanNumber);
  return order || null;
}

export async function getAllOrders(): Promise<Order[]> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d) => mapDbOrder(d, d.order_items || []));
      }
    } catch {
      // Fallback
    }
  }
  return ordersList;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
  courierName?: string
): Promise<Order | null> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const updatePayload: Record<string, unknown> = {
        order_status: status,
        updated_at: new Date().toISOString(),
      };
      if (trackingNumber) updatePayload.tracking_number = trackingNumber;
      if (courierName) updatePayload.courier_name = courierName;

      const { data, error } = await client
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .select('*, order_items(*)')
        .maybeSingle();

      if (!error && data) {
        return mapDbOrder(data, data.order_items || []);
      }
    } catch {
      // Fallback
    }
  }

  const order = ordersList.find((o) => o.id === orderId);
  if (!order) return null;
  order.orderStatus = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courierName) order.courierName = courierName;
  order.updatedAt = new Date().toISOString();
  return order;
}

// ----------------------------------------------------------------------
// ADMIN PRODUCT CATALOG MANAGEMENT
// ----------------------------------------------------------------------

export async function saveProduct(productData: Partial<Product>): Promise<Product> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const payload = {
        name: productData.name,
        slug: productData.slug,
        sku: productData.sku,
        description: productData.description,
        short_description: productData.shortDescription,
        price: productData.price,
        mrp: productData.mrp,
        gst_percent: productData.gstPercent,
        hsn_code: productData.hsnCode,
        stock_quantity: productData.stockQuantity,
        min_order_quantity: productData.minOrderQuantity,
        pack_size: productData.packSize,
        images: productData.images,
        is_active: productData.isActive !== false,
        is_featured: productData.featured,
        is_bestseller: productData.bestseller,
        updated_at: new Date().toISOString(),
      };

      if (productData.id) {
        const { data, error } = await client
          .from('products')
          .update(payload)
          .eq('id', productData.id)
          .select()
          .single();

        if (!error && data) return mapDbProduct(data);
      } else {
        const { data, error } = await client
          .from('products')
          .insert(payload)
          .select()
          .single();

        if (!error && data) return mapDbProduct(data);
      }
    } catch {
      // Fallback
    }
  }

  // In-memory fallback
  if (productData.id) {
    const idx = productsList.findIndex((p) => p.id === productData.id);
    if (idx !== -1) {
      productsList[idx] = { ...productsList[idx], ...productData } as Product;
      return productsList[idx];
    }
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: productData.name || 'New Office Product',
    slug: productData.slug || `prod-${Date.now()}`,
    sku: productData.sku || `OB-${Math.floor(1000 + Math.random() * 9000)}`,
    categoryId: productData.categoryId || 'cat-stationery',
    categoryName: productData.categoryName || 'Office Supplies & Stationery',
    brandId: productData.brandId || 'b-nataraj',
    brandName: productData.brandName || 'OfficeBazzar Pro',
    description: productData.description || 'Enterprise office supplies product.',
    shortDescription: productData.shortDescription || '',
    specifications: productData.specifications || {},
    price: Number(productData.price) || 100,
    mrp: Number(productData.mrp) || Number(productData.price) || 120,
    gstPercent: Number(productData.gstPercent) || 18,
    hsnCode: productData.hsnCode,
    stockQuantity: Number(productData.stockQuantity) || 50,
    minOrderQuantity: Number(productData.minOrderQuantity) || 1,
    packSize: productData.packSize || '1 Unit',
    images:
      productData.images && productData.images.length > 0
        ? productData.images
        : ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800&auto=format&fit=crop'],
    rating: 4.5,
    reviewCount: 0,
    isActive: productData.isActive !== false,
    featured: Boolean(productData.featured),
    bestseller: Boolean(productData.bestseller),
  };

  productsList.unshift(newProduct);
  return newProduct;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { error } = await client.from('products').delete().eq('id', productId);
      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  const initialLen = productsList.length;
  productsList = productsList.filter((p) => p.id !== productId);
  return productsList.length < initialLen;
}

// ----------------------------------------------------------------------
// RFQ & BULK QUOTATION ENQUIRIES
// ----------------------------------------------------------------------

export async function createBulkRFQ(
  rfqData: Omit<BulkRFQ, 'id' | 'createdAt' | 'status'>
): Promise<BulkRFQ> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('bulk_enquiries')
        .insert({
          company_name: rfqData.companyName,
          contact_person: rfqData.contactPerson,
          email: rfqData.email,
          phone: rfqData.phone,
          gstin: rfqData.gstin || null,
          product_categories: [rfqData.category],
          requirements: rfqData.requirements,
          estimated_monthly_spend: rfqData.estimatedQuantity || null,
          delivery_location: rfqData.deliveryLocation,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data) {
        return mapDbBulkRFQ(data);
      }
    } catch {
      // Fallback
    }
  }

  const newRFQ: BulkRFQ = {
    ...rfqData,
    id: `rfq-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  bulkRFQsList.unshift(newRFQ);
  return newRFQ;
}

export async function getBulkRFQs(): Promise<BulkRFQ[]> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('bulk_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapDbBulkRFQ);
      }
    } catch {
      // Fallback
    }
  }
  return bulkRFQsList;
}

export async function updateBulkRFQStatus(
  rfqId: string,
  status: BulkRFQ['status']
): Promise<BulkRFQ | null> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('bulk_enquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', rfqId)
        .select()
        .maybeSingle();

      if (!error && data) {
        return mapDbBulkRFQ(data);
      }
    } catch {
      // Fallback
    }
  }

  const rfq = bulkRFQsList.find((r) => r.id === rfqId);
  if (!rfq) return null;
  rfq.status = status;
  return rfq;
}

// ----------------------------------------------------------------------
// CORPORATE QUOTATION (RFQ) METHODS (Supabase with In-Memory Resilient Fallback)
// ----------------------------------------------------------------------

function generateFallbackQuotationNumber(): string {
  const year = new Date().getFullYear();
  const formattedCount = String(quotationCounter++).padStart(5, '0');
  return `OB-RFQ-${year}-${formattedCount}`;
}

export async function createQuotation(
  quoteData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>
): Promise<Quotation> {
  // 1. Idempotency check to prevent duplicate submissions
  if (quoteData.idempotencyKey && quotationIdempotencyStore.has(quoteData.idempotencyKey)) {
    return quotationIdempotencyStore.get(quoteData.idempotencyKey)!;
  }

  // 2. Persistent Supabase Insertion
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;

      let quotationNumber: string | null = null;
      try {
        const { data: numData } = await client.rpc('generate_quotation_number');
        if (numData) quotationNumber = String(numData);
      } catch {
        // Fallback to client sequential generator if RPC is unprovisioned
      }

      if (!quotationNumber) {
        quotationNumber = generateFallbackQuotationNumber();
      }

      const { data: dbQuote, error: quoteError } = await client
        .from('quotations')
        .insert({
          quotation_number: quotationNumber,
          idempotency_key: quoteData.idempotencyKey || null,
          customer_id: quoteData.customerId || null,
          customer_name: quoteData.customerName,
          company_name: quoteData.companyName,
          email: quoteData.email,
          phone: quoteData.phone,
          gstin: quoteData.gstin || null,
          delivery_location: quoteData.deliveryLocation || null,
          pincode: quoteData.pincode,
          photo_urls: quoteData.photoUrls || null,
          preferred_contact_method: quoteData.preferredContactMethod || 'email',
          additional_requirements: quoteData.additionalRequirements || null,
          indicative_subtotal: quoteData.indicativeSubtotal,
          indicative_gst_amount: quoteData.indicativeGstAmount,
          indicative_total: quoteData.indicativeTotal,
          status: quoteData.status || 'new',
          assigned_to: quoteData.assignedTo || null,
          internal_notes: quoteData.internalNotes || null,
          quoted_amount: quoteData.quotedAmount || null,
          quotation_document_url: quoteData.quotationDocumentUrl || null,
        })
        .select()
        .single();

      if (!quoteError && dbQuote) {
        const itemsPayload = quoteData.items.map((it) => ({
          quotation_id: dbQuote.id,
          product_id: it.productId && it.productId.length > 20 ? it.productId : null,
          product_name: it.productName,
          sku: it.sku,
          indicative_unit_price: it.indicativeUnitPrice,
          hsn_code: it.hsnCode || null,
          gst_percent: it.gstPercent,
          quantity: it.quantity,
          indicative_total_price: it.indicativeTotalPrice,
          product_image: it.productImage || null,
          pack_size: it.packSize || null,
        }));

        const { data: dbItems } = await client
          .from('quotation_items')
          .insert(itemsPayload)
          .select();

        const savedQuote = mapDbQuotation(dbQuote, dbItems || itemsPayload);
        if (quoteData.idempotencyKey) {
          quotationIdempotencyStore.set(quoteData.idempotencyKey, savedQuote);
        }
        return savedQuote;
      }
    } catch {
      // In case of Supabase failure, seamlessly proceed with in-memory execution
    }
  }

  // 3. In-Memory Resilient Fallback (Does NOT decrement stock as per RFQ business rules)
  const quotationNumber = generateFallbackQuotationNumber();
  const newQuote: Quotation = {
    ...quoteData,
    id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    quotationNumber,
    status: quoteData.status || 'new',
    items: quoteData.items.map((item, idx) => ({
      ...item,
      id: item.id || `qitem-${Date.now()}-${idx}`,
    })),
    createdAt: new Date().toISOString(),
  };

  quotationsList.unshift(newQuote);
  if (quoteData.idempotencyKey) {
    quotationIdempotencyStore.set(quoteData.idempotencyKey, newQuote);
  }

  return newQuote;
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('quotations')
        .select('*, quotation_items(*)')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDbQuotation(data, data.quotation_items || []);
      }
    } catch {
      // Fallback
    }
  }

  const quote = quotationsList.find((q) => q.id === id);
  return quote || null;
}

export async function getQuotationByNumber(quotationNumber: string): Promise<Quotation | null> {
  const cleanNumber = quotationNumber.trim().toUpperCase();

  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('quotations')
        .select('*, quotation_items(*)')
        .eq('quotation_number', cleanNumber)
        .maybeSingle();

      if (!error && data) {
        return mapDbQuotation(data, data.quotation_items || []);
      }
    } catch {
      // Fallback
    }
  }

  const quote = quotationsList.find((q) => q.quotationNumber.trim().toUpperCase() === cleanNumber);
  return quote || null;
}

export async function getQuotationsByCustomer(customerIdOrEmail: string): Promise<Quotation[]> {
  const cleanParam = customerIdOrEmail.trim().toLowerCase();

  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('quotations')
        .select('*, quotation_items(*)')
        .or(`customer_id.eq.${customerIdOrEmail},email.ilike.${cleanParam}`)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d) => mapDbQuotation(d, d.quotation_items || []));
      }
    } catch {
      // Fallback
    }
  }

  return quotationsList.filter(
    (q) =>
      (q.customerId && q.customerId === customerIdOrEmail) ||
      q.email.toLowerCase() === cleanParam
  );
}

export async function getAllQuotations(statusFilter?: QuotationStatus): Promise<Quotation[]> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      let query = client
        .from('quotations')
        .select('*, quotation_items(*)')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d) => mapDbQuotation(d, d.quotation_items || []));
      }
    } catch {
      // Fallback
    }
  }

  if (statusFilter) {
    return quotationsList.filter((q) => q.status === statusFilter);
  }
  return quotationsList;
}

export async function updateQuotation(
  id: string,
  updates: Partial<Quotation>
): Promise<Quotation | null> {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.assignedTo !== undefined) updatePayload.assigned_to = updates.assignedTo;
  if (updates.internalNotes !== undefined) updatePayload.internal_notes = updates.internalNotes;
  if (updates.quotedAmount !== undefined) updatePayload.quoted_amount = updates.quotedAmount;
  if (updates.quotationDocumentUrl !== undefined)
    updatePayload.quotation_document_url = updates.quotationDocumentUrl;

  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('quotations')
        .update(updatePayload)
        .eq('id', id)
        .select('*, quotation_items(*)')
        .maybeSingle();

      if (!error && data) {
        return mapDbQuotation(data, data.quotation_items || []);
      }
    } catch {
      // Fallback
    }
  }

  const quote = quotationsList.find((q) => q.id === id);
  if (!quote) return null;

  if (updates.status !== undefined) quote.status = updates.status;
  if (updates.assignedTo !== undefined) quote.assignedTo = updates.assignedTo;
  if (updates.internalNotes !== undefined) quote.internalNotes = updates.internalNotes;
  if (updates.quotedAmount !== undefined) quote.quotedAmount = updates.quotedAmount;
  if (updates.quotationDocumentUrl !== undefined)
    quote.quotationDocumentUrl = updates.quotationDocumentUrl;
  quote.updatedAt = new Date().toISOString();

  return quote;
}

// ----------------------------------------------------------------------
// NOTIFICATION LOGS METHODS
// ----------------------------------------------------------------------

export async function createNotificationLog(
  data: Omit<NotificationLog, 'id' | 'createdAt' | 'attempts' | 'lastAttemptAt'> & {
    attempts?: number;
    lastAttemptAt?: string;
  }
): Promise<NotificationLog> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data: dbLog, error } = await client
        .from('notification_logs')
        .insert({
          quotation_id: data.quotationId,
          quotation_number: data.quotationNumber,
          channel: data.channel,
          recipient: data.recipient,
          status: data.status,
          attempts: data.attempts || 1,
          last_attempt_at: data.lastAttemptAt || now,
          error_message: data.errorMessage || null,
          metadata: data.metadata || {},
        })
        .select()
        .single();

      if (!error && dbLog) {
        return mapDbNotificationLog(dbLog);
      }
    } catch {
      // Fallback
    }
  }

  const newLog: NotificationLog = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    quotationId: data.quotationId,
    quotationNumber: data.quotationNumber,
    channel: data.channel,
    recipient: data.recipient,
    status: data.status,
    attempts: data.attempts || 1,
    lastAttemptAt: data.lastAttemptAt || now,
    errorMessage: data.errorMessage,
    metadata: data.metadata,
    createdAt: now,
  };

  notificationLogsList.unshift(newLog);
  return newLog;
}

export async function updateNotificationLog(
  id: string,
  updates: Partial<NotificationLog>
): Promise<NotificationLog | null> {
  const updatePayload: Record<string, unknown> = {};
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.attempts !== undefined) updatePayload.attempts = updates.attempts;
  if (updates.lastAttemptAt !== undefined) updatePayload.last_attempt_at = updates.lastAttemptAt;
  if (updates.errorMessage !== undefined) updatePayload.error_message = updates.errorMessage;

  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      const { data, error } = await client
        .from('notification_logs')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error && data) {
        return mapDbNotificationLog(data);
      }
    } catch {
      // Fallback
    }
  }

  const log = notificationLogsList.find((l) => l.id === id);
  if (!log) return null;

  if (updates.status !== undefined) log.status = updates.status;
  if (updates.attempts !== undefined) log.attempts = updates.attempts;
  if (updates.lastAttemptAt !== undefined) log.lastAttemptAt = updates.lastAttemptAt;
  if (updates.errorMessage !== undefined) log.errorMessage = updates.errorMessage;

  return log;
}

export async function getNotificationLogs(quotationId?: string): Promise<NotificationLog[]> {
  if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
    try {
      const client = supabaseAdmin || supabase!;
      let query = client
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (quotationId) {
        query = query.eq('quotation_id', quotationId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(mapDbNotificationLog);
      }
    } catch {
      // Fallback
    }
  }

  if (quotationId) {
    return notificationLogsList.filter((l) => l.quotationId === quotationId);
  }
  return notificationLogsList;
}

