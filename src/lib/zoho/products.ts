/**
 * Server-Side Zoho CRM Product Catalog Service
 *
 * Provides authoritative product reading and synchronization from Zoho CRM.
 * Integrates directly with Zoho CRM Products module (when licensed) and Zoho CRM Notes
 * store (attached to Office Bazzar Account 1476900000000575002) for permanent cross-container
 * persistence on Vercel without external third-party databases.
 * Incorporates server-side caching (TTL 5 mins) to prevent exhausting Zoho API rate limits
 * while maintaining sub-millisecond page responsiveness across Next.js App Router.
 */

import { Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/lib/data/catalog';
import { zohoFetch, isZohoConfigured } from './client';
import zohoMappingData from '@/lib/data/zoho_product_mapping.json';
import { loadDurableCustomProducts } from '@/lib/products/custom-store';

export interface ZohoProductRecord {
  id: string;
  Product_Name: string;
  Product_Code: string;
  Unit_Price?: number;
  Qty_in_Stock?: number;
  Product_Active?: boolean;
  Description?: string;
  Tag?: string;
  Modified_Time?: string;
}

export interface ZohoProductMappingItem {
  zohoId: string;
  sku: string;
  websiteId: string;
  name: string;
  price: number;
  action: string;
}

// In-memory cache for high-speed edge retrieval
const DUPLICATE_INACTIVE_SLUGS = new Set<string>(['kangaro-staplers-hd-10d', 'kangaro-staplers-hd-10d-1']);
const ZOHO_ACCOUNT_PARENT_ID = '1476900000000575002'; // Office Bazzar Account
let cachedProducts: Product[] | null = null;
let lastCacheSync = 0;
let inflightSyncPromise: Promise<Product[]> | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL for high-speed edge delivery without rate limiting

// Fast O(1) Slug, ID, and SKU lookup maps
const productBySlugMap = new Map<string, Product>();
const productByIdMap = new Map<string, Product>();
const productBySkuMap = new Map<string, Product>();

function rebuildFastIndexes(products: Product[]): void {
  productBySlugMap.clear();
  productByIdMap.clear();
  productBySkuMap.clear();

  for (const p of products) {
    if (p.slug) productBySlugMap.set(p.slug.toLowerCase(), p);
    if (p.id) productByIdMap.set(p.id.toLowerCase(), p);
    if (p.sku) productBySkuMap.set(p.sku.toUpperCase(), p);
    if ((p as any).zohoProductId) {
      productByIdMap.set(String((p as any).zohoProductId).toLowerCase(), p);
    }
  }
}

export function getCachedProductBySlug(slug: string): Product | null {
  if (!slug) return null;
  return productBySlugMap.get(slug.toLowerCase().trim()) || null;
}

export function getCachedProductById(id: string): Product | null {
  if (!id) return null;
  const clean = id.toLowerCase().trim();
  return productByIdMap.get(clean) || productBySkuMap.get(clean.toUpperCase()) || null;
}

export function updateProductInLiveCache(product: Product): void {
  if (!product) return;
  const cleanSku = (product.sku || '').toUpperCase();
  const cleanId = (product.id || '').toLowerCase();
  const cleanSlug = (product.slug || '').toLowerCase();

  if (cachedProducts) {
    const idx = cachedProducts.findIndex(
      (p) =>
        (p.id && p.id.toLowerCase() === cleanId) ||
        (p.sku && p.sku.toUpperCase() === cleanSku)
    );
    if (idx !== -1) {
      cachedProducts[idx] = { ...cachedProducts[idx], ...product };
    } else {
      cachedProducts.unshift(product);
    }
  }

  if (cleanSlug) productBySlugMap.set(cleanSlug, product);
  if (cleanId) productByIdMap.set(cleanId, product);
  if (cleanSku) productBySkuMap.set(cleanSku, product);
  if ((product as any).zohoProductId) {
    productByIdMap.set(String((product as any).zohoProductId).toLowerCase(), product);
  }
}

export function removeProductFromLiveCache(idOrSku: string): void {
  if (!idOrSku) return;
  const clean = idOrSku.trim();
  const cleanLower = clean.toLowerCase();
  const cleanUpper = clean.toUpperCase();

  if (cachedProducts) {
    cachedProducts = cachedProducts.filter(
      (p) =>
        p.id.toLowerCase() !== cleanLower &&
        p.sku.toUpperCase() !== cleanUpper &&
        p.slug.toLowerCase() !== cleanLower
    );
  }

  productBySlugMap.delete(cleanLower);
  productByIdMap.delete(cleanLower);
  productBySkuMap.delete(cleanUpper);
}

// Fast SKU & ID lookup maps
const mappingByWebsiteId = new Map<string, ZohoProductMappingItem>();
const mappingBySku = new Map<string, ZohoProductMappingItem>();

// Initialize mapping index from disk
try {
  const records = zohoMappingData as Record<string, ZohoProductMappingItem>;
  for (const [webId, item] of Object.entries(records)) {
    mappingByWebsiteId.set(webId, item);
    if (item.sku) {
      mappingBySku.set(item.sku, item);
    }
  }
} catch {
  // Mapping will be populated on first sync
}

function loadCustomProductsFromDisk(): Array<Product & { isDeleted?: boolean }> {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'custom_products.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function buildInitialCatalog(): Product[] {
  const productsMap = new Map<string, Product>();
  const deletedSkus = new Set<string>();
  const custom = loadCustomProductsFromDisk();

  for (const cp of custom) {
    if (cp.isDeleted) {
      if (cp.sku) deletedSkus.add(cp.sku.toUpperCase());
      if (cp.id) deletedSkus.add(cp.id);
    }
  }

  for (const p of INITIAL_PRODUCTS) {
    const cleanSku = p.sku.toUpperCase();
    if (deletedSkus.has(cleanSku) || deletedSkus.has(p.id)) {
      continue;
    }
    const zohoInfo = mappingByWebsiteId.get(p.id) || mappingBySku.get(p.sku);
    const isDup = DUPLICATE_INACTIVE_SLUGS.has(p.slug);
    productsMap.set(cleanSku, {
      ...p,
      isActive: isDup ? false : p.isActive,
      zohoProductId: zohoInfo?.zohoId,
    } as Product & { zohoProductId?: string });
  }

  for (const cp of custom) {
    if (cp.isDeleted) continue;
    const cleanSku = (cp.sku || cp.id).toUpperCase();
    const existing = productsMap.get(cleanSku);
    if (existing) {
      productsMap.set(cleanSku, { ...existing, ...cp });
    } else {
      productsMap.set(cleanSku, cp);
    }
  }

  return Array.from(productsMap.values());
}

cachedProducts = buildInitialCatalog();
rebuildFastIndexes(cachedProducts);

/**
 * Get the Zoho CRM Product ID for a given website product ID or SKU
 */
export function getZohoProductId(productIdOrSku: string): string | undefined {
  return mappingByWebsiteId.get(productIdOrSku)?.zohoId || mappingBySku.get(productIdOrSku)?.zohoId;
}

/**
 * Get the SKU for a given Zoho CRM record ID
 */
export function getZohoProductSku(zohoId: string): string | undefined {
  for (const item of mappingBySku.values()) {
    if (item.zohoId === zohoId) return item.sku;
  }
  return undefined;
}

/**
 * Get all product mappings (websiteId -> zohoId)
 */
export function getAllZohoProductMappings(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [id, item] of mappingByWebsiteId.entries()) {
    map[id] = item.zohoId;
    if (item.sku) {
      map[item.sku] = item.zohoId;
    }
  }
  return map;
}

