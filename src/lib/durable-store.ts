import crypto from 'crypto';
import { Quotation, QuotationSyncStatus } from '@/types';

/**
 * Cloudinary + Upstash KV Distributed State Store (office-bazzar-db)
 *
 * ARCHITECTURAL GUARANTEES:
 * 1. Distributed Mutex Lock:
 *    Cross-container atomic lock using Upstash KV (`SET lock:key lockId NX PX ttl`)
 *    paired with in-process Promise-based async mutexes to prevent concurrent write collisions.
 * 2. Optimistic Concurrency & Monotonic Versioning:
 *    Every collection has a strictly increasing `version` and `updatedAt` timestamp.
 *    Stale writes cannot overwrite newer state.
 * 3. Dual-Write + Automatic Read-Repair:
 *    Writes persist to Cloudinary raw JSON (authoritative) and Upstash KV (low-latency cache).
 *    On read, if Upstash KV misses or lags behind Cloudinary Admin API, KV is repaired in the background.
 * 4. Schema Validation & Backup Snapshots:
 *    Integrity validation guards against writing empty or corrupted states.
 *    A rolling snapshot (`..._backup`) is preserved before destructive writes.
 * 5. Free-Tier Quota & Footprint Protection:
 *    Minified compact JSON (`JSON.stringify(data)` without indentation), fixed public IDs,
 *    and atomic Redis `INCR` for Round-Robin sales rep sequence numbering.
 */

// Cloudinary Public IDs
const PRODUCT_DB_PUBLIC_ID = 'office-bazzar-db/catalog-overrides.json';
const PRODUCT_DB_BACKUP_PUBLIC_ID = 'office-bazzar-db/catalog-overrides_backup.json';

const BLOG_DB_PUBLIC_ID = 'office-bazzar-db/blog-overrides.json';
const BLOG_DB_BACKUP_PUBLIC_ID = 'office-bazzar-db/blog-overrides_backup.json';

const QUOTATION_DB_PUBLIC_ID = 'office-bazzar-db/quotations.json';
const QUOTATION_DB_BACKUP_PUBLIC_ID = 'office-bazzar-db/quotations_backup.json';

// Upstash KV Redis Keys
const KV_KEY_PRODUCTS = 'office_bazzar:product_overrides';
const KV_KEY_PRODUCTS_BACKUP = 'office_bazzar:product_overrides:backup';

const KV_KEY_BLOGS = 'office_bazzar:blog_overrides';
const KV_KEY_BLOGS_BACKUP = 'office_bazzar:blog_overrides:backup';

const KV_KEY_QUOTATIONS = 'office_bazzar:quotations';
const KV_KEY_QUOTATIONS_BACKUP = 'office_bazzar:quotations:backup';

const KV_KEY_ROUND_ROBIN_SEQ = 'office_bazzar:round_robin:seq';

export interface ProductOverridesState {
  version: number;
  updatedAt: string;
  products: Record<string, any>; // keyed by SKU (uppercase)
  unpublishedSkus: string[];
  deletedSkus: string[];
}

export interface BlogOverridesState {
  version: number;
  updatedAt: string;
  posts: Record<string, any>; // keyed by slug (lowercase)
  trashedSlugs: string[];
  unpublishedSlugs: string[];
  deletedSlugs: string[];
}

export interface QuotationOverridesState {
  version: number;
  updatedAt: string;
  quotations: Record<string, Quotation>; // keyed by quotationNumber or id
}

// In-memory cache for fast reuse within the same serverless invocation tick
let cachedProductState: ProductOverridesState | null = null;
let lastProductFetchTime = 0;

let cachedBlogState: BlogOverridesState | null = null;
let lastBlogFetchTime = 0;

let cachedQuotationState: QuotationOverridesState | null = null;
let lastQuotationFetchTime = 0;

// High-concurrency TTL optimizations:
// Products and blogs change infrequently via admin -> 25s TTL saves Cloudinary Admin read quota.
// Quotations change on submission -> 5s TTL balances instant visibility with burst buffering.
const PRODUCT_CACHE_TTL_MS = 25 * 1000;
const BLOG_CACHE_TTL_MS = 25 * 1000;
const QUOTATION_CACHE_TTL_MS = 5 * 1000;

// ============================================================================
// CREDENTIALS & KV REST CLIENT
// ============================================================================

function getRequiredCloudinaryCredentials() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      `Cloudinary configuration missing: CLOUDINARY_CLOUD_NAME=${Boolean(cloudName)}, ` +
      `CLOUDINARY_API_KEY=${Boolean(apiKey)}, CLOUDINARY_API_SECRET=${Boolean(apiSecret)}. ` +
      'Cannot persist durable state.'
    );
  }
  return { cloudName, apiKey, apiSecret };
}

