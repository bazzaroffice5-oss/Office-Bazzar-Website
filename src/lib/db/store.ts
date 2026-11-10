import { cache } from 'react';
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
import { getProductsFromZoho } from '@/lib/zoho/products';
import {
  getAllQuotationsFromZoho,
  getQuoteByReferenceFromZoho,
  getCustomerQuotationsFromZoho,
} from '@/lib/zoho/quotes';
import { syncOrderToZohoSalesOrder, updateZohoSalesOrderStatus } from '@/lib/zoho/orders';
import { syncBulkRfqToZohoLead } from '@/lib/zoho/crm';

// Shared store state attached to globalThis to prevent process/worker boundary divergence in Next.js
interface GlobalStoreState {
  productsList: Product[];
  ordersList: Order[];
  bulkRFQsList: BulkRFQ[];
  quotationsList: Quotation[];
  quotationCounter: number;
  notificationLogsList: NotificationLog[];
}

function loadCustomProductsFromDisk(): Product[] {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const pathsToCheck = [
        path.join(process.cwd(), 'src', 'lib', 'data', 'custom_products.json'),
        path.resolve(process.cwd(), '..', 'Product-Added-Admin-Panel', 'src', 'lib', 'data', 'custom_products.json'),
      ];
      for (const filePath of pathsToCheck) {
        if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
          const raw = fs.readFileSync(/*turbopackIgnore: true*/ filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function persistCustomProductsToDisk(products: Product[]) {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'custom_products.json');
      const initialIds = new Set(INITIAL_PRODUCTS.map((p) => p.id));
      const customOnly = products.filter((p) => !initialIds.has(p.id));
      fs.writeFileSync(filePath, JSON.stringify(customOnly, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }
}

const globalForStore = globalThis as unknown as {
  __officeBazzarStore?: GlobalStoreState;
};

if (!globalForStore.__officeBazzarStore) {
  const diskProducts = loadCustomProductsFromDisk();
  const initialMap = new Map<string, Product>();
  // Custom products take priority
  for (const p of diskProducts) {
    initialMap.set(p.id, p);
  }
  for (const p of INITIAL_PRODUCTS) {
    if (!initialMap.has(p.id)) {
      initialMap.set(p.id, p);
    }
  }

  globalForStore.__officeBazzarStore = {
    productsList: Array.from(initialMap.values()),
    ordersList: [],
    bulkRFQsList: [],
    quotationsList: [],
    quotationCounter: 1,
    notificationLogsList: [],
  };
}

const storeState = globalForStore.__officeBazzarStore;
let productsList: Product[] = storeState.productsList;
const ordersList: Order[] = storeState.ordersList;
const bulkRFQsList: BulkRFQ[] = storeState.bulkRFQsList;
const idempotencyStore = new Map<string, Order>();

// Quotation & Notification In-Memory Fallback State
let quotationCounter = storeState.quotationCounter;
const quotationsList: Quotation[] = storeState.quotationsList;
const quotationIdempotencyStore = new Map<string, Quotation>();
const notificationLogsList: NotificationLog[] = storeState.notificationLogsList;

function syncCustomProducts() {
  const disk = loadCustomProductsFromDisk();
  for (const dp of disk) {
    const idx = storeState.productsList.findIndex((p) => p.id === dp.id);
    if (idx !== -1) {
      storeState.productsList[idx] = dp;
    } else {
      storeState.productsList.unshift(dp);
    }
  }
  productsList = storeState.productsList;
}

// ----------------------------------------------------------------------
// PRODUCT CATALOG METHODS (Primary Database: Zoho CRM Products Module)
// ----------------------------------------------------------------------

export async function getProducts(filters?: FilterParams): Promise<{ products: Product[]; total: number }> {
  // Primary: Authoritative catalog sourced directly from Zoho CRM (with server-side edge caching)
  syncCustomProducts();
  const zohoProducts = await getProductsFromZoho();
  let result = (zohoProducts && zohoProducts.length > 0 ? zohoProducts : storeState.productsList).filter(
    (p) => p.isActive !== false
  );

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
  const limit = filters?.limit ?? 5000;
  const startIndex = (page - 1) * limit;
  const paginated = result.slice(startIndex, startIndex + limit);

  return { products: paginated, total };
}

export async function getAdminProducts(): Promise<Product[]> {
  const products = await getProductsFromZoho();
  return products && products.length > 0 ? products : [...storeState.productsList];
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const products = await getProductsFromZoho();
  const pool = products && products.length > 0 ? products : storeState.productsList;

  const product = pool.find(
    (p) =>
      (p.slug.toLowerCase() === cleanSlug ||
        p.sku.toLowerCase() === cleanSlug ||
        p.id.toLowerCase() === cleanSlug ||
        ((p as any).zohoProductId && (p as any).zohoProductId === cleanSlug)) &&
      p.isActive !== false
  );
  return product || null;
});

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  if (!id || typeof id !== 'string') return null;
  const cleanId = id.trim();
  const products = await getProductsFromZoho();
  const pool = products && products.length > 0 ? products : storeState.productsList;

  const product = pool.find(
    (p) =>
      p.id === cleanId ||
      p.sku.toLowerCase() === cleanId.toLowerCase() ||
      ((p as any).zohoProductId && (p as any).zohoProductId === cleanId)
  );
  return product || null;
});