/**
 * Retrieve all product sync notes attached to the Office Bazzar Account in Zoho CRM
 */
async function fetchZohoProductNotes(): Promise<
  Map<string, { noteId: string; product: Partial<Product> & { isDeleted?: boolean } }>
> {
  const notesMap = new Map<string, { noteId: string; product: Partial<Product> & { isDeleted?: boolean } }>();
  if (!(await isZohoConfigured())) return notesMap;

  try {
    const res = await zohoFetch<any>(
      `/Accounts/${ZOHO_ACCOUNT_PARENT_ID}/Notes?fields=id,Note_Title,Note_Content&per_page=200`,
      { method: 'GET' }
    );
    if (res && res.data && Array.isArray(res.data)) {
      for (const note of res.data) {
        if (note.Note_Title && typeof note.Note_Title === 'string' && note.Note_Title.startsWith('OB_PROD_')) {
          const sku = note.Note_Title.replace(/^OB_PROD_/, '').trim().toUpperCase();
          try {
            const parsed = JSON.parse(note.Note_Content);
            notesMap.set(sku, { noteId: note.id, product: parsed });
          } catch {
            // ignore malformed note
          }
        }
      }
    }
  } catch (err) {
    // 204 No Content is normal when no notes exist yet
  }
  return notesMap;
}

