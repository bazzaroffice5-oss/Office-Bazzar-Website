/**
 * Durable Custom Products Storage Engine (Serverless & Cloud KV)
 *
 * Persists custom and newly added products across Vercel serverless containers
 * even when Zoho CRM daily write rate limit (TOO_MANY_REQUESTS) is encountered.
 */

import { Product } from '@/types';
import { callKV } from '@/lib/distributed/kv-client';

export type DurableProduct = Product & { isDeleted?: boolean; zohoProductId?: string };

function readDiskProducts(): DurableProduct[] {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const p = path.join(process.cwd(), 'src', 'lib', 'data', 'custom_products.json');
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function readTmpProducts(): DurableProduct[] {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const os = require('os');
      const p = path.join(os.tmpdir(), 'officebazzar_custom_products.json');
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function writeTmpProducts(products: DurableProduct[]) {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const os = require('os');
      const p = path.join(os.tmpdir(), 'officebazzar_custom_products.json');
      fs.writeFileSync(p, JSON.stringify(products, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }
}

function writeDiskProducts(products: DurableProduct[]) {
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const p = path.join(process.cwd(), 'src', 'lib', 'data', 'custom_products.json');
      fs.writeFileSync(p, JSON.stringify(products, null, 2), 'utf8');
    } catch {
      // read-only in production Vercel is expected
    }
  }
}

let cachedDurableProducts: DurableProduct[] | null = null;
let durableCacheExpiresAt = 0;
const DURABLE_CACHE_TTL_MS = 60 * 1000; // 60 seconds container-level cache

/**
 * Invalidate in-memory cache when new durable product is saved or deleted
 */
export function invalidateDurableCustomProductCache(): void {
  cachedDurableProducts = null;
  durableCacheExpiresAt = 0;
}

/**
 * Persists a product to durable storage across all tiers.
 */
export async function saveCustomProductDurable(product: DurableProduct): Promise<void> {
  if (typeof window !== 'undefined' || !product.sku) return;
  const cleanSku = product.sku.trim().toUpperCase();
  const cleanSlug = (product.slug || cleanSku.toLowerCase()).trim();

  // Invalidate in-memory cache immediately
  invalidateDurableCustomProductCache();

  // 1. Ephemeral lambda disk
  try {
    const tmpList = readTmpProducts();
    const idx = tmpList.findIndex(p => p.sku && p.sku.toUpperCase() === cleanSku);
    if (idx !== -1) {
      tmpList[idx] = { ...tmpList[idx], ...product, sku: cleanSku, isDeleted: false };
    } else {
      tmpList.unshift({ ...product, sku: cleanSku, isDeleted: false });
    }
    writeTmpProducts(tmpList);
  } catch {
    // ignore
  }

  // 2. Local disk (works in dev and build phase)
  try {
    const diskList = readDiskProducts();
    const dIdx = diskList.findIndex(p => p.sku && p.sku.toUpperCase() === cleanSku);
    if (dIdx !== -1) {
      diskList[dIdx] = { ...diskList[dIdx], ...product, sku: cleanSku, isDeleted: false };
    } else {
      diskList.unshift({ ...product, sku: cleanSku, isDeleted: false });
    }
    writeDiskProducts(diskList);
  } catch {
    // ignore
  }

  // 3. Durable Cloud KV (Upstash Redis REST)
  try {
    if (product.isDeleted) {
      await callKV(['DEL', `custom_prod:${cleanSku}`]);
      await callKV(['SREM', 'custom_prod_skus', cleanSku]);
      await callKV(['SADD', 'custom_prod_deleted_skus', cleanSku]);
    } else {
      await callKV(['SET', `custom_prod:${cleanSku}`, JSON.stringify(product)]);
      await callKV(['SADD', 'custom_prod_skus', cleanSku]);
      await callKV(['SET', `custom_prod_slug:${cleanSlug}`, cleanSku]);
      await callKV(['SREM', 'custom_prod_deleted_skus', cleanSku]);
    }
  } catch (kvErr) {
    console.warn('[CustomStore] Cloud KV write notice:', kvErr);
  }
}

/**
 * Loads all durable custom products, merging disk, container cache, and Cloud KV.
 * Utilizes high-performance MGET single-batch queries and 60-second in-memory caching.
 */
export async function loadDurableCustomProducts(force = false): Promise<DurableProduct[]> {
  if (typeof window !== 'undefined') return [];
  const now = Date.now();
  if (!force && cachedDurableProducts && now < durableCacheExpiresAt) {
    return cachedDurableProducts;
  }

  const mergedMap = new Map<string, DurableProduct>();
  const deletedSkus = new Set<string>();

  // Tier 1: Local disk baseline
  const diskProducts = readDiskProducts();
  for (const p of diskProducts) {
    if (p.sku) {
      const cleanSku = p.sku.toUpperCase();
      if (p.isDeleted) {
        deletedSkus.add(cleanSku);
      } else {
        mergedMap.set(cleanSku, p);
      }
    }
  }

  // Tier 2: Ephemeral container disk
  const tmpProducts = readTmpProducts();
  for (const p of tmpProducts) {
    if (p.sku) {
      const cleanSku = p.sku.toUpperCase();
      if (p.isDeleted) {
        deletedSkus.add(cleanSku);
        mergedMap.delete(cleanSku);
      } else {
        mergedMap.set(cleanSku, p);
      }
    }
  }

  // Tier 3: Durable Cloud KV (authoritative) via single-batch MGET query
  try {
    const deletedInKv = await callKV<string[]>(['SMEMBERS', 'custom_prod_deleted_skus']);
    if (Array.isArray(deletedInKv)) {
      for (const d of deletedInKv) {
        deletedSkus.add(d.toUpperCase());
        mergedMap.delete(d.toUpperCase());
      }
    }

    const cloudSkus = await callKV<string[]>(['SMEMBERS', 'custom_prod_skus']);
    if (Array.isArray(cloudSkus) && cloudSkus.length > 0) {
      const validSkus = cloudSkus
        .map((s) => s.toUpperCase())
        .filter((sku) => !deletedSkus.has(sku));

      if (validSkus.length > 0) {
        // High-performance single-batch MGET
        const keys = validSkus.map((sku) => `custom_prod:${sku}`);
        const rawResults = await callKV<(string | null)[]>(['MGET', ...keys]);

        if (Array.isArray(rawResults)) {
          for (let i = 0; i < rawResults.length; i++) {
            const raw = rawResults[i];
            if (raw && typeof raw === 'string') {
              try {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.sku) {
                  mergedMap.set(parsed.sku.toUpperCase(), parsed);
                }
              } catch {
                // ignore malformed entry
              }
            }
          }
        }
      }
    }
  } catch (kvErr) {
    console.warn('[CustomStore] Cloud KV read notice:', kvErr);
  }

  // Filter out any explicitly deleted records
  for (const del of deletedSkus) {
    mergedMap.delete(del);
  }

  const result = Array.from(mergedMap.values());
  cachedDurableProducts = result;
  durableCacheExpiresAt = now + DURABLE_CACHE_TTL_MS;
  return result;
}

/**
 * Direct targeted lookup by slug without loading the entire custom catalog
 */
export async function getCustomProductBySlugDurable(slug: string): Promise<DurableProduct | null> {
  const clean = slug.toLowerCase().trim();
  // 1. Check in-memory cache first
  if (cachedDurableProducts) {
    const found = cachedDurableProducts.find(
      (p) => p.slug.toLowerCase() === clean && !p.isDeleted
    );
    if (found) return found;
  }

  // 2. Direct single KV lookup
  try {
    const sku = await callKV<string>(['GET', `custom_prod_slug:${clean}`]);
    if (sku && typeof sku === 'string') {
      const raw = await callKV<string>(['GET', `custom_prod:${sku.toUpperCase()}`]);
      if (raw && typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        if (parsed && !parsed.isDeleted) return parsed;
      }
    }
  } catch {
    // fallback
  }

  // 3. Fallback to loaded products
  const all = await loadDurableCustomProducts();
  return all.find((p) => p.slug.toLowerCase() === clean && !p.isDeleted) || null;
}