export async function getCategories(): Promise<Category[]> {
  return CATEGORIES;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const resolved = resolveMainCategory(slug);
  if (resolved) return resolved;
  const cat = CATEGORIES.find((c) => c.slug === slug || c.id === slug);
  return cat || null;
}

export async function getBrands(): Promise<Brand[]> {
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
  const pool = (allCatalog.length > 0 ? allCatalog : productsList).filter((p) => p.isActive !== false);

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
// COUPON VERIFICATION
// ----------------------------------------------------------------------

export async function validateCoupon(
  code: string,
  cartTotal: number
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const cleanCode = code.trim().toUpperCase();
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
// ORDER CREATION & MANAGEMENT (Authoritative Database: Zoho CRM Sales_Orders)
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
  }

  const orderNumber = `OB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderId = `ord-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const newOrder: Order = {
    ...orderData,
    id: orderId,
    orderNumber,
    originalOrderNumber: orderNumber,
    createdAt,
    auditTrail: [
      {
        timestamp: createdAt,
        action: 'order_created',
        newValue: orderNumber,
        reason: 'Order placed by customer with immutable canonical reference',
        actor: 'store_checkout',
      },
    ],
  };

  // 2. Atomic Inventory Decrement in runtime memory
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

  // 3. Authoritative Order Synchronization to Zoho CRM Sales_Orders Module
  syncOrderToZohoSalesOrder(newOrder)
    .then((res) => {
      if (res.salesOrderId) {
        newOrder.zohoSalesOrderId = res.salesOrderId;
      }
    })
    .catch((zohoErr) =>
      console.error(`[Order Service] Failed to sync Order #${orderNumber} to Zoho Sales Orders:`, zohoErr)
    );

  return newOrder;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const order = ordersList.find((o) => o.id === id);
  return order || null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const cleanNumber = orderNumber.trim().toUpperCase();
  const order = ordersList.find(
    (o) =>
      o.orderNumber.trim().toUpperCase() === cleanNumber ||
      (o.originalOrderNumber && o.originalOrderNumber.trim().toUpperCase() === cleanNumber)
  );
  return order || null;
}

