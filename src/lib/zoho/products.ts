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
import { loadDurableCustomProducts, invalidateDurableCustomProductCache } from '@/lib/products/custom-store';
import { deleteZohoAttachment } from './attachments';

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
export const ZOHO_ACCOUNT_PARENT_ID = '1476900000000575002'; // Office Bazzar Account
let cachedProducts: Product[] | null = null;
let lastCacheSync = 0;
let hasSyncedInitialCatalog = false;
let inflightSyncPromise: Promise<Product[]> | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30-second server-side cache for high responsiveness

export function isZohoCacheSynced(): boolean {
  return hasSyncedInitialCatalog && Date.now() - lastCacheSync < CACHE_TTL_MS;
}

// Fast O(1) Slug, ID, and SKU lookup maps
const productBySlugMap = new Map<string, Product>();
const productByIdMap = new Map<string, Product>();
const productBySkuMap = new Map<string, Product>();

// Tombstone registry for permanently deleted products (persisted in Zoho CRM note OB_DELETED_SKUS)
let deletedSkusNoteId: string | null = null;
const inMemoryDeletedSkus = new Set<string>();
let lastDeletedSkusSync = 0;

export function isSkuOrIdDeleted(identifier?: string | null): boolean {
  if (!identifier) return false;
  const clean = identifier.trim().toUpperCase();
  return inMemoryDeletedSkus.has(clean);
}

export async function getZohoDeletedSkus(force = false): Promise<Set<string>> {
  const now = Date.now();
  if (!force && lastDeletedSkusSync > 0 && now - lastDeletedSkusSync < NOTES_CACHE_TTL_MS) {
    return inMemoryDeletedSkus;
  }
  // Ensure notes are fetched so inMemoryDeletedSkus is populated from OB_DELETED_SKUS
  await fetchZohoProductNotes(force);
  lastDeletedSkusSync = now;
  return inMemoryDeletedSkus;
}

export async function recordZohoDeletedSku(...identifiers: (string | undefined | null)[]): Promise<void> {
  const valid = identifiers.filter((x): x is string => !!x && typeof x === 'string' && x.trim().length > 0);
  if (valid.length === 0) return;
  for (const v of valid) {
    inMemoryDeletedSkus.add(v.trim().toUpperCase());
  }
  lastDeletedSkusSync = Date.now();
  invalidateZohoProductCache();

  if (!(await isZohoConfigured())) return;

  try {
    if (!deletedSkusNoteId) {
      await fetchZohoProductNotes(true);
    }

    const payload = JSON.stringify(Array.from(inMemoryDeletedSkus));

    let res: any;
    if (deletedSkusNoteId) {
      res = await zohoFetch<any>('/Notes', {
        method: 'PUT',
        cache: 'no-store',
        body: JSON.stringify({
          data: [{
            id: deletedSkusNoteId,
            Note_Content: payload,
          }],
        }),
      });
    } else {
      res = await zohoFetch<any>(`/Accounts/${ZOHO_ACCOUNT_PARENT_ID}/Notes`, {
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({
          data: [{
            Note_Title: 'OB_DELETED_SKUS',
            Note_Content: payload,
          }],
        }),
      });

      const firstItem = res?.data?.[0];
      if (!firstItem || firstItem.status === 'error' || firstItem.code === 'ERROR') {
        res = await zohoFetch<any>('/Notes', {
          method: 'POST',
          cache: 'no-store',
          body: JSON.stringify({
            data: [{
              Note_Title: 'OB_DELETED_SKUS',
              Note_Content: payload,
              Parent_Id: {
                id: ZOHO_ACCOUNT_PARENT_ID,
                module: { api_name: 'Accounts' },
              },
            }],
          }),
        });
      }

      const createdId = res?.data?.[0]?.details?.id;
      if (createdId) {
        deletedSkusNoteId = String(createdId);
      }
    }

    const statusItem = res?.data?.[0];
    if (statusItem?.status === 'error' || statusItem?.code === 'ERROR') {
      throw new Error(statusItem.message || 'Zoho CRM rejected OB_DELETED_SKUS tombstone update');
    }
  } catch (err) {
    console.error('[ZohoProducts] Error recording deleted SKUs to Zoho CRM:', err);
    throw err;
  }
}

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
  const clean = slug.toLowerCase().trim();
  if (isSkuOrIdDeleted(clean)) return null;
  const p = productBySlugMap.get(clean) || null;
  if (p && (isSkuOrIdDeleted(p.sku) || (p.id && isSkuOrIdDeleted(p.id)))) return null;
  return p;
}

