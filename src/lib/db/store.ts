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
  QuotationItem,
  QuotationStatus,
  NotificationLog,
} from '@/types';
import { CATEGORIES, BRANDS, INITIAL_PRODUCTS, COUPONS, resolveMainCategory, NINE_SUBCATEGORIES, ALL_SUBCATEGORIES, CATEGORY_MAP, isProductInSubcategory } from '@/lib/data/catalog';
import { getProductsFromZoho, getCachedProductBySlug, getCachedProductById, isZohoCacheSynced, getZohoDeletedSkus, recordZohoDeletedSku, isSkuOrIdDeleted } from '@/lib/zoho/products';
import {
  getAllQuotationsFromZoho,
  getQuoteByReferenceFromZoho,
  getCustomerQuotationsFromZoho,
} from '@/lib/zoho/quotes';
import { syncOrderToZohoSalesOrder, updateZohoSalesOrderStatus } from '@/lib/zoho/orders';
import { syncBulkRfqToZohoLead } from '@/lib/zoho/crm';
import {
  saveCustomProductDurable,
  loadDurableCustomProducts,
  getCustomProductBySlugDurable,
  getCustomProductByIdDurable,
  isProductDeletedDurable,
  getCustomVersionDurable,
} from '@/lib/products/custom-store';
import {
  saveDurableProductOverride,
  deleteDurableProductOverride,
  getDurableProductState,
  getDurableQuotationById,
} from '@/lib/durable-store';

// Shared store state attached to globalThis to prevent process/worker boundary divergence in Next.js
interface GlobalStoreState {
  productsList: Product[];
  ordersList: Order[];
  bulkRFQsList: BulkRFQ[];
  quotationsList: Quotation[];
  quotationCounter: number;
  notificationLogsList: NotificationLog[];
}