export async function getAllOrders(): Promise<Order[]> {
  return ordersList;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
  courierName?: string,
  actor = 'system'
): Promise<Order | null> {
  const order = ordersList.find((o) => o.id === orderId);
  if (!order) return null;
  const previousStatus = order.orderStatus;
  order.orderStatus = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courierName) order.courierName = courierName;
  const timestamp = new Date().toISOString();
  order.updatedAt = timestamp;

  if (!order.auditTrail) order.auditTrail = [];
  order.auditTrail.push({
    timestamp,
    action: 'status_updated',
    previousValue: previousStatus,
    newValue: status,
    reason: trackingNumber ? `Tracking added: ${trackingNumber} (${courierName || 'standard'})` : 'Status transition',
    actor,
  });

  // Sync update to Zoho CRM Sales_Orders
  updateZohoSalesOrderStatus(order.orderNumber, status, order.paymentStatus, order.paymentId, order.customerName).catch((e) =>
    console.warn(`[Order Service] Failed to update Zoho Sales Order status for ${order.orderNumber}:`, e)
  );

  return order;
}

// ----------------------------------------------------------------------
// ADMIN PRODUCT CATALOG MANAGEMENT
// ----------------------------------------------------------------------

export async function saveProduct(productData: Partial<Product>): Promise<Product> {
  const generatedSlug =
    productData.slug ||
    (productData.name
      ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : `prod-${Date.now()}`);

  const generatedSku =
    productData.sku ||
    `OB-${Math.floor(100000 + Math.random() * 900000)}`;

  const newProduct: Product = {
    id: productData.id || `prod-${Date.now()}`,
    name: productData.name || 'Untitled Product',
    slug: generatedSlug,
    sku: generatedSku,
    categoryId: productData.categoryId || '',
    categoryName: productData.categoryName || 'Office Supplies',
    subcategoryId: productData.subcategoryId,
    subcategoryName: productData.subcategoryName,
    brandId: productData.brandId || '',
    brandName: productData.brandName || 'OfficeBazzar',
    description: productData.description || '',
    shortDescription: productData.shortDescription,
    specifications: productData.specifications || {},
    price: productData.price !== undefined ? productData.price : null,
    mrp: productData.mrp !== undefined ? productData.mrp : null,
    gstPercent: productData.gstPercent || 18,
    hsnCode: productData.hsnCode,
    stockQuantity: productData.stockQuantity || 0,
    minOrderQuantity: productData.minOrderQuantity || 1,
    packSize: productData.packSize || '1 Unit',
    images: productData.images || [],
    featured: Boolean(productData.featured),
    bestseller: Boolean(productData.bestseller),
    rating: productData.rating || null,
    reviewCount: productData.reviewCount || 0,
    isPriceVerified: Boolean(productData.isPriceVerified),
    requiresManualReview: Boolean(productData.requiresManualReview ?? true),
    isActive: productData.isActive !== false,
  };

  const existingIdx = storeState.productsList.findIndex(
    (p) => p.id === newProduct.id || p.sku === newProduct.sku
  );
  if (existingIdx !== -1) {
    storeState.productsList[existingIdx] = { ...storeState.productsList[existingIdx], ...newProduct };
  } else {
    storeState.productsList.unshift(newProduct);
  }
  productsList = storeState.productsList;
  persistCustomProductsToDisk(storeState.productsList);

  return newProduct;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const initialLen = storeState.productsList.length;
  storeState.productsList = storeState.productsList.filter((p) => p.id !== productId);
  productsList = storeState.productsList;
  persistCustomProductsToDisk(storeState.productsList);
  return storeState.productsList.length < initialLen;
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
}): Promise<Category> {
  const slug =
    data.slug ||
    data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const id = `cat-${slug}`;

  const newCat: Category = {
    id,
    name: data.name.trim(),
    slug,
    description: data.description,
    subcategories: [],
  };
  CATEGORIES.push(newCat);
  return newCat;
}

export async function createBrand(data: {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
}): Promise<Brand> {
  const slug =
    data.slug ||
    data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const id = `brand-${slug}`;

  const newBrand: Brand = {
    id,
    name: data.name.trim(),
    slug,
    description: data.description,
    logoUrl: data.logoUrl,
  };
  BRANDS.push(newBrand);
  return newBrand;
}