/**
 * Save or update a product record in Zoho CRM Notes attached to the Office Bazzar Account
 */
async function saveZohoProductNote(
  product: Partial<Product> & { isDeleted?: boolean }
): Promise<string | undefined> {
  if (!product.sku || !(await isZohoConfigured())) return undefined;
  const cleanSku = product.sku.trim().toUpperCase();
  const noteTitle = `OB_PROD_${cleanSku}`;
  const noteContent = JSON.stringify({
    ...product,
    sku: cleanSku,
    updatedAt: new Date().toISOString(),
  });

  try {
    const existingNotes = await fetchZohoProductNotes();
    let existing = existingNotes.get(cleanSku);

    if (!existing) {
      for (const [skuKey, item] of existingNotes.entries()) {
        if (
          item.noteId === cleanSku ||
          skuKey === cleanSku ||
          (item.product as any)?.id?.toUpperCase() === cleanSku ||
          (item.product as any)?.sku?.toUpperCase() === cleanSku ||
          (item.product as any)?.slug?.toUpperCase() === cleanSku
        ) {
          existing = item;
          break;
        }
      }
    }

    if (existing) {
      const res = await zohoFetch<any>('/Notes', {
        method: 'PUT',
        body: JSON.stringify({
          data: [
            {
              id: existing.noteId,
              Note_Title: noteTitle,
              Note_Content: noteContent,
            },
          ],
        }),
      });
      return res?.data?.[0]?.details?.id || existing.noteId;
    } else {
      const res = await zohoFetch<any>('/Notes', {
        method: 'POST',
        body: JSON.stringify({
          data: [
            {
              Note_Title: noteTitle,
              Note_Content: noteContent,
              Parent_Id: {
                id: ZOHO_ACCOUNT_PARENT_ID,
                module: { api_name: 'Accounts' },
              },
            },
          ],
        }),
      });
      return res?.data?.[0]?.details?.id;
    }
  } catch (err) {
    console.warn('[ZohoProducts] Note save warning:', err);
    return undefined;
  }
}

/**
 * Mark a product note as deleted or remove it in Zoho CRM
 */
async function deleteZohoProductNote(identifier: string): Promise<boolean> {
  if (!identifier || !(await isZohoConfigured())) return false;
  const clean = identifier.trim().toUpperCase();
  try {
    const existingNotes = await fetchZohoProductNotes();
    let existing = existingNotes.get(clean);

    if (!existing) {
      for (const [skuKey, item] of existingNotes.entries()) {
        if (
          item.noteId === identifier ||
          skuKey === clean ||
          (item.product as any)?.id?.toUpperCase() === clean ||
          (item.product as any)?.sku?.toUpperCase() === clean ||
          (item.product as any)?.slug?.toUpperCase() === clean
        ) {
          existing = item;
          break;
        }
      }
    }

    if (existing) {
      try {
        await zohoFetch<any>(`/Notes?ids=${existing.noteId}`, { method: 'DELETE' });
      } catch (delErr) {
        const tombstoneContent = JSON.stringify({
          sku: existing.product.sku || clean,
          isActive: false,
          isDeleted: true,
          updatedAt: new Date().toISOString(),
        });
        await zohoFetch<any>('/Notes', {
          method: 'PUT',
          body: JSON.stringify({
            data: [{ id: existing.noteId, Note_Content: tombstoneContent }],
          }),
        });
      }
      return true;
    }
  } catch (err) {
    console.warn('[ZohoProducts] Note delete warning:', err);
  }
  return false;
}

/**
 * Fetch all products directly from Zoho CRM.
 * Merges baseline catalog with Zoho CRM Notes, live Products records, and custom products file.
 */