function loadCustomProductsFromDisk(): Array<Product & { isDeleted?: boolean }> {
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

function persistCustomProductsToDisk(products: Array<Product & { isDeleted?: boolean }>) {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'custom_products.json');
      fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
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

// Quotation & Notification In-Memory & Durable State
let quotationCounter = storeState.quotationCounter;
const quotationsList: Quotation[] = storeState.quotationsList;
const quotationIdempotencyStore = new Map<string, Quotation>();
for (const q of quotationsList) {
  if (q.idempotencyKey) {
    quotationIdempotencyStore.set(q.idempotencyKey, q);
  }
}
const notificationLogsList: NotificationLog[] = storeState.notificationLogsList;

let lastSyncCustomTime = 0;
let lastKnownCustomVersion = '';
const SYNC_CUSTOM_THROTTLE_MS = 60 * 1000; // 60-second throttle to prevent blocking Cloudinary roundtrips on public browsing

async function syncCustomProducts(force = false) {
  const now = Date.now();
  if (!force && now - lastSyncCustomTime < SYNC_CUSTOM_THROTTLE_MS && storeState.productsList.length > 0) {
    return;
  }
  lastSyncCustomTime = now;

  let remoteVersion = '';
  try {
    remoteVersion = await getCustomVersionDurable();
  } catch {
    // ignore
  }

  if (!force && remoteVersion && remoteVersion === lastKnownCustomVersion && storeState.productsList.length > 0) {
    return;
  }
  if (remoteVersion) {
    lastKnownCustomVersion = remoteVersion;
  }

  const disk = loadCustomProductsFromDisk();
  let durable: any[] = [];
  try {
    durable = await loadDurableCustomProducts(true);
  } catch {
    durable = [];
  }
  const combined = [...disk, ...durable];
  for (const dp of combined) {
    if (dp.isDeleted) {
      storeState.productsList = storeState.productsList.filter(
        (p) => p.id !== dp.id && p.sku.toUpperCase() !== (dp.sku || '').toUpperCase()
      );
      continue;
    }
    const idx = storeState.productsList.findIndex(
      (p) => p.id === dp.id || p.sku.toUpperCase() === (dp.sku || '').toUpperCase()
    );
    if (idx !== -1) {
      // Preserve live Zoho CRM Note data (including images & edits) so stale disk/tmp data never overwrites it
      const current = storeState.productsList[idx];
      storeState.productsList[idx] = {
        ...dp,
        ...current,
        images: current.images && current.images.length > 0 ? current.images : (dp.images || []),
      };
    } else {
      storeState.productsList.unshift(dp);
    }
  }

  // Guaranteed Cloudinary raw JSON state store overlay (authoritative overrides)
  try {
    const cloudState = await getDurableProductState(force);
    if (cloudState && cloudState.products) {
      const deletedSet = new Set(cloudState.deletedSkus.map((s) => s.toUpperCase()));
      const unpubSet = new Set(cloudState.unpublishedSkus.map((s) => s.toUpperCase()));

      for (const [skuKey, cp] of Object.entries(cloudState.products)) {
        if (!cp || typeof cp !== 'object') continue;
        const sUpper = (cp.sku || skuKey).toUpperCase();
        if (deletedSet.has(sUpper)) continue;

        const isUnpublished = unpubSet.has(sUpper) || cp.isActive === false || cp.publishStatus === 'unpublished';
        const resolved: Product = {
          ...cp,
          sku: sUpper,
          isActive: !isUnpublished,
          publishStatus: isUnpublished ? 'unpublished' : 'published',
        } as Product;

        const exIdx = storeState.productsList.findIndex(
          (p) => p.id === resolved.id || p.sku.toUpperCase() === sUpper
        );
        if (exIdx !== -1) {
          storeState.productsList[exIdx] = {
            ...storeState.productsList[exIdx],
            ...resolved,
            images: resolved.images && resolved.images.length > 0 ? resolved.images : storeState.productsList[exIdx].images,
          };
        } else {
          storeState.productsList.unshift(resolved);
        }
      }

      // Filter deleted from storeState
      if (deletedSet.size > 0) {
        storeState.productsList = storeState.productsList.filter(
          (p) => !deletedSet.has(p.sku.toUpperCase()) && (!p.id || !deletedSet.has(p.id.toUpperCase()))
        );
      }

      // Apply unpublished flag to storeState
      if (unpubSet.size > 0) {
        for (const p of storeState.productsList) {
          if (unpubSet.has(p.sku.toUpperCase()) || (p.id && unpubSet.has(p.id.toUpperCase()))) {
            p.isActive = false;
            (p as any).publishStatus = 'unpublished';
          }
        }
      }
    }
  } catch (cloudErr) {
    console.warn('[Store] Cloudinary state store sync notice:', cloudErr);
  }

  productsList = storeState.productsList;
}

// ----------------------------------------------------------------------
// PRODUCT CATALOG METHODS (Primary Database: Zoho CRM Products Module)
// ----------------------------------------------------------------------

export async function getProducts(filters?: FilterParams): Promise<{ products: Product[]; total: number }> {
  // Primary: Authoritative catalog sourced directly from Zoho CRM (with server-side edge caching)
  const zohoProducts = await getProductsFromZoho();
  if (zohoProducts && zohoProducts.length > 0) {
    storeState.productsList = zohoProducts;
  }
  await syncCustomProducts();
  const deletedSkus = await getZohoDeletedSkus();
  let result = storeState.productsList.filter(
    (p) =>
      p.isActive !== false &&
      !(p as any).isDeleted &&
      !deletedSkus.has(p.sku.toUpperCase()) &&
      (!p.id || !deletedSkus.has(p.id.toUpperCase())) &&
      (!p.slug || !deletedSkus.has(p.slug.toUpperCase()))
  );

  if (filters?.query) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.subcategoryName?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (filters?.category) {
    const resolvedCat = resolveMainCategory(filters.category);
    if (resolvedCat) {
      result = result.filter((p) => {
        const pMain = resolveMainCategory(p.categoryId) || resolveMainCategory(p.subcategoryId) || resolveMainCategory(p.categoryName);
        if (pMain) {
          return pMain.id === resolvedCat.id || pMain.slug === resolvedCat.slug;
        }
        if (p.categoryId === resolvedCat.id || p.categoryId === resolvedCat.slug) return true;
        if (p.categoryName?.toLowerCase() === resolvedCat.name.toLowerCase()) return true;
        const mapped = CATEGORY_MAP[p.subcategoryId || ''] || CATEGORY_MAP[p.categoryId || ''];
        if (mapped && (mapped.mainId === resolvedCat.id || mapped.mainSlug === resolvedCat.slug)) {
          return true;
        }
        return false;
      });
    } else {
      const catLower = filters.category.toLowerCase().trim();
      result = result.filter((p) => {
        const pMain = resolveMainCategory(p.categoryId) || resolveMainCategory(p.subcategoryId) || resolveMainCategory(p.categoryName);
        if (pMain && (pMain.id === catLower || pMain.slug === catLower || pMain.name.toLowerCase() === catLower)) {
          return true;
        }
        return (
          p.categoryId?.toLowerCase() === catLower ||
          p.categoryName.toLowerCase().includes(catLower) ||
          p.subcategoryId?.toLowerCase() === catLower
        );
      });
    }
  }

  if (filters?.subcategory) {
    result = result.filter((p) => isProductInSubcategory(p, filters.subcategory!));
  }

  if (filters?.brand) {
    const bSlug = filters.brand.toLowerCase();
    result = result.filter(
      (p) =>
        p.brandId?.toLowerCase() === bSlug ||
        p.brandName?.toLowerCase() === bSlug ||
        p.brandName?.toLowerCase().replace(/\s+/g, '-') === bSlug
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

  // Sorting with deterministic SKU tie-breaker to ensure stable pagination
  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'price_asc':
      case 'price-low':
        result.sort((a, b) => {
          const diff = (a.price ?? 0) - (b.price ?? 0);
          if (diff !== 0) return diff;
          return a.sku.localeCompare(b.sku);
        });
        break;
      case 'price_desc':
      case 'price-high':
        result.sort((a, b) => {
          const diff = (b.price ?? 0) - (a.price ?? 0);
          if (diff !== 0) return diff;
          return a.sku.localeCompare(b.sku);
        });
        break;
      case 'rating':
        result.sort((a, b) => {
          const diff = (b.rating ?? 0) - (a.rating ?? 0);
          if (diff !== 0) return diff;
          return a.sku.localeCompare(b.sku);
        });
        break;
      case 'name':
        result.sort((a, b) => {
          const diff = a.name.localeCompare(b.name);
          if (diff !== 0) return diff;
          return a.sku.localeCompare(b.sku);
        });
        break;
      case 'newest':
        result.sort((a, b) => {
          const diff = b.id.localeCompare(a.id);
          if (diff !== 0) return diff;
          return a.sku.localeCompare(b.sku);
        });
        break;
      case 'relevance':
      default:
        result.sort((a, b) => {
          if (a.bestseller && !b.bestseller) return -1;
          if (!a.bestseller && b.bestseller) return 1;
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
          if (ratingDiff !== 0) return ratingDiff;
          return a.sku.localeCompare(b.sku);
        });
        break;
    }
  }

  const total = result.length;
  const page = Math.max(1, filters?.page || 1);
  const limit = Math.max(1, Math.min(filters?.limit ?? 50, 5000));
  const startIndex = (page - 1) * limit;
  const paginated = result.slice(startIndex, startIndex + limit);

  return { products: paginated, total };
}

export interface CatalogFilterMetadata {
  categoryCounts: Record<string, number>;
  subcategoryCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  availableBrands: { id: string; name: string }[];
  totalActiveProducts: number;
}

export const getCatalogFilterMetadata = cache(async (): Promise<CatalogFilterMetadata> => {
  const zohoProducts = await getProductsFromZoho();
  if (zohoProducts && zohoProducts.length > 0) {
    storeState.productsList = zohoProducts;
  }
  await syncCustomProducts();
  const deletedSkus = await getZohoDeletedSkus();
  const pool = storeState.productsList.filter(
    (p) =>
      p.isActive !== false &&
      !(p as any).isDeleted &&
      !deletedSkus.has(p.sku.toUpperCase()) &&
      (!p.id || !deletedSkus.has(p.id.toUpperCase())) &&
      (!p.slug || !deletedSkus.has(p.slug.toUpperCase()))
  );

  const brandMap = new Map<string, { id: string; name: string }>();
  BRANDS.forEach((b) => {
    brandMap.set(b.id, { id: b.id, name: b.name });
  });

  const categoryCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};

  pool.forEach((p) => {
    const mainCat = resolveMainCategory(p.categoryId) || resolveMainCategory(p.subcategoryId) || resolveMainCategory(p.categoryName);
    if (mainCat) {
      categoryCounts[mainCat.id] = (categoryCounts[mainCat.id] || 0) + 1;
      categoryCounts[mainCat.slug] = categoryCounts[mainCat.id];
    } else if (p.categoryId) {
      categoryCounts[p.categoryId] = (categoryCounts[p.categoryId] || 0) + 1;
    }
    const bId = p.brandId || p.brandName?.toLowerCase().replace(/\s+/g, '-');
    if (bId) {
      brandCounts[bId] = (brandCounts[bId] || 0) + 1;
    }
    if (p.brandName) {
      const id = p.brandId || p.brandName.toLowerCase().replace(/\s+/g, '-');
      if (!brandMap.has(id)) {
        brandMap.set(id, { id, name: p.brandName });
      }
    }
  });

  const subcategoryCounts: Record<string, number> = {};
  ALL_SUBCATEGORIES.forEach((s) => {
    const count = pool.filter((p) => isProductInSubcategory(p, s.slug)).length;
    subcategoryCounts[s.slug] = count;
    subcategoryCounts[s.id] = count;
  });

  const availableBrands = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return {
    categoryCounts,
    subcategoryCounts,
    brandCounts,
    availableBrands,
    totalActiveProducts: pool.length,
  };
});

