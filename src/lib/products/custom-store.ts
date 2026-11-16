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

/**
 * Persists a product to durable storage across all tiers.
 */
export async function saveCustomProductDurable(product: DurableProduct): Promise<void> {
  if (typeof window !== 'undefined' || !product.sku) return;
  const cleanSku = product.sku.trim().toUpperCase();
  const cleanSlug = (product.slug || cleanSku.toLowerCase()).trim();

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
 */
export async function loadDurableCustomProducts(): Promise<DurableProduct[]> {
  if (typeof window !== 'undefined') return [];
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

  // Tier 3: Durable Cloud KV (authoritative)
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
      for (const rawSku of cloudSkus) {
        const cleanSku = rawSku.toUpperCase();
        if (deletedSkus.has(cleanSku)) continue;
        const rawJson = await callKV<string>(['GET', `custom_prod:${cleanSku}`]);
        if (rawJson && typeof rawJson === 'string') {
          try {
            const parsed = JSON.parse(rawJson);
            if (parsed && parsed.sku) {
              mergedMap.set(cleanSku, parsed);
            }
          } catch {
            // ignore
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

  return Array.from(mergedMap.values());
}