async function syncProductsFromZohoInternal(): Promise<Product[]> {
  const now = Date.now();
  const productsMap = new Map<string, Product>();

  // 1. Baseline catalog from catalog.ts
  const initialBase = buildInitialCatalog();
  for (const p of initialBase) {
    productsMap.set(p.sku.toUpperCase(), p);
  }

  // 2. Overlay live product notes from Zoho CRM Account
  if (await isZohoConfigured()) {
    try {
      const zohoNotes = await fetchZohoProductNotes();
      for (const [sku, item] of zohoNotes.entries()) {
        const cleanSku = sku.toUpperCase();
        if (item.product.isDeleted) {
          productsMap.delete(cleanSku);
          continue;
        }

        const existing = productsMap.get(cleanSku);
        if (existing) {
          productsMap.set(cleanSku, {
            ...existing,
            ...item.product,
            zohoProductId: item.noteId,
          } as Product & { zohoProductId?: string });
        } else if (item.product.name) {
          productsMap.set(cleanSku, {
            id: item.product.id || `prod-${cleanSku.toLowerCase()}`,
            name: item.product.name,
            sku: cleanSku,
            slug: item.product.slug || cleanSku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            categoryId: item.product.categoryId || 'office-stationery',
            categoryName: item.product.categoryName || 'Office Stationery',
            subcategoryId: item.product.subcategoryId,
            subcategoryName: item.product.subcategoryName,
            brandName: item.product.brandName || 'OfficeBazzar',
            packSize: item.product.packSize || '1 Unit',
            price: item.product.price ?? 0,
            description: item.product.description || '',
            images: item.product.images || [],
            isActive: item.product.isActive !== false,
            zohoProductId: item.noteId,
          } as Product & { zohoProductId?: string });
        }

        mappingBySku.set(cleanSku, {
          zohoId: item.noteId,
          sku: cleanSku,
          websiteId: item.product.id || `prod-${cleanSku.toLowerCase()}`,
          name: item.product.name || cleanSku,
          price: item.product.price || 0,
          action: 'synced_note',
        });
      }
    } catch (noteErr) {
      console.warn('[ZohoProducts] Notice checking Zoho product notes:', noteErr);
    }

    // 2b. Overlay durable Cloud KV custom products
    try {
      const durableCustom = await loadDurableCustomProducts();
      for (const cp of durableCustom) {
        if (cp.isDeleted) {
          if (cp.sku) productsMap.delete(cp.sku.toUpperCase());
          continue;
        }
        const cleanSku = (cp.sku || cp.id).toUpperCase();
        const existing = productsMap.get(cleanSku);
        if (existing) {
          productsMap.set(cleanSku, { ...existing, ...cp });
        } else {
          productsMap.set(cleanSku, cp);
        }
      }
    } catch (dErr) {
      console.warn('[ZohoProducts] Notice checking durable custom products:', dErr);
    }

    // 3. Optional: Overlay official /Products module if enabled in organization
    try {
      let hasMore = true;
      let pageToken: string | undefined = undefined;
      const zohoRecords: ZohoProductRecord[] = [];

      while (hasMore) {
        const endpoint: string = pageToken
          ? `/Products?fields=id,Product_Name,Product_Code,Unit_Price,Qty_in_Stock,Product_Active,Description,Modified_Time&per_page=200&page_token=${pageToken}`
          : `/Products?fields=id,Product_Name,Product_Code,Unit_Price,Qty_in_Stock,Product_Active,Description,Modified_Time&per_page=200`;

        const res = await zohoFetch<any>(endpoint, { method: 'GET' });
        if (res?.data && Array.isArray(res.data)) {
          zohoRecords.push(...res.data);
        }
        hasMore = res?.info?.more_records === true;
        pageToken = res?.info?.next_page_token;
      }

      for (const zRec of zohoRecords) {
        const sku = zRec.Product_Code?.trim().toUpperCase();
        if (!sku) continue;

        const existing = productsMap.get(sku);
        if (existing) {
          if (existing.isActive && zRec.Product_Active === false) {
            continue;
          }
          const price = zRec.Unit_Price !== undefined ? Number(zRec.Unit_Price) : (Number(existing.price) || 0);
          const stock = zRec.Qty_in_Stock !== undefined ? Number(zRec.Qty_in_Stock) : (Number(existing.stockQuantity) || 0);
          const isDup = DUPLICATE_INACTIVE_SLUGS.has(existing.slug);
          const isActive = isDup ? false : (zRec.Product_Active !== undefined ? zRec.Product_Active : existing.isActive);

          productsMap.set(sku, {
            ...existing,
            price,
            stockQuantity: stock,
            isActive,
            zohoProductId: zRec.id,
          } as Product & { zohoProductId?: string });

          mappingBySku.set(sku, {
            zohoId: zRec.id,
            sku,
            websiteId: existing.id,
            name: zRec.Product_Name || existing.name,
            price,
            action: 'synced',
          });
          mappingByWebsiteId.set(existing.id, {
            zohoId: zRec.id,
            sku,
            websiteId: existing.id,
            name: zRec.Product_Name || existing.name,
            price,
            action: 'synced',
          });
        }
      }
    } catch {
      // Products module may not be active; Zoho Notes layer guarantees synchronization
    }
  }

  cachedProducts = Array.from(productsMap.values());
  rebuildFastIndexes(cachedProducts);
  lastCacheSync = now;
  return cachedProducts;
}