export function getCachedProductById(id: string): Product | null {
  if (!id) return null;
  const clean = id.toLowerCase().trim();
  if (isSkuOrIdDeleted(clean)) return null;
  const p = productByIdMap.get(clean) || productBySkuMap.get(clean.toUpperCase()) || null;
  if (p && (isSkuOrIdDeleted(p.sku) || (p.id && isSkuOrIdDeleted(p.id)))) return null;
  return p;
}

export function updateProductInLiveCache(
  product: Product,
  previousIdentifiers?: { id?: string; sku?: string; slug?: string }
): void {
  if (!product) return;
  const cleanSku = (product.sku || '').toUpperCase().trim();
  const cleanId = (product.id || '').toLowerCase().trim();
  const cleanSlug = (product.slug || '').toLowerCase().trim();

  // Clean up stale previous identifiers if renamed/changed
  if (previousIdentifiers) {
    if (previousIdentifiers.slug && previousIdentifiers.slug.toLowerCase().trim() !== cleanSlug) {
      productBySlugMap.delete(previousIdentifiers.slug.toLowerCase().trim());
    }
    if (previousIdentifiers.sku && previousIdentifiers.sku.toUpperCase().trim() !== cleanSku) {
      productBySkuMap.delete(previousIdentifiers.sku.toUpperCase().trim());
    }
    if (previousIdentifiers.id && previousIdentifiers.id.toLowerCase().trim() !== cleanId) {
      productByIdMap.delete(previousIdentifiers.id.toLowerCase().trim());
    }
  }

  if (cachedProducts) {
    const prevId = previousIdentifiers?.id?.toLowerCase().trim();
    const prevSku = previousIdentifiers?.sku?.toUpperCase().trim();
    const prevSlug = previousIdentifiers?.slug?.toLowerCase().trim();

    const idx = cachedProducts.findIndex(
      (p) =>
        (cleanId && p.id && p.id.toLowerCase() === cleanId) ||
        (cleanSku && p.sku && p.sku.toUpperCase() === cleanSku) ||
        (cleanSlug && p.slug && p.slug.toLowerCase() === cleanSlug) ||
        (prevId && p.id && p.id.toLowerCase() === prevId) ||
        (prevSku && p.sku && p.sku.toUpperCase() === prevSku) ||
        (prevSlug && p.slug && p.slug.toLowerCase() === prevSlug)
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
  const deletedSkus = new Set<string>(inMemoryDeletedSkus);
  const custom = loadCustomProductsFromDisk();

  for (const cp of custom) {
    if (cp.isDeleted) {
      if (cp.sku) deletedSkus.add(cp.sku.toUpperCase());
      if (cp.id) deletedSkus.add(cp.id.toUpperCase());
      if (cp.slug) deletedSkus.add(cp.slug.toUpperCase());
    }
  }

  for (const p of INITIAL_PRODUCTS) {
    const cleanSku = p.sku.toUpperCase();
    const cleanId = p.id ? p.id.toUpperCase() : '';
    const cleanSlug = p.slug ? p.slug.toUpperCase() : '';
    if (deletedSkus.has(cleanSku) || (cleanId && deletedSkus.has(cleanId)) || (cleanSlug && deletedSkus.has(cleanSlug))) {
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
    const cleanId = cp.id ? cp.id.toUpperCase() : '';
    const cleanSlug = cp.slug ? cp.slug.toUpperCase() : '';
    if (deletedSkus.has(cleanSku) || (cleanId && deletedSkus.has(cleanId)) || (cleanSlug && deletedSkus.has(cleanSlug))) {
      continue;
    }
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

let cachedNotesMap: Map<string, { noteId: string; product: Partial<Product> & { isDeleted?: boolean } }> | null = null;
let lastNotesFetchTime = 0;
const NOTES_CACHE_TTL_MS = 30 * 1000; // 30-second TTL for rapid admin propagation

/**
 * Retrieve all product sync notes attached to the Office Bazzar Account in Zoho CRM
 */
async function fetchZohoProductNotes(force = false): Promise<
  Map<string, { noteId: string; product: Partial<Product> & { isDeleted?: boolean } }>
> {
  const now = Date.now();
  if (!force && cachedNotesMap && now - lastNotesFetchTime < NOTES_CACHE_TTL_MS) {
    return cachedNotesMap;
  }

  const notesMap = new Map<string, { noteId: string; product: Partial<Product> & { isDeleted?: boolean } }>();
  if (!(await isZohoConfigured())) return notesMap;

  try {
    let hasMore = true;
    let pageToken: string | undefined = undefined;
    let page = 1;

    while (hasMore) {
      let endpoint = `/Accounts/${ZOHO_ACCOUNT_PARENT_ID}/Notes?fields=id,Note_Title,Note_Content&per_page=200`;
      if (pageToken) {
        endpoint += `&page_token=${pageToken}`;
      } else if (page > 1) {
        endpoint += `&page=${page}`;
      }

      const res = await zohoFetch<any>(endpoint, { method: 'GET', cache: 'no-store' });
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        for (const note of res.data) {
          if (note.Note_Title && typeof note.Note_Title === 'string') {
            if (note.Note_Title.startsWith('OB_PROD_')) {
              const sku = note.Note_Title.replace(/^OB_PROD_/, '').trim().toUpperCase();
              try {
                const parsed = JSON.parse(note.Note_Content);
                notesMap.set(sku, { noteId: note.id, product: parsed });
              } catch {
                // ignore malformed note
              }
            } else if (note.Note_Title === 'OB_DELETED_SKUS') {
              deletedSkusNoteId = String(note.id);
              try {
                const parsed = JSON.parse(note.Note_Content);
                if (Array.isArray(parsed)) {
                  for (const item of parsed) {
                    if (typeof item === 'string' && item.trim()) {
                      inMemoryDeletedSkus.add(item.trim().toUpperCase());
                    }
                  }
                }
              } catch {
                // ignore malformed note
              }
            }
          }
        }
        hasMore = res?.info?.more_records === true;
        pageToken = res?.info?.next_page_token;
        page++;
      } else {
        hasMore = false;
      }
    }
    cachedNotesMap = notesMap;
    lastNotesFetchTime = now;
  } catch (err) {
    console.warn('[ZohoProducts] fetchZohoProductNotes notice:', err);
  }
  return notesMap;
}

/**
 * Save or update a product record in Zoho CRM Notes attached to the Office Bazzar Account
 */
async function saveZohoProductNote(
  product: Partial<Product> & { isDeleted?: boolean }
): Promise<string> {
  if (!product.sku) {
    throw new Error('Product SKU is required to persist to Zoho CRM.');
  }
  if (!(await isZohoConfigured())) {
    throw new Error('Zoho CRM is not configured.');
  }
  const cleanSku = product.sku.trim().toUpperCase();
  const noteTitle = `OB_PROD_${cleanSku}`;

  const noteImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product as any).imageUrl
        ? [(product as any).imageUrl]
        : (product as any).image
          ? [(product as any).image]
          : [];

  const notePayload = {
    ...product,
    sku: cleanSku,
    images: noteImages,
    image: noteImages[0] || '',
    imageUrl: noteImages[0] || '',
    updatedAt: new Date().toISOString(),
  };

  let noteContent = JSON.stringify(notePayload);
  if (noteContent.length > 30000 && noteImages[0]?.startsWith('data:')) {
    console.warn('[ZohoProducts] Note content exceeds 30k limit due to large data URI. Trimming image payload.');
    notePayload.images = ['/assets/placeholder-product.svg'];
    notePayload.image = '/assets/placeholder-product.svg';
    notePayload.imageUrl = '/assets/placeholder-product.svg';
    noteContent = JSON.stringify(notePayload);
  }

  const existingNotes = await fetchZohoProductNotes(true);
  let existing = existingNotes.get(cleanSku);

  if (!existing) {
    for (const [skuKey, item] of existingNotes.entries()) {
      if (
        item.noteId === cleanSku ||
        skuKey === cleanSku ||
        (item.product as any)?.id?.toUpperCase() === cleanSku ||
        (item.product as any)?.sku?.toUpperCase() === cleanSku ||
        (item.product as any)?.slug?.toUpperCase() === cleanSku ||
        (product.id && (item.product as any)?.id?.toLowerCase() === product.id.toLowerCase())
      ) {
        existing = item;
        break;
      }
    }
  }

  let noteId: string | undefined = undefined;

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
    const item = res?.data?.[0];
    if (item?.status === 'error' || item?.code === 'ERROR') {
      throw new Error(item.message || 'Zoho CRM error updating product note');
    }
    noteId = item?.details?.id || existing.noteId;
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
    const item = res?.data?.[0];
    if (item?.status === 'error' || item?.code === 'ERROR') {
      throw new Error(item.message || 'Zoho CRM error creating product note');
    }
    noteId = item?.details?.id;
  }

  if (!noteId) {
    throw new Error('Zoho CRM did not return a valid Note ID.');
  }

  // Invalidate notes cache so subsequent calls retrieve the updated content
  cachedNotesMap = null;
  lastNotesFetchTime = 0;
  return noteId;
}

/**
 * Mark a product note as deleted or remove it in Zoho CRM
 */
async function deleteZohoProductNote(identifier: string): Promise<boolean> {
  if (!identifier || !(await isZohoConfigured())) return false;
  const clean = identifier.trim().toUpperCase();
  try {
    const existingNotes = await fetchZohoProductNotes(true);
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
      } catch {
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
      cachedNotesMap = null;
      lastNotesFetchTime = 0;
      return true;
    }
  } catch (err) {
    console.warn('[ZohoProducts] Note delete warning:', err);
  }
  return false;
}

/**
 * Fetch all products directly from Zoho CRM.
 * Authoritatively overlays Zoho CRM Notes and durable Cloud KV on top of the baseline catalog.
 * (Note: Official Zoho CRM Products module is not present in our edition; Notes attached to Account 1476900000000575002 serve as permanent persistence).
 */
async function syncProductsFromZohoInternal(forceRefresh = false): Promise<Product[]> {
  const now = Date.now();
  const productsMap = new Map<string, Product>();
  const deletedSkus = await getZohoDeletedSkus(forceRefresh);

  // 1. Baseline catalog from catalog.ts (excluding deletedSkus)
  const initialBase = buildInitialCatalog();
  for (const p of initialBase) {
    const cleanSku = p.sku.toUpperCase();
    const cleanId = p.id ? p.id.toUpperCase() : '';
    const cleanSlug = p.slug ? p.slug.toUpperCase() : '';
    if (deletedSkus.has(cleanSku) || (cleanId && deletedSkus.has(cleanId)) || (cleanSlug && deletedSkus.has(cleanSlug))) {
      continue;
    }
    productsMap.set(cleanSku, p);
  }

  // 2. Authoritative: Overlay live product notes from Zoho CRM Account
  if (await isZohoConfigured()) {
    let zohoNotes = new Map<string, { noteId: string; product: Partial<Product> & { isDeleted?: boolean } }>();
    try {
      zohoNotes = await fetchZohoProductNotes(forceRefresh);
      for (const [sku, item] of zohoNotes.entries()) {
        const cleanSku = sku.toUpperCase();
        const itemId = item.product.id ? item.product.id.toUpperCase() : '';
        const itemSlug = item.product.slug ? item.product.slug.toUpperCase() : '';

        if (deletedSkus.has(cleanSku) || (itemId && deletedSkus.has(itemId)) || (itemSlug && deletedSkus.has(itemSlug)) || item.product.isDeleted) {
          productsMap.delete(cleanSku);
          if (item.product.id) {
            for (const [s, p] of productsMap.entries()) {
              if (p.id && p.id.toLowerCase() === item.product.id.toLowerCase()) {
                productsMap.delete(s);
              }
            }
          }
          continue;
        }

        // Clean up any stale old-SKU entry in productsMap if the product was renamed/re-SKU'd
        if (item.product.id) {
          for (const [s, p] of productsMap.entries()) {
            if (s !== cleanSku && p.id && p.id.toLowerCase() === item.product.id.toLowerCase()) {
              productsMap.delete(s);
            }
          }
        }

        const existing = productsMap.get(cleanSku);

        // Resolve images authoritatively from the Zoho Note
        const noteImages =
          Array.isArray(item.product.images) && item.product.images.length > 0
            ? item.product.images
            : (item.product as any).imageUrl
              ? [(item.product as any).imageUrl]
              : (item.product as any).image
                ? [(item.product as any).image]
                : null;

        const finalImages = noteImages || existing?.images || [];

        if (existing) {
          productsMap.set(cleanSku, {
            ...existing,
            ...item.product,
            images: finalImages,
            image: finalImages[0] || '',
            imageUrl: finalImages[0] || '',
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
            images: finalImages,
            image: finalImages[0] || '',
            imageUrl: finalImages[0] || '',
            isActive: item.product.isActive !== false,
            zohoProductId: item.noteId,
          } as unknown as Product & { zohoProductId?: string });
        }

        mappingBySku.set(cleanSku, {
          zohoId: item.noteId,
          sku: cleanSku,
          websiteId: item.product.id || existing?.id || `prod-${cleanSku.toLowerCase()}`,
          name: item.product.name || existing?.name || cleanSku,
          price: item.product.price !== undefined && item.product.price !== null ? item.product.price : (existing?.price || 0),
          action: 'synced_note',
        });
      }
    } catch (noteErr) {
      console.warn('[ZohoProducts] Notice checking Zoho product notes:', noteErr);
    }

    // 2b. Overlay durable Cloud KV custom products ONLY for products NOT already in zohoNotes
    try {
      const durableCustom = await loadDurableCustomProducts();
      for (const cp of durableCustom) {
        const cleanSku = (cp.sku || cp.id).toUpperCase();
        const cpId = cp.id ? cp.id.toUpperCase() : '';
        const cpSlug = cp.slug ? cp.slug.toUpperCase() : '';

        if (deletedSkus.has(cleanSku) || (cpId && deletedSkus.has(cpId)) || (cpSlug && deletedSkus.has(cpSlug)) || cp.isDeleted) {
          if (cp.sku) productsMap.delete(cp.sku.toUpperCase());
          if (cp.id) {
            for (const [s, p] of productsMap.entries()) {
              if (p.id && p.id.toLowerCase() === cp.id.toLowerCase()) {
                productsMap.delete(s);
              }
            }
          }
          continue;
        }
        // Skip if already authoritatively provided by Zoho CRM Note
        if (zohoNotes.has(cleanSku)) continue;
        if (cp.id) {
          for (const [s, p] of productsMap.entries()) {
            if (s !== cleanSku && p.id && p.id.toLowerCase() === cp.id.toLowerCase()) {
              productsMap.delete(s);
            }
          }
        }
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
  }

  // Final filter pass to guarantee no deleted SKU, ID, or slug survives
  for (const [s, p] of productsMap.entries()) {
    const pSku = p.sku.toUpperCase();
    const pId = p.id ? p.id.toUpperCase() : '';
    const pSlug = p.slug ? p.slug.toUpperCase() : '';
    if (deletedSkus.has(pSku) || (pId && deletedSkus.has(pId)) || (pSlug && deletedSkus.has(pSlug))) {
      productsMap.delete(s);
    }
  }

  cachedProducts = Array.from(productsMap.values());
  rebuildFastIndexes(cachedProducts);
  hasSyncedInitialCatalog = true;
  lastCacheSync = now;
  return cachedProducts;
}

export async function getProductsFromZoho(forceRefresh = false): Promise<Product[]> {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && hasSyncedInitialCatalog && now - lastCacheSync < CACHE_TTL_MS) {
    return cachedProducts;
  }

  if (!inflightSyncPromise || forceRefresh) {
    inflightSyncPromise = syncProductsFromZohoInternal(forceRefresh).finally(() => {
      inflightSyncPromise = null;
    });
  }
  return inflightSyncPromise;
}

/**
 * Invalidate the product cache to force fresh retrieval from Zoho CRM on next request
 */
export function invalidateZohoProductCache(): void {
  lastCacheSync = 0;
  inflightSyncPromise = null;
  cachedNotesMap = null;
  lastNotesFetchTime = 0;
  hasSyncedInitialCatalog = false;

  // Preserve active in-memory products and fast indexes so customer browsing and revalidation never see empty/stale catalog
  if (!cachedProducts || cachedProducts.length === 0) {
    cachedProducts = buildInitialCatalog();
    rebuildFastIndexes(cachedProducts);
  }
}

/**
 * Create a new Product record in Zoho CRM.
 * Persists directly and authoritatively to Zoho CRM Notes attached to the Office Bazzar Account.
 */
export async function createZohoProduct(product: Partial<Product>): Promise<{
  success: boolean;
  zohoId?: string;
  error?: string;
}> {
  if (!(await isZohoConfigured())) {
    return { success: false, error: 'Zoho CRM is not configured.' };
  }

  try {
    const finalZohoId = await saveZohoProductNote(product);
    const cleanSku = (product.sku || '').trim().toUpperCase();

    if (cleanSku) {
      mappingBySku.set(cleanSku, {
        zohoId: finalZohoId,
        sku: cleanSku,
        websiteId: product.id || `prod-${cleanSku.toLowerCase()}`,
        name: product.name || '',
        price: product.price || 0,
        action: 'created',
      });
      updateProductInLiveCache({
        ...product,
        sku: cleanSku,
        zohoProductId: finalZohoId,
      } as Product);
      invalidateZohoProductCache();
    }

    return {
      success: true,
      zohoId: finalZohoId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[ZohoProducts] createZohoProduct failure:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Update an existing Product record in Zoho CRM.
 * Persists directly and authoritatively to Zoho CRM Notes attached to the Office Bazzar Account.
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

  try {
    const noteId = await saveZohoProductNote({ ...product, sku: cleanSku });
    if (skuFallback && skuFallback.trim().toUpperCase() !== cleanSku) {
      await deleteZohoProductNote(skuFallback.trim().toUpperCase());
    }

    updateProductInLiveCache(
      {
        ...product,
        sku: cleanSku,
        zohoProductId: noteId,
      } as Product,
      skuFallback ? { sku: skuFallback } : undefined
    );
    invalidateZohoProductCache();

    return {
      success: true,
      zohoId: noteId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[ZohoProducts] updateZohoProduct failure:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Delete a product record from Zoho CRM Products module if present in this edition
 */
async function deleteZohoModuleProductRecord(sku: string): Promise<boolean> {
  if (!sku || !(await isZohoConfigured())) return false;
  const cleanSku = sku.trim().toUpperCase();
  try {
    const searchRes = await zohoFetch<any>(
      `/Products/search?criteria=(Product_Code:equals:${encodeURIComponent(cleanSku)})`,
      { method: 'GET', cache: 'no-store' }
    );
    if (searchRes?.data && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
      for (const item of searchRes.data) {
        if (item.id) {
          await zohoFetch<any>(`/Products?ids=${item.id}`, { method: 'DELETE' });
        }
      }
      return true;
    }
  } catch (err) {
    // Products module might not exist in current Zoho CRM edition; warning is sufficient
    console.warn('[ZohoProducts] Notice during Products module search/delete:', err);
  }
  return false;
}

/**
 * Delete or deactivate a Product record in Zoho CRM.
 * Removes/tombstones in Zoho CRM Notes attached to the Office Bazzar Account,
 * deletes any associated Zoho Account image attachments, deletes from Products module if present,
 * and maintains the permanent OB_DELETED_SKUS tombstone registry to prevent static baseline resurrection.
 */
export async function deleteZohoProduct(
  zohoIdOrSku: string,
  skuFallback?: string,
  productMeta?: Partial<Product>
): Promise<{
  success: boolean;
  zohoId?: string;
  error?: string;
}> {
  const cleanSku = (skuFallback || getZohoProductSku(zohoIdOrSku) || zohoIdOrSku).trim().toUpperCase();
  const targetId = (productMeta?.id || zohoIdOrSku).trim();
  const targetSlug = productMeta?.slug?.trim().toLowerCase();

  // 1. Immediately record in persistent tombstone registry so it NEVER resurrects
  try {
    await recordZohoDeletedSku(cleanSku, targetId, targetSlug);
  } catch (recErr) {
    console.warn('[ZohoProducts] Notice recording deleted SKU:', recErr);
  }

  // 2. Remove from live fast indexes and in-memory caches immediately
  mappingBySku.delete(cleanSku);
  removeProductFromLiveCache(cleanSku);
  if (targetId && targetId !== cleanSku) {
    removeProductFromLiveCache(targetId);
  }
  invalidateZohoProductCache();
  invalidateDurableCustomProductCache();

  if (!(await isZohoConfigured())) {
    return { success: true, zohoId: cleanSku };
  }

  try {
    // 3. Find matching Note to collect Note ID and attached images
    const existingNotes = await fetchZohoProductNotes(true);
    let noteItem = existingNotes.get(cleanSku);
    if (!noteItem && targetId) {
      noteItem = existingNotes.get(targetId.toUpperCase());
    }
    if (!noteItem) {
      for (const [sKey, item] of existingNotes.entries()) {
        if (
          item.noteId === zohoIdOrSku ||
          sKey === cleanSku ||
          (item.product as any)?.sku?.toUpperCase() === cleanSku ||
          (item.product as any)?.id?.toUpperCase() === cleanSku ||
          (targetId && (item.product as any)?.id?.toUpperCase() === targetId.toUpperCase())
        ) {
          noteItem = item;
          break;
        }
      }
    }

    // 4. Delete associated Zoho Account Attachment image file(s)
    const imagesToCheck: string[] = [];
    if (productMeta?.images && Array.isArray(productMeta.images)) {
      imagesToCheck.push(...productMeta.images);
    }
    if ((productMeta as any)?.image) imagesToCheck.push(String((productMeta as any).image));
    if ((productMeta as any)?.imageUrl) imagesToCheck.push(String((productMeta as any).imageUrl));
    if (noteItem?.product?.images && Array.isArray(noteItem.product.images)) {
      imagesToCheck.push(...noteItem.product.images);
    }
    if ((noteItem?.product as any)?.image) imagesToCheck.push(String((noteItem?.product as any).image));
    if ((noteItem?.product as any)?.imageUrl) imagesToCheck.push(String((noteItem?.product as any).imageUrl));

    const attachmentIdsToDelete = new Set<string>();
    for (const img of imagesToCheck) {
      if (typeof img === 'string') {
        const match = img.match(/zoho_(\d+)/i);
        if (match && match[1]) {
          attachmentIdsToDelete.add(match[1]);
        }
        // Also purge /tmp and Cloud KV image cache
        if (typeof window === 'undefined') {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { purgeProductImage } = require('@/lib/products/image-store');
            purgeProductImage(img).catch(() => {});
          } catch {
            // ignore
          }
        }
      }
    }

    for (const attId of attachmentIdsToDelete) {
      try {
        await deleteZohoAttachment(attId);
      } catch (attErr) {
        console.warn(`[ZohoProducts] Notice deleting attachment ${attId}:`, attErr);
      }
    }

    // 5. Delete or tombstone the OB_PROD_<SKU> Note in Zoho CRM
    if (noteItem) {
      try {
        await zohoFetch<any>(`/Notes?ids=${noteItem.noteId}`, { method: 'DELETE' });
      } catch {
        const tombstoneContent = JSON.stringify({
          sku: cleanSku,
          isActive: false,
          isDeleted: true,
          updatedAt: new Date().toISOString(),
        });
        await zohoFetch<any>('/Notes', {
          method: 'PUT',
          body: JSON.stringify({
            data: [{ id: noteItem.noteId, Note_Content: tombstoneContent }],
          }),
        });
      }
    } else {
      await deleteZohoProductNote(cleanSku);
      if (zohoIdOrSku && zohoIdOrSku !== cleanSku) {
        await deleteZohoProductNote(zohoIdOrSku);
      }
    }

    // 6. Delete from Zoho's Products module (matched by Product_Code / SKU)
    await deleteZohoModuleProductRecord(cleanSku);

    // 7. Update OB_DELETED_SKUS note in Zoho CRM to ensure permanent synchronization
    await recordZohoDeletedSku(cleanSku, targetId, targetSlug);

    return { success: true, zohoId: cleanSku };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[ZohoProducts] deleteZohoProduct failure:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