async function ensureCatalogSynced(force = false): Promise<Product[]> {
  if (force || !isZohoCacheSynced()) {
    const products = await getProductsFromZoho(force);
    if (products && products.length > 0) {
      storeState.productsList = products;
    }
  }
  return storeState.productsList;
}

export async function getAdminProducts(): Promise<Product[]> {
  const products = await getProductsFromZoho(true);
  const pool = products && products.length > 0 ? products : [...storeState.productsList];
  const deletedSkus = await getZohoDeletedSkus();
  return pool.filter(
    (p) =>
      !(p as any).isDeleted &&
      !deletedSkus.has(p.sku.toUpperCase()) &&
      (!p.id || !deletedSkus.has(p.id.toUpperCase())) &&
      (!p.slug || !deletedSkus.has(p.slug.toUpperCase()))
  );
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!slug) return null;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const deletedSkus = await getZohoDeletedSkus();
  if (deletedSkus.has(cleanSlug.toUpperCase())) return null;

  // 1. Authoritative: Ensure catalog has been synchronized with Zoho CRM Notes first
  await ensureCatalogSynced(false);

  // 2. Instant O(1) in-memory index from authoritative Zoho CRM catalog
  const cached = getCachedProductBySlug(cleanSlug);
  if (cached && cached.isActive !== false && !(cached as any).isDeleted) {
    if (cached.sku) {
      if (deletedSkus.has(cached.sku.toUpperCase())) return null;
      const isDeleted = await isProductDeletedDurable(cached.sku);
      if (isDeleted) return null;
    }
    if (cached.id && deletedSkus.has(cached.id.toUpperCase())) return null;
    return cached;
  }

  // 3. Fallback: Durable custom product lookup (~15ms directly from KV)
  try {
    const durableMatch = await getCustomProductBySlugDurable(cleanSlug);
    if (durableMatch) {
      if (durableMatch.isActive === false || durableMatch.isDeleted) return null;
      if (deletedSkus.has(durableMatch.sku.toUpperCase())) return null;
      if (durableMatch.id && deletedSkus.has(durableMatch.id.toUpperCase())) return null;
      return durableMatch;
    }
  } catch {
    // continue to active catalog pool
  }

  // 4. Fallback to active catalog pool
  const pool = storeState.productsList;

  const product = pool.find(
    (p) =>
      (p.slug.toLowerCase() === cleanSlug ||
        p.sku.toLowerCase() === cleanSlug ||
        p.id.toLowerCase() === cleanSlug ||
        ((p as any).zohoProductId && (p as any).zohoProductId === cleanSlug)) &&
      p.isActive !== false &&
      !(p as any).isDeleted &&
      !deletedSkus.has(p.sku.toUpperCase()) &&
      (!p.id || !deletedSkus.has(p.id.toUpperCase())) &&
      (!p.slug || !deletedSkus.has(p.slug.toUpperCase()))
  );

  if (product && product.sku) {
    const isDeleted = await isProductDeletedDurable(product.sku);
    if (isDeleted) return null;
  }

  return product || null;
});

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  if (!id || typeof id !== 'string') return null;
  const cleanId = id.trim();
  const deletedSkus = await getZohoDeletedSkus();
  if (deletedSkus.has(cleanId.toUpperCase())) return null;

  // 1. Authoritative: Ensure catalog has been synchronized with Zoho CRM Notes first
  await ensureCatalogSynced(false);

  // 2. Instant O(1) in-memory index from authoritative Zoho CRM catalog
  const cached = getCachedProductById(cleanId);
  if (cached && !(cached as any).isDeleted) {
    if (cached.sku) {
      if (deletedSkus.has(cached.sku.toUpperCase())) return null;
      const isDeleted = await isProductDeletedDurable(cached.sku);
      if (isDeleted) return null;
    }
    if (cached.id && deletedSkus.has(cached.id.toUpperCase())) return null;
    return cached;
  }

  // 3. Fallback: Durable custom product lookup
  try {
    const durableMatch = await getCustomProductByIdDurable(cleanId);
    if (durableMatch) {
      if (durableMatch.isDeleted) return null;
      if (deletedSkus.has(durableMatch.sku.toUpperCase())) return null;
      if (durableMatch.id && deletedSkus.has(durableMatch.id.toUpperCase())) return null;
      return durableMatch;
    }
  } catch {
    // continue
  }

  // 4. Fallback to active catalog pool
  const pool = storeState.productsList;

  const product = pool.find(
    (p) =>
      (p.id.toLowerCase() === cleanId.toLowerCase() ||
        p.sku.toLowerCase() === cleanId.toLowerCase() ||
        p.slug.toLowerCase() === cleanId.toLowerCase() ||
        ((p as any).zohoProductId && (p as any).zohoProductId === cleanId)) &&
      !(p as any).isDeleted &&
      !deletedSkus.has(p.sku.toUpperCase()) &&
      (!p.id || !deletedSkus.has(p.id.toUpperCase())) &&
      (!p.slug || !deletedSkus.has(p.slug.toUpperCase()))
  );

  if (product && product.sku) {
    const isDeleted = await isProductDeletedDurable(product.sku);
    if (isDeleted) return null;
  }

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