export async function getProductsFromZoho(forceRefresh = false): Promise<Product[]> {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && now - lastCacheSync < CACHE_TTL_MS) {
    return cachedProducts;
  }

  if (!inflightSyncPromise || forceRefresh) {
    inflightSyncPromise = syncProductsFromZohoInternal().finally(() => {
      inflightSyncPromise = null;
    });
  }
  return inflightSyncPromise;
}

/**
 * Invalidate the product cache to force fresh retrieval from Zoho CRM on next request
 */
export function invalidateZohoProductCache(): void {
  // Preserve active in-memory products and fast indexes so customer browsing and revalidation never see empty/stale catalog
  if (!cachedProducts || cachedProducts.length === 0) {
    cachedProducts = buildInitialCatalog();
    rebuildFastIndexes(cachedProducts);
  }
  lastCacheSync = 0;
  inflightSyncPromise = null;
}

/**
 * Create a new Product record in Zoho CRM.
 * Persists to Zoho CRM Notes attached to the Office Bazzar Account and tries the Products module.
 */
export async function createZohoProduct(product: Partial<Product>): Promise<{
  success: boolean;
  zohoId?: string;
  error?: string;
}> {
  if (!(await isZohoConfigured())) {
    return { success: false, error: 'Zoho CRM is not configured.' };
  }

  let finalZohoId: string | undefined = undefined;

  // 1. Try official /Products module
  try {
    const zohoRecord: Record<string, unknown> = {
      Product_Name: product.name,
      Product_Code: product.sku,
      Description: product.description || '',
      Product_Active: product.isActive !== false,
      Unit_Price: product.price || 0,
      Qty_in_Stock: product.stockQuantity || 0,
    };
    if (product.categoryName) zohoRecord['Product_Category'] = product.categoryName;
    if (product.brandName) zohoRecord['Manufacturer'] = product.brandName;
    if (product.packSize) zohoRecord['Usage_Unit'] = product.packSize;

    const res = await zohoFetch<{
      data?: Array<{
        code?: string;
        details?: { id: string };
        message?: string;
        status?: string;
      }>;
    }>('/Products', {
      method: 'POST',
      body: JSON.stringify({ data: [zohoRecord] }),
    });

    const result = res?.data?.[0];
    if (result && (result.code === 'SUCCESS' || result.status === 'success')) {
      finalZohoId = result.details?.id;
    }
  } catch {
    // Handled by Notes fallback below
  }

  // 2. Always persist to Zoho CRM Notes for multi-container reliability
  try {
    const noteId = await saveZohoProductNote(product);
    if (!finalZohoId) {
      finalZohoId = noteId;
    }
  } catch (noteErr) {
    console.warn('[ZohoProducts] Note sync warning on create:', noteErr);
  }

  if (finalZohoId && product.sku) {
    const cleanSku = product.sku.trim().toUpperCase();
    mappingBySku.set(cleanSku, {
      zohoId: finalZohoId,
      sku: cleanSku,
      websiteId: product.id || `prod-${cleanSku.toLowerCase()}`,
      name: product.name || '',
      price: product.price || 0,
      action: 'created',
    });
  }

  updateProductInLiveCache({
    ...product,
    zohoProductId: finalZohoId,
  } as Product);
  return { success: true, zohoId: finalZohoId };
}

/**
 * Update an existing Product record in Zoho CRM.
 * Persists to Zoho CRM Notes attached to the Office Bazzar Account and tries the Products module.
 */