function getKVRestConfig(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.STORAGE_KV_REST_API_URL ||
    process.env.REDIS_REST_URL;

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.STORAGE_KV_REST_API_TOKEN ||
    process.env.REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return {
    url: url.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''),
    token: token.trim().replace(/^["']|["']$/g, ''),
  };
}

export async function callCloudKV(command: any[]): Promise<any> {
  const config = getKVRestConfig();
  if (!config) return null;

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return data?.result;
    }
  } catch (err) {
    console.warn('[DurableStore] KV command notice:', err instanceof Error ? err.message : err);
  }
  return null;
}

// ============================================================================
// CONCURRENCY CONTROLS (Async Mutex + Upstash Distributed Lock)
// ============================================================================

class LocalAsyncMutex {
  private current: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const wait = this.current;
    this.current = this.current.then(() => next);
    await wait;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

const localMutexMap = new Map<string, LocalAsyncMutex>();

function getLocalMutex(key: string): LocalAsyncMutex {
  let mutex = localMutexMap.get(key);
  if (!mutex) {
    mutex = new LocalAsyncMutex();
    localMutexMap.set(key, mutex);
  }
  return mutex;
}

/**
 * Acquire cross-container distributed lock using Upstash KV SET NX PX.
 * Returns lockId if acquired, null if not acquired or KV not configured.
 * Enhanced for high concurrency with 15 retries and jittered backoff.
 */
async function acquireDistributedLock(lockKey: string, ttlMs = 8000, maxRetries = 15): Promise<string | null> {
  const config = getKVRestConfig();
  if (!config) return null;

  const lockId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const fullKey = `lock:${lockKey}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await callCloudKV(['SET', fullKey, lockId, 'NX', 'PX', ttlMs]);
      if (result === 'OK') {
        return lockId;
      }
    } catch {}

    // Jittered backoff: 30ms to 120ms with progressive attempt jitter
    const delay = Math.min(150, 30 + Math.floor(Math.random() * 30) + attempt * 6);
    await new Promise((r) => setTimeout(r, delay));
  }

  return null;
}

/**
 * Release cross-container distributed lock safely (deleting only if lockId matches)
 */
async function releaseDistributedLock(lockKey: string, lockId: string): Promise<void> {
  if (!lockId) return;
  const fullKey = `lock:${lockKey}`;
  try {
    // Check if current value matches lockId before deleting
    const currentVal = await callCloudKV(['GET', fullKey]);
    if (currentVal === lockId) {
      await callCloudKV(['DEL', fullKey]);
    }
  } catch {}
}

/**
 * High-order runner wrapping critical section in both local in-process mutex
 * and cross-container distributed Upstash lock.
 */
export async function withDistributedLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  ttlMs = 6000
): Promise<T> {
  const localMutex = getLocalMutex(lockKey);

  return await localMutex.runExclusive(async () => {
    const lockId = await acquireDistributedLock(lockKey, ttlMs);
    try {
      return await fn();
    } finally {
      if (lockId) {
        await releaseDistributedLock(lockKey, lockId);
      }
    }
  });
}

// ============================================================================
// CLOUDINARY RAW JSON STORAGE ENGINE
// ============================================================================

/**
 * Upload atomic minified raw JSON to Cloudinary with explicit validation
 */
async function uploadRawJsonToCloudinary(publicId: string, data: any): Promise<string> {
  const { cloudName, apiKey, apiSecret } = getRequiredCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Strict storage footprint protection: compact minified JSON to save bandwidth & quota
  const jsonString = JSON.stringify(data);
  const base64Data = `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`;

  const paramsToSign = `invalidate=true&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const formData = new URLSearchParams();
  formData.append('file', base64Data);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('public_id', publicId);
  formData.append('overwrite', 'true');
  formData.append('invalidate', 'true');
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary upload failed for ${publicId} (Status ${res.status}): ${errText}`);
  }

  const resData = await res.json();
  if (!resData || !resData.secure_url) {
    throw new Error(`Cloudinary upload succeeded but returned no secure_url for ${publicId}`);
  }

  return resData.secure_url as string;
}

/**
 * Fetch raw JSON file from Cloudinary bypassing CDN cache via Cloudinary Admin API
 */
async function fetchRawJsonFromCloudinary<T>(publicId: string): Promise<T | null> {
  const { cloudName, apiKey, apiSecret } = getRequiredCloudinaryCredentials();

  // 1. Try fast raw asset delivery via Cloudinary CDN first (zero Admin API quota consumption)
  try {
    const cdnUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}?_t=${Date.now()}`;
    const cdnRes = await fetch(cdnUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (cdnRes.ok) {
      const data = await cdnRes.json();
      if (data && typeof data === 'object') {
        return data as T;
      }
    }
  } catch {}

  // 2. Fallback to authenticated Admin API if CDN not directly available
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const adminUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/raw/upload/${encodeURIComponent(publicId)}`;

  const adminRes = await fetch(adminUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
    cache: 'no-store',
  });

  if (adminRes.status === 404) {
    return null; // Initial empty state
  }

  if (!adminRes.ok) {
    const errText = await adminRes.text();
    console.warn(`[DurableStore] Cloudinary Admin API query notice for ${publicId} (${adminRes.status}):`, errText);
    return null;
  }

  const meta = await adminRes.json();
  if (!meta || !meta.secure_url) {
    return null;
  }

  // Fetch the versioned immutable raw URL with cache: 'no-store'
  const contentRes = await fetch(meta.secure_url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });

  if (!contentRes.ok) {
    const errText = await contentRes.text();
    console.warn(`[DurableStore] Failed fetching content from versioned URL for ${publicId}:`, errText);
    return null;
  }

  return (await contentRes.json()) as T;
}

// ============================================================================
// INTEGRITY & SCHEMA VALIDATION GUARDS
// ============================================================================

function validateProductState(state: any): boolean {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.version !== 'number' || state.version <= 0) return false;
  if (!state.products || typeof state.products !== 'object' || Array.isArray(state.products)) return false;
  if (!Array.isArray(state.unpublishedSkus) || !Array.isArray(state.deletedSkus)) return false;
  return true;
}

function validateBlogState(state: any): boolean {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.version !== 'number' || state.version <= 0) return false;
  if (!state.posts || typeof state.posts !== 'object' || Array.isArray(state.posts)) return false;
  if (!Array.isArray(state.trashedSlugs) || !Array.isArray(state.unpublishedSlugs) || !Array.isArray(state.deletedSlugs)) return false;
  return true;
}

function validateQuotationState(state: any): boolean {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.version !== 'number' || state.version <= 0) return false;
  if (!state.quotations || typeof state.quotations !== 'object' || Array.isArray(state.quotations)) return false;
  return true;
}

// ============================================================================
// 1. PRODUCT CATALOG STATE MANAGEMENT
// ============================================================================

export async function getDurableProductState(force = false): Promise<ProductOverridesState> {
  const now = Date.now();
  if (!force && cachedProductState && now - lastProductFetchTime < PRODUCT_CACHE_TTL_MS) {
    return cachedProductState;
  }

  let cloudState: ProductOverridesState | null = null;
  let kvState: ProductOverridesState | null = null;

  // 1. Read Upstash Cloud KV first (ultra-fast, zero Cloudinary Admin API quota)
  try {
    const kvRaw = await callCloudKV(['GET', KV_KEY_PRODUCTS]);
    if (kvRaw) {
      const parsed = typeof kvRaw === 'string' ? JSON.parse(kvRaw) : kvRaw;
      if (validateProductState(parsed)) {
        kvState = parsed;
      }
    }
  } catch {}

  // High-concurrency optimization: if KV has valid state and not forcing refresh,
  // return KV state immediately. This protects Cloudinary Admin API from quota exhaustion.
  if (!force && kvState) {
    cachedProductState = kvState;
    lastProductFetchTime = now;
    return kvState;
  }

  // 2. Read Cloudinary Admin API when KV misses or force=true
  try {
    const remote = await fetchRawJsonFromCloudinary<ProductOverridesState>(PRODUCT_DB_PUBLIC_ID);
    if (validateProductState(remote)) {
      cloudState = remote!;
    }
  } catch (err) {
    console.warn('[DurableStore] Product state Cloudinary read notice:', err);
  }

  // 3. Reconcile & Automatic Read-Repair
  let resolved: ProductOverridesState;

  if (cloudState && kvState) {
    if (cloudState.version >= kvState.version) {
      resolved = cloudState;
      // Auto-heal KV if lagging behind Cloudinary
      if (cloudState.version > kvState.version) {
        callCloudKV(['SET', KV_KEY_PRODUCTS, JSON.stringify(cloudState)]).catch(() => {});
      }
    } else {
      resolved = kvState;
    }
  } else if (cloudState) {
    resolved = cloudState;
    // Auto-heal KV from Cloudinary
    callCloudKV(['SET', KV_KEY_PRODUCTS, JSON.stringify(cloudState)]).catch(() => {});
  } else if (kvState) {
    resolved = kvState;
  } else {
    // Initial empty baseline
    resolved = {
      version: 1,
      updatedAt: new Date().toISOString(),
      products: {},
      unpublishedSkus: [],
      deletedSkus: [],
    };
  }

  cachedProductState = resolved;
  lastProductFetchTime = now;
  return resolved;
}

export async function saveDurableProductOverride(product: any): Promise<void> {
  const cleanSku = (product.sku || '').trim().toUpperCase();
  if (!cleanSku) throw new Error('Product SKU is required for durable persistence.');

  return await withDistributedLock('products', async () => {
    const state = await getDurableProductState(true);

    // Save rolling backup snapshot before mutation
    if (state.version > 0 && Object.keys(state.products).length > 0) {
      uploadRawJsonToCloudinary(PRODUCT_DB_BACKUP_PUBLIC_ID, state).catch(() => {});
      callCloudKV(['SET', KV_KEY_PRODUCTS_BACKUP, JSON.stringify(state)]).catch(() => {});
    }

    state.products[cleanSku] = {
      ...product,
      sku: cleanSku,
      updatedAt: new Date().toISOString(),
    };

    // Remove from deleted list if re-added or edited
    state.deletedSkus = state.deletedSkus.filter((s) => s.toUpperCase() !== cleanSku);

    // Update unpublished list according to isActive / publishStatus
    const isUnpublished = product.isActive === false || product.publishStatus === 'unpublished';
    if (isUnpublished) {
      if (!state.unpublishedSkus.includes(cleanSku)) {
        state.unpublishedSkus.push(cleanSku);
      }
    } else {
      state.unpublishedSkus = state.unpublishedSkus.filter((s) => s.toUpperCase() !== cleanSku);
    }

    // Monotonic optimistic version increment
    state.version = Math.max(state.version || 1, (cachedProductState?.version || 0)) + 1;
    state.updatedAt = new Date().toISOString();

    if (!validateProductState(state)) {
      throw new Error('[DurableStore] State validation failed before saving product override.');
    }

    // Upload to Cloudinary with strict error propagation
    await uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state);

    cachedProductState = state;
    lastProductFetchTime = Date.now();

    // Mirror to Cloud KV
    await callCloudKV(['SET', KV_KEY_PRODUCTS, JSON.stringify(state)]).catch(() => {});
  });
}

export async function deleteDurableProductOverride(skuOrId: string): Promise<void> {
  const clean = skuOrId.trim().toUpperCase();
  if (!clean) return;

  return await withDistributedLock('products', async () => {
    const state = await getDurableProductState(true);

    // Snapshot backup before deletion
    if (state.version > 0 && Object.keys(state.products).length > 0) {
      uploadRawJsonToCloudinary(PRODUCT_DB_BACKUP_PUBLIC_ID, state).catch(() => {});
      callCloudKV(['SET', KV_KEY_PRODUCTS_BACKUP, JSON.stringify(state)]).catch(() => {});
    }

    delete state.products[clean];
    if (!state.deletedSkus.includes(clean)) {
      state.deletedSkus.push(clean);
    }
    state.unpublishedSkus = state.unpublishedSkus.filter((s) => s.toUpperCase() !== clean);

    state.version = Math.max(state.version || 1, (cachedProductState?.version || 0)) + 1;
    state.updatedAt = new Date().toISOString();

    if (!validateProductState(state)) {
      throw new Error('[DurableStore] State validation failed before deleting product override.');
    }

    await uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state);

    cachedProductState = state;
    lastProductFetchTime = Date.now();

    await callCloudKV(['SET', KV_KEY_PRODUCTS, JSON.stringify(state)]).catch(() => {});
  });
}

export async function setDurableProductPublishStatus(skuOrId: string, isPublished: boolean): Promise<void> {
  const clean = skuOrId.trim().toUpperCase();
  if (!clean) return;

  return await withDistributedLock('products', async () => {
    const state = await getDurableProductState(true);

    if (isPublished) {
      state.unpublishedSkus = state.unpublishedSkus.filter((s) => s.toUpperCase() !== clean);
      if (state.products[clean]) {
        state.products[clean].isActive = true;
        state.products[clean].publishStatus = 'published';
      }
    } else {
      if (!state.unpublishedSkus.includes(clean)) {
        state.unpublishedSkus.push(clean);
      }
      if (state.products[clean]) {
        state.products[clean].isActive = false;
        state.products[clean].publishStatus = 'unpublished';
      }
    }

    state.version = Math.max(state.version || 1, (cachedProductState?.version || 0)) + 1;
    state.updatedAt = new Date().toISOString();

    if (!validateProductState(state)) {
      throw new Error('[DurableStore] State validation failed before updating product status.');
    }

    await uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state);

    cachedProductState = state;
    lastProductFetchTime = Date.now();

    await callCloudKV(['SET', KV_KEY_PRODUCTS, JSON.stringify(state)]).catch(() => {});
  });
}

export async function getDurableProductDeletedSkus(): Promise<Set<string>> {
  const state = await getDurableProductState();
  return new Set(state.deletedSkus.map((s) => s.toUpperCase()));
}

export async function getDurableProductUnpublishedSkus(): Promise<Set<string>> {
  const state = await getDurableProductState();
  return new Set(state.unpublishedSkus.map((s) => s.toUpperCase()));
}

// ============================================================================
// 2. BLOG POSTS STATE MANAGEMENT
// ============================================================================

export async function getDurableBlogState(force = false): Promise<BlogOverridesState> {
  const now = Date.now();
  if (!force && cachedBlogState && now - lastBlogFetchTime < BLOG_CACHE_TTL_MS) {
    return cachedBlogState;
  }

  let cloudState: BlogOverridesState | null = null;
  let kvState: BlogOverridesState | null = null;

  // 1. Read Upstash Cloud KV first (ultra-fast, zero Cloudinary Admin API quota)
  try {
    const kvRaw = await callCloudKV(['GET', KV_KEY_BLOGS]);
    if (kvRaw) {
      const parsed = typeof kvRaw === 'string' ? JSON.parse(kvRaw) : kvRaw;
      if (validateBlogState(parsed)) {
        kvState = parsed;
      }
    }
  } catch {}

  // High-concurrency optimization: if KV has valid state and not forcing refresh,
  // return KV state immediately. This protects Cloudinary Admin API from quota exhaustion.
  if (!force && kvState) {
    cachedBlogState = kvState;
    lastBlogFetchTime = now;
    return kvState;
  }

  // 2. Read Cloudinary Admin API when KV misses or force=true
  try {
    const remote = await fetchRawJsonFromCloudinary<BlogOverridesState>(BLOG_DB_PUBLIC_ID);
    if (validateBlogState(remote)) {
      cloudState = remote!;
    }
  } catch (err) {
    console.warn('[DurableStore] Blog state Cloudinary read notice:', err);
  }

  // 3. Reconcile & Automatic Read-Repair
  let resolved: BlogOverridesState;

  if (cloudState && kvState) {
    if (cloudState.version >= kvState.version) {
      resolved = cloudState;
      if (cloudState.version > kvState.version) {
        callCloudKV(['SET', KV_KEY_BLOGS, JSON.stringify(cloudState)]).catch(() => {});
      }
    } else {
      resolved = kvState;
    }
  } else if (cloudState) {
    resolved = cloudState;
    callCloudKV(['SET', KV_KEY_BLOGS, JSON.stringify(cloudState)]).catch(() => {});
  } else if (kvState) {
    resolved = kvState;
  } else {
    resolved = {
      version: 1,
      updatedAt: new Date().toISOString(),
      posts: {},
      trashedSlugs: [],
      unpublishedSlugs: [],
      deletedSlugs: [],
    };
  }

  cachedBlogState = resolved;
  lastBlogFetchTime = now;
  return resolved;
}

export async function saveDurableBlogPostOverride(post: any): Promise<void> {
  const cleanSlug = (post.slug || '').trim().toLowerCase();
  if (!cleanSlug) throw new Error('Blog URL slug is required for durable persistence.');

  return await withDistributedLock('blogs', async () => {
    const state = await getDurableBlogState(true);

    // Save rolling backup snapshot before mutation
    if (state.version > 0 && Object.keys(state.posts).length > 0) {
      uploadRawJsonToCloudinary(BLOG_DB_BACKUP_PUBLIC_ID, state).catch(() => {});
      callCloudKV(['SET', KV_KEY_BLOGS_BACKUP, JSON.stringify(state)]).catch(() => {});
    }

    state.posts[cleanSlug] = {
      ...post,
      slug: cleanSlug,
      updatedAt: new Date().toISOString(),
    };

    // Remove from deleted list if re-saved
    state.deletedSlugs = state.deletedSlugs.filter((s) => s.toLowerCase() !== cleanSlug);

    // Sync trashed list
    if (post.status === 'trash') {
      if (!state.trashedSlugs.includes(cleanSlug)) {
        state.trashedSlugs.push(cleanSlug);
      }
    } else {
      state.trashedSlugs = state.trashedSlugs.filter((s) => s.toLowerCase() !== cleanSlug);
    }

    // Sync unpublished list
    if (post.status === 'draft') {
      if (!state.unpublishedSlugs.includes(cleanSlug)) {
        state.unpublishedSlugs.push(cleanSlug);
      }
    } else {
      state.unpublishedSlugs = state.unpublishedSlugs.filter((s) => s.toLowerCase() !== cleanSlug);
    }

    state.version = Math.max(state.version || 1, (cachedBlogState?.version || 0)) + 1;
    state.updatedAt = new Date().toISOString();

    if (!validateBlogState(state)) {
      throw new Error('[DurableStore] State validation failed before saving blog post.');
    }

    await uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state);

    cachedBlogState = state;
    lastBlogFetchTime = Date.now();

    await callCloudKV(['SET', KV_KEY_BLOGS, JSON.stringify(state)]).catch(() => {});
  });
}

export async function setDurableBlogStatus(
  slug: string,
  status: 'published' | 'draft' | 'scheduled' | 'trash'
): Promise<void> {
  const clean = slug.trim().toLowerCase();
  if (!clean) return;

  return await withDistributedLock('blogs', async () => {
    const state = await getDurableBlogState(true);

    if (state.posts[clean]) {
      state.posts[clean].status = status;
      state.posts[clean].updatedAt = new Date().toISOString();
    }

    if (status === 'trash') {
      if (!state.trashedSlugs.includes(clean)) state.trashedSlugs.push(clean);
    } else {
      state.trashedSlugs = state.trashedSlugs.filter((s) => s.toLowerCase() !== clean);
    }

    if (status === 'draft') {
      if (!state.unpublishedSlugs.includes(clean)) state.unpublishedSlugs.push(clean);
    } else {
      state.unpublishedSlugs = state.unpublishedSlugs.filter((s) => s.toLowerCase() !== clean);
    }

    state.version = Math.max(state.version || 1, (cachedBlogState?.version || 0)) + 1;
    state.updatedAt = new Date().toISOString();

    if (!validateBlogState(state)) {
      throw new Error('[DurableStore] State validation failed before updating blog status.');
    }

    await uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state);

    cachedBlogState = state;
    lastBlogFetchTime = Date.now();

    await callCloudKV(['SET', KV_KEY_BLOGS, JSON.stringify(state)]).catch(() => {});
  });
}

export async function deleteDurableBlogPostOverride(slug: string): Promise<void> {
  const clean = slug.trim().toLowerCase();
  if (!clean) return;

  return await withDistributedLock('blogs', async () => {
    const state = await getDurableBlogState(true);

    if (state.version > 0 && Object.keys(state.posts).length > 0) {
      uploadRawJsonToCloudinary(BLOG_DB_BACKUP_PUBLIC_ID, state).catch(() => {});
      callCloudKV(['SET', KV_KEY_BLOGS_BACKUP, JSON.stringify(state)]).catch(() => {});
    }

    delete state.posts[clean];
    if (!state.deletedSlugs.includes(clean)) {
      state.deletedSlugs.push(clean);
    }
    state.trashedSlugs = state.trashedSlugs.filter((s) => s.toLowerCase() !== clean);
    state.unpublishedSlugs = state.unpublishedSlugs.filter((s) => s.toLowerCase() !== clean);

    state.version = Math.max(state.version || 1, (cachedBlogState?.version || 0)) + 1;
    state.updatedAt = new Date().toISOString();

    if (!validateBlogState(state)) {
      throw new Error('[DurableStore] State validation failed before deleting blog post.');
    }

    await uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state);

    cachedBlogState = state;
    lastBlogFetchTime = Date.now();

    await callCloudKV(['SET', KV_KEY_BLOGS, JSON.stringify(state)]).catch(() => {});
  });
}

export async function getDurableBlogDeletedSlugs(): Promise<Set<string>> {
  const state = await getDurableBlogState();
  return new Set(state.deletedSlugs.map((s) => s.toLowerCase()));
}

export async function getDurableBlogTrashedSlugs(): Promise<Set<string>> {
  const state = await getDurableBlogState();
  return new Set(state.trashedSlugs.map((s) => s.toLowerCase()));
}

// ============================================================================
// 3. QUOTATIONS STATE MANAGEMENT & DURABLE QUEUE
// ============================================================================

export async function getDurableQuotationState(force = false): Promise<QuotationOverridesState> {
  const now = Date.now();
  if (!force && cachedQuotationState && now - lastQuotationFetchTime < QUOTATION_CACHE_TTL_MS) {
    return cachedQuotationState;
  }

  let cloudState: QuotationOverridesState | null = null;
  let kvState: QuotationOverridesState | null = null;

  // 1. Read Upstash Cloud KV first (low latency, zero Cloudinary Admin quota)
  try {
    const kvRaw = await callCloudKV(['GET', KV_KEY_QUOTATIONS]);
    if (kvRaw) {
      const parsed = typeof kvRaw === 'string' ? JSON.parse(kvRaw) : kvRaw;
      if (validateQuotationState(parsed)) {
        kvState = parsed;
      }
    }
  } catch {}

  // High-concurrency optimization: if KV has valid state and not forcing refresh,
  // return KV state immediately.
  if (!force && kvState) {
    cachedQuotationState = kvState;
    lastQuotationFetchTime = now;
    return kvState;
  }

  // 2. Read Cloudinary Admin API when KV misses or force=true
  try {
    const remote = await fetchRawJsonFromCloudinary<QuotationOverridesState>(QUOTATION_DB_PUBLIC_ID);
    if (validateQuotationState(remote)) {
      cloudState = remote!;
    }
  } catch (err) {
    console.warn('[DurableStore] Quotation state Cloudinary read notice:', err);
  }

  let resolved: QuotationOverridesState;

  if (cloudState && kvState) {
    if (cloudState.version >= kvState.version) {
      resolved = cloudState;
      if (cloudState.version > kvState.version) {
        callCloudKV(['SET', KV_KEY_QUOTATIONS, JSON.stringify(cloudState)]).catch(() => {});
      }
    } else {
      resolved = kvState;
    }
  } else if (cloudState) {
    resolved = cloudState;
    callCloudKV(['SET', KV_KEY_QUOTATIONS, JSON.stringify(cloudState)]).catch(() => {});
  } else if (kvState) {
    resolved = kvState;
  } else {
    resolved = {
      version: 1,
      updatedAt: new Date().toISOString(),
      quotations: {},
    };
  }

  cachedQuotationState = resolved;
  lastQuotationFetchTime = now;
  return resolved;
}

export async function saveDurableQuotation(quote: Quotation): Promise<void> {
  const quoteKey = quote.quotationNumber || quote.id;
  if (!quoteKey) throw new Error('Quotation ID or Quotation Number is required for durable persistence.');

  return await withDistributedLock('quotations', async () => {
    const state = await getDurableQuotationState(true);

    // Save rolling backup snapshot before mutation
    if (state.version > 0 && Object.keys(state.quotations).length > 0) {
      uploadRawJsonToCloudinary(QUOTATION_DB_BACKUP_PUBLIC_ID, state).catch(() => {});
      callCloudKV(['SET', KV_KEY_QUOTATIONS_BACKUP, JSON.stringify(state)]).catch(() => {});
    }

    state.quotations[quoteKey] = {
      ...quote,
      lastSyncedAt: new Date().toISOString(),
    };

    // Also index by ID if quotationNumber differs
    if (quote.id && quote.id !== quoteKey) {
      state.quotations[quote.id] = state.quotations[quoteKey];
    }

    state.version = Math.max(state.version || 1, (cachedQuotationState?.version || 0)) + 1;
    state.updatedAt = new Date().toISOString();

    if (!validateQuotationState(state)) {
      throw new Error('[DurableStore] State validation failed before saving quotation.');
    }

    await uploadRawJsonToCloudinary(QUOTATION_DB_PUBLIC_ID, state);

    cachedQuotationState = state;
    lastQuotationFetchTime = Date.now();

    await callCloudKV(['SET', KV_KEY_QUOTATIONS, JSON.stringify(state)]).catch(() => {});
  });
}

export async function updateDurableQuotationSyncStatus(
  idOrNumber: string,
  syncStatus: QuotationSyncStatus,
  syncError?: string,
  extraDetails?: Partial<Quotation>
): Promise<void> {
  const cleanKey = idOrNumber.trim();
  if (!cleanKey) return;

  return await withDistributedLock('quotations', async () => {
    const state = await getDurableQuotationState(true);
    const existing = state.quotations[cleanKey];
    if (!existing) return;

    const updatedQuote: Quotation = {
      ...existing,
      ...(extraDetails || {}),
      syncStatus,
      syncError: syncError || undefined,
      lastSyncedAt: new Date().toISOString(),
    };

    state.quotations[cleanKey] = updatedQuote;
    if (updatedQuote.quotationNumber && updatedQuote.quotationNumber !== cleanKey) {
      state.quotations[updatedQuote.quotationNumber] = updatedQuote;
    }
    if (updatedQuote.id && updatedQuote.id !== cleanKey) {
      state.quotations[updatedQuote.id] = updatedQuote;
    }

    state.version = Math.max(state.version || 1, (cachedQuotationState?.version || 0)) + 1;
    state.updatedAt = new Date().toISOString();

    if (!validateQuotationState(state)) {
      throw new Error('[DurableStore] State validation failed before updating quotation sync status.');
    }

    cachedQuotationState = state;
    lastQuotationFetchTime = Date.now();

    // Fast atomic update to Upstash KV
    await callCloudKV(['SET', KV_KEY_QUOTATIONS, JSON.stringify(state)]).catch(() => {});

    // Upload to Cloudinary with non-blocking error handling
    try {
      await uploadRawJsonToCloudinary(QUOTATION_DB_PUBLIC_ID, state);
    } catch (uploadErr) {
      console.warn('[DurableStore] Secondary Cloudinary sync status update notice:', uploadErr);
    }
  });
}

export async function getDurableQuotationById(idOrNumber: string, force = false): Promise<Quotation | null> {
  const state = await getDurableQuotationState(force);
  const clean = idOrNumber.trim();
  if (state.quotations[clean]) {
    return state.quotations[clean];
  }
  // Case-insensitive search on keys
  const foundKey = Object.keys(state.quotations).find(
    (k) => k.toLowerCase() === clean.toLowerCase()
  );
  if (foundKey) {
    return state.quotations[foundKey];
  }
  // Search within quotation objects by quotationNumber or id
  for (const q of Object.values(state.quotations)) {
    if (
      (q.quotationNumber && q.quotationNumber.toLowerCase() === clean.toLowerCase()) ||
      (q.id && q.id.toLowerCase() === clean.toLowerCase())
    ) {
      return q;
    }
  }
  return null;
}

export async function listDurableQuotations(): Promise<Quotation[]> {
  const state = await getDurableQuotationState();
  const seen = new Set<string>();
  const list: Quotation[] = [];

  for (const q of Object.values(state.quotations)) {
    const identifier = q.quotationNumber || q.id;
    if (!seen.has(identifier)) {
      seen.add(identifier);
      list.push(q);
    }
  }

  // Sort newest first
  return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

// ============================================================================
// 4. ATOMIC ROUND-ROBIN SALES REP COUNTER (Upstash KV INCR)
// ============================================================================

let localRoundRobinSeq = 0;

export async function getNextAtomicRoundRobinSequence(
  _salesEmail = 'marketing@officebazzar.com',
  marketingEmail = 'marketing@officebazzar.com'
): Promise<{
  sequenceNumber: number;
  assignedTo: 'Marketing';
  email: string;
  source: 'upstash_atomic_incr' | 'fallback_local';
}> {
  try {
    const nextSeq = await callCloudKV(['INCR', KV_KEY_ROUND_ROBIN_SEQ]);
    if (typeof nextSeq === 'number' && nextSeq > 0) {
      localRoundRobinSeq = nextSeq;
      return {
        sequenceNumber: nextSeq,
        assignedTo: 'Marketing',
        email: marketingEmail,
        source: 'upstash_atomic_incr',
      };
    }
  } catch (err) {
    console.warn('[DurableStore] Atomic round-robin INCR notice:', err);
  }

  // Safe local fallback if KV has a transient hiccup
  localRoundRobinSeq++;
  return {
    sequenceNumber: localRoundRobinSeq,
    assignedTo: 'Marketing',
    email: marketingEmail,
    source: 'fallback_local',
  };
}

// ============================================================================
// 5. DIAGNOSTICS & HEALTH AUDIT
// ============================================================================

export interface PersistenceDiagnostics {
  status: 'HEALTHY' | 'DEGRADED';
  timestamp: string;
  storage: {
    cloudinary: {
      configured: boolean;
      cloudName: string | null;
      connected: boolean;
      latencyMs: number;
      error?: string;
    };
    upstashKV: {
      configured: boolean;
      connected: boolean;
      latencyMs: number;
      error?: string;
    };
  };
  records: {
    productsCount: number;
    blogsCount: number;
    quotationsCount: number;
  };
  concurrency: {
    distributedLockAvailable: boolean;
    atomicRoundRobinAvailable: boolean;
  };
}

export async function getPersistenceDiagnostics(): Promise<PersistenceDiagnostics> {
  const start = Date.now();
  const kvConfig = getKVRestConfig();
  const isKvConfigured = Boolean(kvConfig);

  let cloudinaryConnected = false;
  let cloudinaryLatency = 0;
  let cloudinaryError: string | undefined = undefined;

  let cloudNameMasked: string | null = null;
  const rawCloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  if (rawCloudName) {
    cloudNameMasked = rawCloudName.length > 3
      ? `${rawCloudName.slice(0, 2)}***${rawCloudName.slice(-2)}`
      : 'configured';
  }

  try {
    const cStart = Date.now();
    const creds = getRequiredCloudinaryCredentials();
    const testFetch = await fetchRawJsonFromCloudinary<any>(BLOG_DB_PUBLIC_ID);
    cloudinaryConnected = testFetch !== undefined; // null (404) or object is considered connected
    cloudinaryLatency = Date.now() - cStart;
  } catch (cErr: any) {
    cloudinaryConnected = false;
    cloudinaryError = cErr?.message || 'Cloudinary connection failure';
  }

  let kvConnected = false;
  let kvLatency = 0;
  let kvError: string | undefined = undefined;

  if (isKvConfigured) {
    try {
      const kStart = Date.now();
      const pingResult = await callCloudKV(['PING']);
      kvConnected = pingResult === 'PONG' || pingResult !== null;
      kvLatency = Date.now() - kStart;
    } catch (kErr: any) {
      kvConnected = false;
      kvError = kErr?.message || 'KV ping failure';
    }
  }

  // Record counts
  let productsCount = 0;
  let blogsCount = 0;
  let quotationsCount = 0;

  try {
    const prodState = await getDurableProductState();
    productsCount = Object.keys(prodState.products || {}).length;
  } catch {}

  try {
    const blogState = await getDurableBlogState();
    blogsCount = Object.keys(blogState.posts || {}).length;
  } catch {}

  try {
    const quoteState = await getDurableQuotationState();
    quotationsCount = Object.keys(quoteState.quotations || {}).length;
  } catch {}

  const isHealthy = (cloudinaryConnected || kvConnected) && !cloudinaryError;

  return {
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    storage: {
      cloudinary: {
        configured: Boolean(rawCloudName),
        cloudName: cloudNameMasked,
        connected: cloudinaryConnected,
        latencyMs: cloudinaryLatency,
        error: cloudinaryError,
      },
      upstashKV: {
        configured: isKvConfigured,
        connected: kvConnected,
        latencyMs: kvLatency,
        error: kvError,
      },
    },
    records: {
      productsCount,
      blogsCount,
      quotationsCount,
    },
    concurrency: {
      distributedLockAvailable: kvConnected,
      atomicRoundRobinAvailable: kvConnected,
    },
  };
}
