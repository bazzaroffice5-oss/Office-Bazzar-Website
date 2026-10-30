/**
 * Server-Side Zoho CRM Product Catalog Service
 *
 * Provides authoritative product reading from Zoho CRM -> Products module.
 * Incorporates server-side caching (TTL 5 mins) to prevent exhausting Zoho API rate limits
 * while maintaining sub-millisecond page responsiveness across Next.js App Router.
 */

import { Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/lib/data/catalog';
import { zohoFetch, isZohoConfigured } from './client';
import zohoMappingData from '@/lib/data/zoho_product_mapping.json';

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
let cachedProducts: Product[] | null = null;
let lastCacheSync = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

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

/**
 * Get the Zoho CRM Product ID for a given website product ID or SKU
 */
export function getZohoProductId(productIdOrSku: string): string | undefined {
  return mappingByWebsiteId.get(productIdOrSku)?.zohoId || mappingBySku.get(productIdOrSku)?.zohoId;
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
 * Fetch all active products directly from Zoho CRM Products module.
 * Automatically synchronizes with website catalog metadata (images, categories, slugs).
 */
export async function getProductsFromZoho(forceRefresh = false): Promise<Product[]> {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && now - lastCacheSync < CACHE_TTL_MS) {
    return cachedProducts;
  }

  // Base products list initialized from catalog
  const productsMap = new Map<string, Product>();
  for (const p of INITIAL_PRODUCTS) {
    const zohoInfo = mappingByWebsiteId.get(p.id) || mappingBySku.get(p.sku);
    productsMap.set(p.sku, {
      ...p,
      zohoProductId: zohoInfo?.zohoId,
    } as Product & { zohoProductId?: string });
  }

  // If Zoho CRM is configured, query Zoho CRM Products API
  if (await isZohoConfigured()) {
    try {
      let hasMore = true;
      let pageToken: string | undefined = undefined;
      const zohoRecords: ZohoProductRecord[] = [];

      while (hasMore) {
        const endpoint: string = pageToken
          ? `/Products?fields=id,Product_Name,Product_Code,Unit_Price,Qty_in_Stock,Product_Active,Description,Modified_Time&per_page=100&page_token=${pageToken}`
          : `/Products?fields=id,Product_Name,Product_Code,Unit_Price,Qty_in_Stock,Product_Active,Description,Modified_Time&per_page=100`;

        const res = await zohoFetch<any>(endpoint, { method: 'GET' });

        if (res?.data && Array.isArray(res.data)) {
          zohoRecords.push(...res.data);
        }

        hasMore = res?.info?.more_records === true;
        pageToken = res?.info?.next_page_token;
      }

      // Merge Zoho CRM authoritative live state into product catalog
      for (const zRec of zohoRecords) {
        const sku = zRec.Product_Code?.trim();
        if (!sku) continue;

        const existing = productsMap.get(sku);
        if (existing) {
          // Update live pricing and stock from Zoho CRM
          const price = zRec.Unit_Price !== undefined ? Number(zRec.Unit_Price) : (Number(existing.price) || 0);
          const stock = zRec.Qty_in_Stock !== undefined ? Number(zRec.Qty_in_Stock) : (Number(existing.stockQuantity) || 0);
          const isActive = zRec.Product_Active !== undefined ? zRec.Product_Active : existing.isActive;

          productsMap.set(sku, {
            ...existing,
            price,
            stockQuantity: stock,
            isActive,
            zohoProductId: zRec.id,
          } as Product & { zohoProductId?: string });

          // Update memory mapping index
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

      console.log(`[ZohoProducts] Sourced ${zohoRecords.length} live products directly from Zoho CRM.`);
    } catch (apiErr) {
      console.warn('[ZohoProducts] Failed to fetch live products from Zoho CRM. Using local cached catalog:', apiErr);
    }
  }

  cachedProducts = Array.from(productsMap.values());
  lastCacheSync = now;
  return cachedProducts;
}

/**
 * Invalidate the product cache to force fresh retrieval from Zoho CRM on next request
 */
export function invalidateZohoProductCache(): void {
  cachedProducts = null;
  lastCacheSync = 0;
}
