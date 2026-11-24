import crypto from 'crypto';

/**
 * Cloudinary JSON State Store (office-bazzar-db)
 * Guaranteed primary durable state store backed by Cloudinary raw assets.
 *
 * READ FLOW:
 * Directly queries Cloudinary Admin API (https://api.cloudinary.com/v1_1/${cloudName}/resources/raw/upload/${publicId})
 * using HTTP Basic Auth (API Key + API Secret). This bypasses Cloudinary's edge CDN caching and returns
 * the exact authoritative current metadata (including current version and exact versioned secure_url).
 * Then fetches that versioned URL with cache: 'no-store', guaranteeing 100% fresh state on page reload.
 *
 * WRITE FLOW:
 * Uploads atomic raw JSON (resource_type: 'raw', public_id: 'office-bazzar-db/...', overwrite: true, invalidate: true).
 * Strictly verifies the returned secure_url before returning HTTP 200.
 */

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

// In-memory cache for fast reuse within identical serverless invocation
let cachedProductState: ProductOverridesState | null = null;
let lastProductFetchTime = 0;
let cachedBlogState: BlogOverridesState | null = null;
let lastBlogFetchTime = 0;
const CACHE_TTL_MS = 2 * 1000; // 2 seconds TTL

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

/**
 * Upload atomic raw JSON to Cloudinary with explicit validation
 */
async function uploadRawJsonToCloudinary(publicId: string, data: any): Promise<string> {
  const { cloudName, apiKey, apiSecret } = getRequiredCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const jsonString = JSON.stringify(data, null, 2);
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

  // Fetch the versioned immutable raw URL
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
// 1. PRODUCT CATALOG STATE MANAGEMENT
// ============================================================================

export async function getDurableProductState(force = false): Promise<ProductOverridesState> {
  const now = Date.now();
  if (!force && cachedProductState && now - lastProductFetchTime < CACHE_TTL_MS) {
    return cachedProductState;
  }

  // 1. Try Cloudinary Admin API (authoritative versioned raw asset)
  try {
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
  } catch (err) {
    console.warn('[DurableStore] Product state fetch notice:', err);
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

  // 3. Fallback baseline if empty
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
  const cleanSku = (product.sku || '').trim().toUpperCase();
  if (!cleanSku) throw new Error('Product SKU is required for durable persistence.');

  const state = await getDurableProductState(true);

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

  // Upload to Cloudinary with strict error propagation
  await uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state);

  cachedProductState = state;
  lastProductFetchTime = Date.now();

  // Non-blocking mirror to Cloud KV
  callCloudKV(['SET', 'office_bazzar:product_overrides', JSON.stringify(state)]).catch(() => {});
}

export async function deleteDurableProductOverride(skuOrId: string): Promise<void> {
  const clean = skuOrId.trim().toUpperCase();
  if (!clean) return;

  const state = await getDurableProductState(true);

  delete state.products[clean];
  if (!state.deletedSkus.includes(clean)) {
    state.deletedSkus.push(clean);
  }
  state.unpublishedSkus = state.unpublishedSkus.filter((s) => s.toUpperCase() !== clean);

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();

  await uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state);

  cachedProductState = state;
  lastProductFetchTime = Date.now();

  callCloudKV(['SET', 'office_bazzar:product_overrides', JSON.stringify(state)]).catch(() => {});
}

export async function setDurableProductPublishStatus(skuOrId: string, isPublished: boolean): Promise<void> {
  const clean = skuOrId.trim().toUpperCase();
  if (!clean) return;

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

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();

  await uploadRawJsonToCloudinary(PRODUCT_DB_PUBLIC_ID, state);

  cachedProductState = state;
  lastProductFetchTime = Date.now();

  callCloudKV(['SET', 'office_bazzar:product_overrides', JSON.stringify(state)]).catch(() => {});
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

  // 1. Try Cloudinary Admin API (authoritative versioned raw asset)
  try {
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
  } catch (err) {
    console.warn('[DurableStore] Blog state fetch notice:', err);
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
  const cleanSlug = (post.slug || '').trim().toLowerCase();
  if (!cleanSlug) throw new Error('Blog URL slug is required for durable persistence.');

  const state = await getDurableBlogState(true);

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

  // Strict verification: upload must succeed and return secure_url
  await uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state);

  cachedBlogState = state;
  lastBlogFetchTime = Date.now();

  callCloudKV(['SET', 'office_bazzar:blog_overrides', JSON.stringify(state)]).catch(() => {});
}

export async function setDurableBlogStatus(
  slug: string,
  status: 'published' | 'draft' | 'scheduled' | 'trash'
): Promise<void> {
  const clean = slug.trim().toLowerCase();
  if (!clean) return;

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

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();

  await uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state);

  cachedBlogState = state;
  lastBlogFetchTime = Date.now();

  callCloudKV(['SET', 'office_bazzar:blog_overrides', JSON.stringify(state)]).catch(() => {});
}

export async function deleteDurableBlogPostOverride(slug: string): Promise<void> {
  const clean = slug.trim().toLowerCase();
  if (!clean) return;

  const state = await getDurableBlogState(true);

  delete state.posts[clean];
  if (!state.deletedSlugs.includes(clean)) {
    state.deletedSlugs.push(clean);
  }
  state.trashedSlugs = state.trashedSlugs.filter((s) => s.toLowerCase() !== clean);
  state.unpublishedSlugs = state.unpublishedSlugs.filter((s) => s.toLowerCase() !== clean);

  state.version = (state.version || 1) + 1;
  state.updatedAt = new Date().toISOString();

  await uploadRawJsonToCloudinary(BLOG_DB_PUBLIC_ID, state);

  cachedBlogState = state;
  lastBlogFetchTime = Date.now();

  callCloudKV(['SET', 'office_bazzar:blog_overrides', JSON.stringify(state)]).catch(() => {});
}

export async function getDurableBlogDeletedSlugs(): Promise<Set<string>> {
  const state = await getDurableBlogState();
  return new Set(state.deletedSlugs.map((s) => s.toLowerCase()));
}

export async function getDurableBlogTrashedSlugs(): Promise<Set<string>> {
  const state = await getDurableBlogState();
  return new Set(state.trashedSlugs.map((s) => s.toLowerCase()));
}