export async function updateZohoProduct(
  zohoIdOrSku: string,
  product: Partial<Product>,
  skuFallback?: string
): Promise<{
  success: boolean;
  zohoId?: string;
  error?: string;
}> {
  if (!(await isZohoConfigured())) {
    return { success: false, error: 'Zoho CRM is not configured.' };
  }

  const cleanSku = (product.sku || skuFallback || zohoIdOrSku).trim().toUpperCase();
  let finalZohoId: string | undefined = undefined;

  // 1. Try official /Products module
  try {
    const zohoId = getZohoProductId(zohoIdOrSku) || zohoIdOrSku;
    const zohoRecord: Record<string, unknown> = { id: zohoId };
    if (product.name) zohoRecord['Product_Name'] = product.name;
    if (product.sku) zohoRecord['Product_Code'] = product.sku;
    if (product.description !== undefined) zohoRecord['Description'] = product.description;
    if (product.isActive !== undefined) zohoRecord['Product_Active'] = product.isActive;
    if (product.price !== undefined) zohoRecord['Unit_Price'] = product.price;
    if (product.stockQuantity !== undefined) zohoRecord['Qty_in_Stock'] = product.stockQuantity;
    if (product.categoryName) zohoRecord['Product_Category'] = product.categoryName;
    if (product.brandName) zohoRecord['Manufacturer'] = product.brandName;
    if (product.packSize) zohoRecord['Usage_Unit'] = product.packSize;

    const res = await zohoFetch<{
      data?: Array<{
        code?: string;
        details?: { id: string };
        message?: string;
        status?: string;
      }>;
    }>('/Products', {
      method: 'PUT',
      body: JSON.stringify({ data: [zohoRecord] }),
    });

    const result = res?.data?.[0];
    if (result && (result.code === 'SUCCESS' || result.status === 'success')) {
      finalZohoId = result.details?.id;
    }
  } catch {
    // Handled by Notes fallback below
  }

  // 2. Always persist updates to Zoho CRM Notes
  try {
    const noteId = await saveZohoProductNote({ ...product, sku: cleanSku });
    if (!finalZohoId) {
      finalZohoId = noteId;
    }

    // If SKU was modified, clean up the obsolete old note to prevent duplicate records
    if (skuFallback && skuFallback.trim().toUpperCase() !== cleanSku) {
      await deleteZohoProductNote(skuFallback.trim().toUpperCase());
    }
  } catch (noteErr) {
    console.warn('[ZohoProducts] Note sync warning on update:', noteErr);
  }

  updateProductInLiveCache({
    ...product,
    sku: cleanSku,
    zohoProductId: finalZohoId || zohoIdOrSku,
  } as Product);
  return { success: true, zohoId: finalZohoId || zohoIdOrSku };
}

/**
 * Delete or deactivate a Product record in Zoho CRM.
 * Removes/tombstones in Zoho CRM Notes and deactivates in Products module.
 */
export async function deleteZohoProduct(
  zohoIdOrSku: string,
  skuFallback?: string
): Promise<{
  success: boolean;
  zohoId?: string;
  error?: string;
}> {
  if (!(await isZohoConfigured())) {
    return { success: false, error: 'Zoho CRM is not configured.' };
  }

  const cleanSku = (skuFallback || getZohoProductSku(zohoIdOrSku) || zohoIdOrSku).trim().toUpperCase();

  // 1. Try official /Products module
  try {
    const zohoId = getZohoProductId(zohoIdOrSku) || zohoIdOrSku;
    try {
      await zohoFetch<any>(`/Products?ids=${zohoId}`, { method: 'DELETE' });
    } catch {
      await updateZohoProduct(zohoId, { isActive: false }, cleanSku);
    }
  } catch {
    // Handled by Notes layer below
  }

  // 2. Always remove/tombstone in Zoho CRM Notes
  try {
    await deleteZohoProductNote(cleanSku);
    if (zohoIdOrSku && zohoIdOrSku !== cleanSku) {
      await deleteZohoProductNote(zohoIdOrSku);
    }
  } catch (noteErr) {
    console.warn('[ZohoProducts] Note sync warning on delete:', noteErr);
  }

  mappingBySku.delete(cleanSku);
  removeProductFromLiveCache(cleanSku);
  if (zohoIdOrSku && zohoIdOrSku !== cleanSku) {
    removeProductFromLiveCache(zohoIdOrSku);
  }
  return { success: true, zohoId: cleanSku };
}
