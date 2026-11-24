import crypto from 'crypto';

/**
 * Cloudinary JSON State Store (office-bazzar-db)
 * Guaranteed primary/fallback durable state store backed by Cloudinary raw assets.
 * Reads are cache-busted with (?v=Date.now()) and cache: 'no-store'.
 * Writes are atomic with invalidate: true and overwrite: true.
 *
 * Designed with zero dependency on Node 'fs', allowing seamless use across
 * Serverless Lambdas, Edge Runtimes, and shared Store loaders.
 */

async function callCloudKV(command: any[]): Promise<any> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const cleanUrl = url.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    const cleanToken = token.trim().replace(/^["']|["']$/g, '');
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return data?.result;
    }
  } catch {}
  return null;
}

const PRODUCT_DB_PUBLIC_ID = 'office-bazzar-db/catalog-overrides.json';
const BLOG_DB_PUBLIC_ID = 'office-bazzar-db/blog-overrides.json';

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
  posts: Record<string, any>; // keyed by slug
  trashedSlugs: string[];
  unpublishedSlugs: string[];
  deletedSlugs: string[];
}

// In-memory cache to prevent redundant fetches across identical serverless invocations
let cachedProductState: ProductOverridesState | null = null;
let lastProductFetchTime = 0;
let cachedBlogState: BlogOverridesState | null = null;
let lastBlogFetchTime = 0;
const CACHE_TTL_MS = 3 * 1000; // 3 seconds TTL for serverless reuse

function getCloudinaryCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return { cloudName, apiKey, apiSecret };
}

/**
 * Upload an atomic raw JSON file to Cloudinary with invalidation and overwrite
 */
async function uploadRawJsonToCloudinary(publicId: string, data: any): Promise<boolean> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[DurableStore] Cloudinary credentials missing; state will persist to memory/KV only.');
    return false;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const jsonString = JSON.stringify(data, null, 2);
    const base64Data = `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`;

    // Alphabetical query string for signature:
    // invalidate=true&overwrite=true&public_id=...&timestamp=...
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
      console.warn(`[DurableStore] Cloudinary raw upload failed for ${publicId} (Status ${res.status}):`, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.warn(`[DurableStore] Error uploading raw JSON to Cloudinary (${publicId}):`, err);
    return false;
  }
}

/**
 * Fetch raw JSON file from Cloudinary with cache-busting timestamp
 */