export const getRelatedProducts = cache(async (productId: string, limit = 4): Promise<Product[]> => {
  const [current, zohoProducts, deletedSkus] = await Promise.all([
    getProductById(productId),
    getProductsFromZoho(false),
    getZohoDeletedSkus(),
  ]);
  const pool = (zohoProducts && zohoProducts.length > 0 ? zohoProducts : storeState.productsList).filter(
    (p) =>
      p.isActive !== false &&
      !(p as any).isDeleted &&
      !deletedSkus.has(p.sku.toUpperCase()) &&
      (!p.id || !deletedSkus.has(p.id.toUpperCase())) &&
      (!p.slug || !deletedSkus.has(p.slug.toUpperCase()))
  );

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
});

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
  // Cap in-memory orders to 500 to prevent unbounded server memory bloat
  if (ordersList.length > 500) {
    ordersList.length = 500;
  }
  if (orderData.idempotencyKey) {
    idempotencyStore.set(orderData.idempotencyKey, newOrder);
    // Keep idempotency store compact
    if (idempotencyStore.size > 200) {
      const firstKey = idempotencyStore.keys().next().value;
      if (firstKey) idempotencyStore.delete(firstKey);
    }
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

export async function getAllOrders(limit = 50, offset = 0): Promise<Order[]> {
  if (limit <= 0) return ordersList;
  return ordersList.slice(offset, offset + limit);
}

/**
 * Customer Isolation: Retrieve only orders strictly belonging to a specific customer
 * identified by email address and optional phone number.
 */
export async function getOrdersByCustomer(email: string, phone?: string): Promise<Order[]> {
  if (!email && !phone) return [];
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPhone = phone ? phone.trim() : '';

  return ordersList.filter((o) => {
    const emailMatch = cleanEmail && o.customerEmail && o.customerEmail.trim().toLowerCase() === cleanEmail;
    const phoneMatch = cleanPhone && o.customerPhone && o.customerPhone.trim() === cleanPhone;
    return emailMatch || phoneMatch;
  });
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
  // Find existing product in store to preserve fields not included in partial update
  const existingInStore = storeState.productsList.find(
    (p) =>
      (productData.id && p.id === productData.id) ||
      (productData.sku && p.sku.toUpperCase() === productData.sku.toUpperCase())
  );

  const generatedSlug =
    productData.slug ||
    existingInStore?.slug ||
    (productData.name
      ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : `prod-${Date.now()}`);

  const generatedSku =
    productData.sku ||
    existingInStore?.sku ||
    `OB-${Math.floor(100000 + Math.random() * 900000)}`;

  // Build product by spreading existing values first so partial updates never erase untouched fields
  const newProduct: Product = {
    id: productData.id || existingInStore?.id || `prod-${Date.now()}`,
    name: productData.name || existingInStore?.name || 'Untitled Product',
    slug: generatedSlug,
    sku: generatedSku,
    categoryId: productData.categoryId || existingInStore?.categoryId || '',
    categoryName: productData.categoryName || existingInStore?.categoryName || 'Office Supplies',
    subcategoryId: productData.subcategoryId !== undefined ? productData.subcategoryId : existingInStore?.subcategoryId,
    subcategoryName: productData.subcategoryName !== undefined ? productData.subcategoryName : existingInStore?.subcategoryName,
    brandId: productData.brandId || existingInStore?.brandId || '',
    brandName: productData.brandName || existingInStore?.brandName || 'OfficeBazzar',
    description: productData.description !== undefined ? productData.description : (existingInStore?.description || ''),
    shortDescription: productData.shortDescription !== undefined ? productData.shortDescription : existingInStore?.shortDescription,
    specifications: productData.specifications || existingInStore?.specifications || {},
    price: productData.price !== undefined ? productData.price : (existingInStore?.price !== undefined ? existingInStore.price : null),
    mrp: productData.mrp !== undefined ? productData.mrp : (existingInStore?.mrp !== undefined ? existingInStore.mrp : null),
    gstPercent: productData.gstPercent || existingInStore?.gstPercent || 18,
    hsnCode: productData.hsnCode || existingInStore?.hsnCode,
    stockQuantity: productData.stockQuantity !== undefined ? productData.stockQuantity : (existingInStore?.stockQuantity || 0),
    minOrderQuantity: productData.minOrderQuantity || existingInStore?.minOrderQuantity || 1,
    packSize: productData.packSize || existingInStore?.packSize || '1 Unit',
    // Preserve existing images when no new image is provided
    images: (productData.images !== undefined && productData.images !== null && productData.images.length > 0)
      ? productData.images
      : (existingInStore?.images || []),
    featured: productData.featured !== undefined ? Boolean(productData.featured) : Boolean(existingInStore?.featured),
    bestseller: productData.bestseller !== undefined ? Boolean(productData.bestseller) : Boolean(existingInStore?.bestseller),
    rating: productData.rating !== undefined ? productData.rating : (existingInStore?.rating || null),
    reviewCount: productData.reviewCount !== undefined ? productData.reviewCount : (existingInStore?.reviewCount || 0),
    isPriceVerified: productData.isPriceVerified !== undefined ? Boolean(productData.isPriceVerified) : Boolean(existingInStore?.isPriceVerified),
    requiresManualReview: productData.requiresManualReview !== undefined ? Boolean(productData.requiresManualReview) : Boolean(existingInStore?.requiresManualReview ?? true),
    isActive: productData.isActive !== undefined ? productData.isActive !== false : (existingInStore?.isActive !== false),
    zohoProductId: (productData as any).zohoProductId || (existingInStore as any)?.zohoProductId || undefined,
  } as Product;

  const existingIdx = storeState.productsList.findIndex(
    (p) => p.id === newProduct.id || p.sku.toUpperCase() === newProduct.sku.toUpperCase()
  );
  if (existingIdx !== -1) {
    storeState.productsList[existingIdx] = { ...storeState.productsList[existingIdx], ...newProduct };
  } else {
    storeState.productsList.unshift(newProduct);
  }
  productsList = storeState.productsList;

  // Persist to custom_products.json without discarding modifications
  const custom = loadCustomProductsFromDisk();
  const cIdx = custom.findIndex(
    (c) => c.id === newProduct.id || (c.sku && c.sku.toUpperCase() === newProduct.sku.toUpperCase())
  );
  if (cIdx !== -1) {
    custom[cIdx] = { ...custom[cIdx], ...newProduct, isDeleted: false };
  } else {
    custom.unshift({ ...newProduct, isDeleted: false });
  }
  persistCustomProductsToDisk(custom);

  // Persist to multi-container Durable Cloud KV store
  try {
    await saveCustomProductDurable(newProduct);
  } catch (dErr) {
    console.warn('[Store] Durable custom product save notice:', dErr);
  }

  // Persist to Cloudinary raw JSON state store (authoritative durable store)
  await saveDurableProductOverride(newProduct);
  lastSyncCustomTime = 0;

  return newProduct;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const cleanId = productId.trim();
  const cleanUpper = cleanId.toUpperCase();
  const cleanLower = cleanId.toLowerCase();
  const initialLen = storeState.productsList.length;

  const existing = storeState.productsList.find(
    (p) =>
      p.id.toLowerCase() === cleanLower ||
      (p.sku && p.sku.toUpperCase() === cleanUpper) ||
      p.slug.toLowerCase() === cleanLower
  );
  const skuToTombstone = (existing?.sku || cleanUpper).toUpperCase();
  const slugToTombstone = (existing?.slug || cleanLower).toLowerCase();
  const idToTombstone = existing?.id || cleanId;

  // Mark tombstone in custom products on disk and Cloud KV
  const custom = loadCustomProductsFromDisk();
  const cIdx = custom.findIndex(
    (c) =>
      (c.id && c.id.toLowerCase() === idToTombstone.toLowerCase()) ||
      (c.sku && c.sku.toUpperCase() === skuToTombstone) ||
      (c.slug && c.slug.toLowerCase() === slugToTombstone)
  );
  if (cIdx !== -1) {
    custom[cIdx] = { ...custom[cIdx], isActive: false, isDeleted: true };
  } else {
    custom.unshift({ id: idToTombstone, sku: skuToTombstone, slug: slugToTombstone, isActive: false, isDeleted: true } as any);
  }
  persistCustomProductsToDisk(custom);

  try {
    await saveCustomProductDurable({ id: idToTombstone, sku: skuToTombstone, slug: slugToTombstone, isActive: false, isDeleted: true } as any);
  } catch (dErr) {
    console.warn('[Store] Durable custom product tombstone notice:', dErr);
  }
  lastSyncCustomTime = 0;

  // Record in Zoho tombstone registry note OB_DELETED_SKUS
  try {
    await recordZohoDeletedSku(skuToTombstone, idToTombstone, slugToTombstone);
  } catch (zErr) {
    console.warn('[Store] Record Zoho deleted SKU notice:', zErr);
  }

  // Delete from Cloudinary raw JSON state store (authoritative durable store)
  await deleteDurableProductOverride(skuToTombstone);
  if (idToTombstone && idToTombstone !== skuToTombstone) {
    await deleteDurableProductOverride(idToTombstone);
  }

  // Remove from runtime storeState
  storeState.productsList = storeState.productsList.filter(
    (p) =>
      p.id.toLowerCase() !== idToTombstone.toLowerCase() &&
      p.sku.toUpperCase() !== skuToTombstone &&
      p.slug.toLowerCase() !== slugToTombstone
  );
  productsList = storeState.productsList;

  return storeState.productsList.length < initialLen || cIdx !== -1;
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
  const prefix = `OB-RFQ-${y}${m}${d}-`;

  // Find highest existing sequence for today across all stored quotations to ensure uniqueness
  let maxSeq = 0;
  for (const q of quotationsList) {
    if (q.quotationNumber && q.quotationNumber.startsWith(prefix)) {
      const part = q.quotationNumber.slice(prefix.length);
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = Math.max(quotationCounter++, maxSeq + 1);
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export async function createQuotation(
  quoteData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'> & { quotationNumber?: string }
): Promise<Quotation> {
  // 1. Idempotency check to prevent rapid double-clicks on identical submissions
  if (quoteData.idempotencyKey) {
    const existing = quotationIdempotencyStore.get(quoteData.idempotencyKey) ||
      quotationsList.find((q) => q.idempotencyKey === quoteData.idempotencyKey);
    if (
      existing &&
      existing.customerName.trim().toLowerCase() === quoteData.customerName.trim().toLowerCase() &&
      existing.email.trim().toLowerCase() === quoteData.email.trim().toLowerCase() &&
      existing.items.length === quoteData.items.length
    ) {
      quotationIdempotencyStore.set(quoteData.idempotencyKey, existing);
      return existing;
    }
  }

  // 2. Construct Quotation object with authoritative server pricing
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
  // 1. Fast lookup in memory cache first
  const localQuote = quotationsList.find((q) => q.id === id || q.quotationNumber === id);
  if (localQuote) {
    return localQuote;
  }

  // 2. Lookup in Durable Store (Cloudinary & Upstash KV)
  try {
    const durable = await getDurableQuotationById(id);
    if (durable) {
      const idx = quotationsList.findIndex(
        (q) => q.id === durable.id || q.quotationNumber === durable.quotationNumber
      );
      if (idx !== -1) {
        quotationsList[idx] = durable;
      } else {
        quotationsList.unshift(durable);
      }
      return durable;
    }
  } catch {}

  // 3. Authoritative lookup in Zoho CRM
  try {
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
  } catch {
    // Non-blocking fallback
  }

  return null;
}

export async function getQuotationByNumber(quotationNumber: string): Promise<Quotation | null> {
  const cleanNumber = quotationNumber.trim().toUpperCase();
  const localQuote = quotationsList.find((q) => q.quotationNumber.trim().toUpperCase() === cleanNumber);
  if (localQuote) {
    return localQuote;
  }

  // Lookup in Durable Store (Cloudinary & Upstash KV)
  try {
    const durable = await getDurableQuotationById(cleanNumber);
    if (durable) {
      return durable;
    }
  } catch {}

  // Authoritative lookup in Zoho CRM
  try {
    const zohoQuote = await getQuoteByReferenceFromZoho(cleanNumber);
    if (zohoQuote) {
      return zohoQuote;
    }
  } catch {
    // Non-blocking fallback
  }

  return null;
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

export async function getAllQuotations(
  statusFilter?: QuotationStatus,
  limit = 50,
  offset = 0
): Promise<Quotation[]> {
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

  const filtered = statusFilter ? all.filter((q) => q.status === statusFilter) : all;
  if (limit <= 0) return filtered;
  return filtered.slice(offset, offset + limit);
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
  // Cap in-memory notification logs to 200 items to avoid server memory bloat
  if (notificationLogsList.length > 200) {
    notificationLogsList.length = 200;
  }
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

export async function getNotificationLogs(quotationId?: string, limit = 50): Promise<NotificationLog[]> {
  const pool = quotationId
    ? notificationLogsList.filter((l) => l.quotationId === quotationId)
    : notificationLogsList;
  if (limit <= 0) return pool;
  return pool.slice(0, limit);
}

/**
 * Prune old notification logs to reclaim server memory
 */
export function clearOldNotificationLogs(retentionDays = 7): number {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const initial = notificationLogsList.length;
  storeState.notificationLogsList = notificationLogsList.filter(
    (l) => new Date(l.createdAt).getTime() > cutoff
  );
  return initial - storeState.notificationLogsList.length;
}