// ----------------------------------------------------------------------
// RFQ & BULK QUOTATION ENQUIRIES (Authoritative Database: Zoho CRM Leads)
// ----------------------------------------------------------------------

export async function createBulkRFQ(
  rfqData: Omit<BulkRFQ, 'id' | 'createdAt' | 'status'>
): Promise<BulkRFQ> {
  const newRFQ: BulkRFQ = {
    ...rfqData,
    id: `rfq-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  bulkRFQsList.unshift(newRFQ);

  // Synchronize Bulk RFQ directly to Zoho CRM Leads module
  syncBulkRfqToZohoLead({
    companyName: rfqData.companyName,
    contactPerson: rfqData.contactPerson,
    email: rfqData.email,
    phone: rfqData.phone,
    category: rfqData.category,
    requirements: rfqData.requirements,
    estimatedQuantity: rfqData.estimatedQuantity,
    deliveryLocation: rfqData.deliveryLocation,
    gstin: rfqData.gstin,
  }).catch((zohoErr) =>
    console.error(`[BulkRFQ Service] Failed to sync RFQ ${newRFQ.id} to Zoho CRM Leads:`, zohoErr)
  );

  return newRFQ;
}

export async function getBulkRFQs(): Promise<BulkRFQ[]> {
  return bulkRFQsList;
}

export async function updateBulkRFQStatus(
  rfqId: string,
  status: BulkRFQ['status']
): Promise<BulkRFQ | null> {
  const rfq = bulkRFQsList.find((r) => r.id === rfqId);
  if (!rfq) return null;
  rfq.status = status;
  return rfq;
}

// ----------------------------------------------------------------------
// CORPORATE QUOTATION (RFQ) METHODS (Authoritative Primary Database: Zoho CRM)
// ----------------------------------------------------------------------

function generateFallbackQuotationNumber(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(quotationCounter++).padStart(4, '0');
  return `OB-RFQ-${y}${m}${d}-${seq}`;
}

export async function createQuotation(
  quoteData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'> & { quotationNumber?: string }
): Promise<Quotation> {
  // 1. Idempotency check to prevent duplicate submissions
  if (quoteData.idempotencyKey && quotationIdempotencyStore.has(quoteData.idempotencyKey)) {
    return quotationIdempotencyStore.get(quoteData.idempotencyKey)!;
  }

  // 2. Construct Quotation object for authoritative Zoho CRM registration
  const quotationNumber = quoteData.quotationNumber?.trim() || generateFallbackQuotationNumber();
  const mappedItems = quoteData.items.map((item, idx) => ({
    ...item,
    id: item.id || `qitem-${Date.now()}-${idx}`,
    originalQuantity: item.originalQuantity ?? item.quantity,
    originalUnitPrice: item.originalUnitPrice ?? item.indicativeUnitPrice,
  }));

  const originalItems =
    quoteData.originalItems && quoteData.originalItems.length > 0
      ? quoteData.originalItems
      : mappedItems.map((it) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        hsnCode: it.hsnCode,
        packSize: it.packSize,
        originalQuantity: it.quantity,
        indicativeUnitPrice: it.indicativeUnitPrice,
        gstPercent: it.gstPercent,
        indicativeTotalPrice: it.indicativeTotalPrice,
      }));

  const newQuote: Quotation = {
    ...quoteData,
    id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    quotationNumber,
    status: quoteData.status || 'new',
    items: mappedItems,
    originalItems,
    subtotal: quoteData.indicativeSubtotal,
    discountPercent: 0,
    discountAmount: 0,
    gstPercent: 18,
    gstAmount: quoteData.indicativeGstAmount,
    deliveryCharges: 0,
    additionalCharges: 0,
    grandTotal: quoteData.indicativeTotal,
    version: 1,
    createdAt: new Date().toISOString(),
  };

  quotationsList.unshift(newQuote);
  if (quoteData.idempotencyKey) {
    quotationIdempotencyStore.set(quoteData.idempotencyKey, newQuote);
  }

  return newQuote;
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  // 1. Primary authoritative lookup in Zoho CRM
  const zohoQuote = await getQuoteByReferenceFromZoho(id);
  if (zohoQuote) {
    const idx = quotationsList.findIndex(
      (q) => q.id === zohoQuote.id || q.quotationNumber === zohoQuote.quotationNumber
    );
    if (idx !== -1) {
      quotationsList[idx] = zohoQuote;
    } else {
      quotationsList.unshift(zohoQuote);
    }
    return zohoQuote;
  }

  // 2. Fallback to runtime list
  const quote = quotationsList.find((q) => q.id === id || q.quotationNumber === id);
  return quote || null;
}

export async function getQuotationByNumber(quotationNumber: string): Promise<Quotation | null> {
  const cleanNumber = quotationNumber.trim().toUpperCase();
  const zohoQuote = await getQuoteByReferenceFromZoho(cleanNumber);
  if (zohoQuote) {
    return zohoQuote;
  }
  const quote = quotationsList.find((q) => q.quotationNumber.trim().toUpperCase() === cleanNumber);
  return quote || null;
}

export async function getQuotationsByCustomer(customerIdOrEmail: string): Promise<Quotation[]> {
  const cleanParam = customerIdOrEmail.trim().toLowerCase();
  const zohoQuotes = await getCustomerQuotationsFromZoho(cleanParam);
  if (zohoQuotes.length > 0) {
    return zohoQuotes;
  }
  return quotationsList.filter(
    (q) =>
      (q.customerId && q.customerId === customerIdOrEmail) ||
      q.email.toLowerCase() === cleanParam
  );
}

export async function getAllQuotations(statusFilter?: QuotationStatus): Promise<Quotation[]> {
  const zohoQuotes = await getAllQuotationsFromZoho();
  const mergedMap = new Map<string, Quotation>();

  for (const zq of zohoQuotes) {
    mergedMap.set(zq.quotationNumber, zq);
  }
  for (const mq of quotationsList) {
    if (!mergedMap.has(mq.quotationNumber)) {
      mergedMap.set(mq.quotationNumber, mq);
    }
  }

  const all = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (statusFilter) {
    return all.filter((q) => q.status === statusFilter);
  }
  return all;
}

export async function updateQuotation(
  id: string,
  updates: Partial<Quotation>
): Promise<Quotation | null> {
  const quote = quotationsList.find((q) => q.id === id || q.quotationNumber === id);
  if (!quote) return null;

  Object.assign(quote, updates, { updatedAt: new Date().toISOString() });
  return quote;
}

// ----------------------------------------------------------------------
// NOTIFICATION LOGS METHODS (Runtime Store)
// ----------------------------------------------------------------------

export async function createNotificationLog(
  data: Omit<NotificationLog, 'id' | 'createdAt' | 'attempts' | 'lastAttemptAt'> & {
    attempts?: number;
    lastAttemptAt?: string;
  }
): Promise<NotificationLog> {
  const now = new Date().toISOString();

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
  const log = notificationLogsList.find((l) => l.id === id);
  if (!log) return null;

  if (updates.status !== undefined) log.status = updates.status;
  if (updates.attempts !== undefined) log.attempts = updates.attempts;
  if (updates.lastAttemptAt !== undefined) log.lastAttemptAt = updates.lastAttemptAt;
  if (updates.errorMessage !== undefined) log.errorMessage = updates.errorMessage;

  return log;
}

export async function getNotificationLogs(quotationId?: string): Promise<NotificationLog[]> {
  if (quotationId) {
    return notificationLogsList.filter((l) => l.quotationId === quotationId);
  }
  return notificationLogsList;
}