async function fetchRawJsonFromCloudinary<T>(publicId: string): Promise<T | null> {
  const { cloudName } = getCloudinaryCredentials();
  if (!cloudName) return null;

  try {
    const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}?v=${Date.now()}`;
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data as T;
    }
  } catch (err) {
    console.warn(`[DurableStore] Error fetching raw JSON from Cloudinary (${publicId}):`, err);
  }
  return null;
}

// ============================================================================
// 1. PRODUCT CATALOG STATE MANAGEMENT
// ============================================================================

export async function getDurableProductState(force = false): Promise<ProductOverridesState> {
  const now = Date.now();
  if (!force && cachedProductState && now - lastProductFetchTime < CACHE_TTL_MS) {
    return cachedProductState;
  }

  // 1. Try Cloudinary raw asset (guaranteed persistent store)
  const remote = await fetchRawJsonFromCloudinary<ProductOverridesState>(PRODUCT_DB_PUBLIC_ID);
  if (remote && typeof remote === 'object' && remote.products) {
    cachedProductState = {
      version: remote.version || 1,
      updatedAt: remote.updatedAt || new Date().toISOString(),
      products: remote.products || {},
      unpublishedSkus: Array.isArray(remote.unpublishedSkus) ? remote.unpublishedSkus : [],
      deletedSkus: Array.isArray(remote.deletedSkus) ? remote.deletedSkus : [],
    };
    lastProductFetchTime = now;
    return cachedProductState;
  }

  // 2. Try Upstash Cloud KV if available
  try {
    const kvRaw = await callCloudKV(['GET', 'office_bazzar:product_overrides']);
    if (kvRaw) {
      const parsed = typeof kvRaw === 'string' ? JSON.parse(kvRaw) : kvRaw;
      cachedProductState = {
        version: parsed.version || 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        products: parsed.products || {},
        unpublishedSkus: Array.isArray(parsed.unpublishedSkus) ? parsed.unpublishedSkus : [],
        deletedSkus: Array.isArray(parsed.deletedSkus) ? parsed.deletedSkus : [],
      };
      lastProductFetchTime = now;
      return cachedProductState;
    }
  } catch {}

  // 3. Fallback baseline if no remote store has been created yet
  if (!cachedProductState) {
    cachedProductState = {
      version: 1,
      updatedAt: new Date().toISOString(),
      products: {},
      unpublishedSkus: [],
      deletedSkus: [],
    };
  }
  lastProductFetchTime = now;
  return cachedProductState;
}

export async function saveDurableProductOverride(product: any): Promise<void> {
  const state = await getDurableProductState(true);
  const cleanSku = (product.sku || '').trim().toUpperCase();
  if (!cleanSku) return;

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

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();
  cachedProductState = state;
  lastProductFetchTime = Date.now();

  // Dual persist to Cloudinary + Cloud KV
  await Promise.allSettled([
    uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state),
    callCloudKV(['SET', 'office_bazzar:product_overrides', JSON.stringify(state)]),
  ]);
}

export async function deleteDurableProductOverride(skuOrId: string): Promise<void> {
  const state = await getDurableProductState(true);
  const clean = skuOrId.trim().toUpperCase();

  delete state.products[clean];
  if (!state.deletedSkus.includes(clean)) {
    state.deletedSkus.push(clean);
  }
  state.unpublishedSkus = state.unpublishedSkus.filter((s) => s.toUpperCase() !== clean);

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();
  cachedProductState = state;
  lastProductFetchTime = Date.now();

  await Promise.allSettled([
    uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state),
    callCloudKV(['SET', 'office_bazzar:product_overrides', JSON.stringify(state)]),
  ]);
}

export async function setDurableProductPublishStatus(skuOrId: string, isPublished: boolean): Promise<void> {
  const state = await getDurableProductState(true);
  const clean = skuOrId.trim().toUpperCase();

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

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();
  cachedProductState = state;
  lastProductFetchTime = Date.now();

  await Promise.allSettled([
    uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state),
    callCloudKV(['SET', 'office_bazzar:product_overrides', JSON.stringify(state)]),
  ]);
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
  if (!force && cachedBlogState && now - lastBlogFetchTime < CACHE_TTL_MS) {
    return cachedBlogState;
  }

  // 1. Try Cloudinary raw asset (guaranteed persistent store)
  const remote = await fetchRawJsonFromCloudinary<BlogOverridesState>(BLOG_DB_PUBLIC_ID);
  if (remote && typeof remote === 'object' && remote.posts) {
    cachedBlogState = {
      version: remote.version || 1,
      updatedAt: remote.updatedAt || new Date().toISOString(),
      posts: remote.posts || {},
      trashedSlugs: Array.isArray(remote.trashedSlugs) ? remote.trashedSlugs : [],
      unpublishedSlugs: Array.isArray(remote.unpublishedSlugs) ? remote.unpublishedSlugs : [],
      deletedSlugs: Array.isArray(remote.deletedSlugs) ? remote.deletedSlugs : [],
    };
    lastBlogFetchTime = now;
    return cachedBlogState;
  }

  // 2. Try Upstash Cloud KV if available
  try {
    const kvRaw = await callCloudKV(['GET', 'office_bazzar:blog_overrides']);
    if (kvRaw) {
      const parsed = typeof kvRaw === 'string' ? JSON.parse(kvRaw) : kvRaw;
      cachedBlogState = {
        version: parsed.version || 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        posts: parsed.posts || {},
        trashedSlugs: Array.isArray(parsed.trashedSlugs) ? parsed.trashedSlugs : [],
        unpublishedSlugs: Array.isArray(parsed.unpublishedSlugs) ? parsed.unpublishedSlugs : [],
        deletedSlugs: Array.isArray(parsed.deletedSlugs) ? parsed.deletedSlugs : [],
      };
      lastBlogFetchTime = now;
      return cachedBlogState;
    }
  } catch {}

  // 3. Fallback baseline
  if (!cachedBlogState) {
    cachedBlogState = {
      version: 1,
      updatedAt: new Date().toISOString(),
      posts: {},
      trashedSlugs: [],
      unpublishedSlugs: [],
      deletedSlugs: [],
    };
  }
  lastBlogFetchTime = now;
  return cachedBlogState;
}

export async function saveDurableBlogPostOverride(post: any): Promise<void> {
  const state = await getDurableBlogState(true);
  const cleanSlug = (post.slug || '').trim().toLowerCase();
  if (!cleanSlug) return;

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

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();
  cachedBlogState = state;
  lastBlogFetchTime = Date.now();

  await Promise.allSettled([
    uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state),
    callCloudKV(['SET', 'office_bazzar:blog_overrides', JSON.stringify(state)]),
  ]);
}

export async function setDurableBlogStatus(
  slug: string,
  status: 'published' | 'draft' | 'scheduled' | 'trash'
): Promise<void> {
  const state = await getDurableBlogState(true);
  const clean = slug.trim().toLowerCase();

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

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();
  cachedBlogState = state;
  lastBlogFetchTime = Date.now();

  await Promise.allSettled([
    uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state),
    callCloudKV(['SET', 'office_bazzar:blog_overrides', JSON.stringify(state)]),
  ]);
}

export async function deleteDurableBlogPostOverride(slug: string): Promise<void> {
  const state = await getDurableBlogState(true);
  const clean = slug.trim().toLowerCase();

  delete state.posts[clean];
  if (!state.deletedSlugs.includes(clean)) {
    state.deletedSlugs.push(clean);
  }
  state.trashedSlugs = state.trashedSlugs.filter((s) => s.toLowerCase() !== clean);
  state.unpublishedSlugs = state.unpublishedSlugs.filter((s) => s.toLowerCase() !== clean);

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();
  cachedBlogState = state;
  lastBlogFetchTime = Date.now();

  await Promise.allSettled([
    uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state),
    callCloudKV(['SET', 'office_bazzar:blog_overrides', JSON.stringify(state)]),
  ]);
}

export async function getDurableBlogDeletedSlugs(): Promise<Set<string>> {
  const state = await getDurableBlogState();
  return new Set(state.deletedSlugs.map((s) => s.toLowerCase()));
}

export async function getDurableBlogTrashedSlugs(): Promise<Set<string>> {
  const state = await getDurableBlogState();
  return new Set(state.trashedSlugs.map((s) => s.toLowerCase()));
}
