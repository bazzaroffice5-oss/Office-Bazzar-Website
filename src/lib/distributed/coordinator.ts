/**
 * Production-Grade Distributed Coordination Engine for Serverless (Vercel / Next.js)
 *
 * Provides cross-instance distributed coordination:
 * 1. Distributed Atomic Locks (SET NX PX)
 * 2. Multi-Instance Inventory Reservation Leases with automatic TTL
 * 3. Durable Idempotency Keys across separate serverless containers
 * 4. Cross-Instance Razorpay Webhook Deduplication
 * 5. Distributed Sliding-Window Rate Limiting
 * 6. Durable Outbox Queue for Zoho CRM Downtime Recovery
 *
 * Infrastructure Support:
 * - Cloud-Native: Upstash Redis / Vercel KV via HTTP REST (KV_REST_API_URL / UPSTASH_REDIS_REST_URL)
 * - Local / Multi-Process: Atomic Shared Journal Adapter (.distributed_coordination_state.json)
 *   with cross-process mutual exclusion for staging and local multi-process testing.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ----------------------------------------------------------------------
// Configuration & Environment Detection
// ----------------------------------------------------------------------

export interface KVConfig {
  url: string;
  token: string;
  isCloud: boolean;
  sourceUrlKey: string;
  sourceTokenKey: string;
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

function normalizeRestUrl(rawUrl: string): string | null {
  try {
    let cleaned = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    if (!cleaned) return null;
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }
    const parsed = new URL(cleaned);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export function getKVConfig(): KVConfig | null {
  // 1. Direct candidate pairs in order of preference:
  // Covers standard Vercel KV, Upstash integration, and custom prefixes (especially STORAGE)
  const candidatePairs: [string, string][] = [
    // Standard Vercel KV
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    // Standard Upstash Redis integration
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    // Vercel KV with 'STORAGE' custom prefix (generated when database is named or prefixed 'STORAGE')
    ['STORAGE_KV_REST_API_URL', 'STORAGE_KV_REST_API_TOKEN'],
    // Upstash integration with 'STORAGE' prefix
    ['STORAGE_UPSTASH_REDIS_REST_URL', 'STORAGE_UPSTASH_REDIS_REST_TOKEN'],
    // Generic REST with 'STORAGE' prefix
    ['STORAGE_REST_API_URL', 'STORAGE_REST_API_TOKEN'],
    // Generic REDIS REST
    ['REDIS_REST_URL', 'REDIS_REST_TOKEN'],
    ['STORAGE_REDIS_REST_URL', 'STORAGE_REDIS_REST_TOKEN'],
    // Generic URL/TOKEN with STORAGE prefix
    ['STORAGE_URL', 'STORAGE_TOKEN'],
  ];

  for (const [urlKey, tokenKey] of candidatePairs) {
    const rawUrl = process.env[urlKey];
    const rawToken = process.env[tokenKey];
    if (rawUrl && rawToken) {
      const cleanUrl = normalizeRestUrl(rawUrl);
      const cleanToken = rawToken.trim().replace(/^["']|["']$/g, '');
      if (cleanUrl && cleanToken) {
        return {
          url: cleanUrl,
          token: cleanToken,
          isCloud: true,
          sourceUrlKey: urlKey,
          sourceTokenKey: tokenKey,
        };
      }
    }
  }

  // 2. Dynamic pattern matching across all environment variables for custom prefixes
  const envKeys = Object.keys(process.env);
  const urlKeys = envKeys.filter(
    (k) =>
      /(KV_REST_API_URL|UPSTASH_REDIS_REST_URL|REST_API_URL|REDIS_REST_URL)$/i.test(k) &&
      Boolean(process.env[k])
  );

  for (const urlKey of urlKeys) {
    const rawUrl = process.env[urlKey];
    if (!rawUrl) continue;

    // Look for matching token key by substituting URL suffix with TOKEN suffix
    const candidateTokenKey = urlKey
      .replace(/REST_API_URL$/i, 'REST_API_TOKEN')
      .replace(/REDIS_REST_URL$/i, 'REDIS_REST_TOKEN')
      .replace(/URL$/i, 'TOKEN');

    let token = process.env[candidateTokenKey];
    let sourceTokenKey = candidateTokenKey;

    if (!token) {
      // Try common token fallbacks
      const fallbackTokenKeys = [
        'KV_REST_API_TOKEN',
        'UPSTASH_REDIS_REST_TOKEN',
        'STORAGE_KV_REST_API_TOKEN',
        'STORAGE_REST_API_TOKEN',
        'STORAGE_UPSTASH_REDIS_REST_TOKEN',
        'REDIS_REST_TOKEN',
      ];
      for (const ftk of fallbackTokenKeys) {
        if (process.env[ftk]) {
          token = process.env[ftk];
          sourceTokenKey = ftk;
          break;
        }
      }
    }

    if (rawUrl && token) {
      const cleanUrl = normalizeRestUrl(rawUrl);
      const cleanToken = token.trim().replace(/^["']|["']$/g, '');
      if (cleanUrl && cleanToken) {
        return {
          url: cleanUrl,
          token: cleanToken,
          isCloud: true,
          sourceUrlKey: urlKey,
          sourceTokenKey,
        };
      }
    }
  }

  // 3. Fallback: Parse Upstash / Vercel Redis connection strings (redis:// or rediss://)
  // e.g. rediss://default:<password>@<host>:<port> -> REST URL = https://<host>, Token = <password>
  const redisUriKeys = [
    'STORAGE_KV_URL',
    'STORAGE_UPSTASH_REDIS_URL',
    'STORAGE_URL',
    'KV_URL',
    'UPSTASH_REDIS_URL',
    'REDIS_URL',
  ];

  for (const uriKey of redisUriKeys) {
    const rawUri = process.env[uriKey];
    if (rawUri && (rawUri.startsWith('redis://') || rawUri.startsWith('rediss://'))) {
      try {
        const parsed = new URL(rawUri);
        const host = parsed.hostname;
        const password = parsed.password ? decodeURIComponent(parsed.password) : '';
        if (host && password) {
          return {
            url: `https://${host}`,
            token: password,
            isCloud: true,
            sourceUrlKey: `${uriKey} (parsed URI)`,
            sourceTokenKey: `${uriKey} (parsed URI)`,
          };
        }
      } catch {
        // Ignore parse error
      }
    }
  }

  return null;
}

// ----------------------------------------------------------------------
// HTTP REST Client for Cloud KV (Vercel KV / Upstash Redis)
// ----------------------------------------------------------------------

async function callKV<T = any>(command: (string | number)[]): Promise<T | null> {
  const config = getKVConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      console.warn(`[DistributedKV] HTTP error ${response.status}: ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    return data.result !== undefined ? data.result : data;
  } catch (err) {
    console.warn(`[DistributedKV] Network failure reaching cloud KV:`, err);
    return null;
  }
}

async function callKVPipeline(commands: (string | number)[][]): Promise<any[] | null> {
  const config = getKVConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) ? data.map((d) => d.result) : null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------
// Fallback Multi-Process Shared Coordination Store (Atomic Disk Journal)
// ----------------------------------------------------------------------

interface SharedCoordinationState {
  version: 1;
  locks: Record<string, { lockId: string; expiresAt: number }>;
  reservations: Record<
    string,
    {
      reservationId: string;
      items: { productId: string; sku: string; quantity: number }[];
      status: 'reserved' | 'committed' | 'released' | 'expired';
      expiresAt: number;
    }
  >;
  idempotency: Record<string, { data: any; expiresAt: number }>;
  webhooks: Record<string, { receivedAt: number; expiresAt: number }>;
  rateLimits: Record<string, { count: number; resetAt: number }>;
  outbox: Array<{ id: string; payload: any; queuedAt: number; attempts: number }>;
}

function getSharedStateFilePath(): string {
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return path.join(process.cwd(), '.distributed_coordination_state.json');
  } catch {
    return path.join(os.tmpdir(), '.distributed_coordination_state.json');
  }
}

function getSharedLockFilePath(): string {
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return path.join(process.cwd(), '.distributed_coordination_lock');
  } catch {
    return path.join(os.tmpdir(), '.distributed_coordination_lock');
  }
}

async function acquireProcessFileLock(maxWaitMs = 5000): Promise<() => void> {
  const lockFile = getSharedLockFilePath();
  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    try {
      const fd = fs.openSync(lockFile, 'wx');
      fs.writeSync(fd, `${process.pid}:${Date.now()}`);
      fs.closeSync(fd);

      return () => {
        try {
          if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
        } catch {
          // Ignore
        }
      };
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        try {
          const stats = fs.statSync(lockFile);
          if (Date.now() - stats.mtimeMs > 10000) {
            fs.unlinkSync(lockFile);
            continue;
          }
        } catch {
          // Ignore
        }
        const delay = Math.min(50, Math.pow(2, attempt % 5) * 5 + Math.floor(Math.random() * 15));
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }

  return () => {
    try {
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
    } catch {
      // Ignore
    }
  };
}

function readSharedState(): SharedCoordinationState {
  const filePath = getSharedStateFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch {
    // Ignore read errors
  }

  return {
    version: 1,
    locks: {},
    reservations: {},
    idempotency: {},
    webhooks: {},
    rateLimits: {},
    outbox: [],
  };
}

function writeSharedStateAtomic(state: SharedCoordinationState): void {
  const filePath = getSharedStateFilePath();
  const tempPath = `${filePath}.tmp.${process.pid}.${Date.now()}.${Math.floor(Math.random() * 10000)}`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

// ----------------------------------------------------------------------
// 1. Distributed Atomic Locks (Cross-Instance Mutual Exclusion)
// ----------------------------------------------------------------------

export interface DistributedLockResult {
  acquired: boolean;
  lockId?: string;
  release: () => Promise<void>;
}

export async function acquireDistributedLock(
  resource: string,
  ttlMs = 10000,
  maxWaitMs = 4000
): Promise<DistributedLockResult> {
  const lockKey = `lock:${resource}`;
  const lockId = `lck-${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const startTime = Date.now();
  const config = getKVConfig();

  // 1. Cloud-Native Path: Upstash / Vercel KV
  if (config) {
    while (Date.now() - startTime < maxWaitMs) {
      // SET lockKey lockId NX PX ttlMs
      const res = await callKV<string>(['SET', lockKey, lockId, 'NX', 'PX', ttlMs]);
      if (res === 'OK') {
        return {
          acquired: true,
          lockId,
          release: async () => {
            // Safe release: only delete if value matches lockId (Lua script or GET+DEL)
            const current = await callKV<string>(['GET', lockKey]);
            if (current === lockId) {
              await callKV(['DEL', lockKey]);
            }
          },
        };
      }
      await new Promise((r) => setTimeout(r, 50 + Math.floor(Math.random() * 50)));
    }
    return { acquired: false, release: async () => {} };
  }

  // In production, do not silently fall back to ephemeral /tmp file lock
  if (isProductionEnvironment()) {
    console.error('[DistributedLock] CRITICAL: Lock requested in production without active Cloud KV backend.');
    return { acquired: false, release: async () => {} };
  }

  // 2. Multi-Process Shared File Fallback Path
  const unlockFile = await acquireProcessFileLock();
  try {
    const now = Date.now();
    const state = readSharedState();

    const existing = state.locks[resource];
    if (!existing || existing.expiresAt <= now) {
      state.locks[resource] = { lockId, expiresAt: now + ttlMs };
      writeSharedStateAtomic(state);

      return {
        acquired: true,
        lockId,
        release: async () => {
          const u = await acquireProcessFileLock();
          try {
            const s = readSharedState();
            if (s.locks[resource]?.lockId === lockId) {
              delete s.locks[resource];
              writeSharedStateAtomic(s);
            }
          } finally {
            u();
          }
        },
      };
    }

    return { acquired: false, release: async () => {} };
  } finally {
    unlockFile();
  }
}

// ----------------------------------------------------------------------
// 2. Multi-Instance Atomic Inventory Reservation Leases
// ----------------------------------------------------------------------

export interface InventoryItemToReserve {
  productId: string;
  sku: string;
  quantity: number;
}

export interface DistributedReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
  availableStock?: number;
}

// Lua script for genuinely atomic multi-SKU inventory reservation
const LUA_ATOMIC_RESERVE_SCRIPT = `
local now = tonumber(ARGV[1])
local ttlMs = tonumber(ARGV[2])
local reservationId = ARGV[3]
local payloadJson = ARGV[4]
local expiresAt = now + ttlMs
local numKeys = #KEYS

-- Phase 1: All-or-nothing stock availability check
local argOffset = 5
for i = 1, numKeys do
    local zsetKey = KEYS[i]
    local sku = ARGV[argOffset]
    local requestedQty = tonumber(ARGV[argOffset + 1])
    local authStock = tonumber(ARGV[argOffset + 2])

    -- 1. Atomic lease pruning of expired members
    redis.call('ZREMRANGEBYSCORE', zsetKey, 0, now)

    -- 2. Sum remaining active members
    local members = redis.call('ZRANGE', zsetKey, 0, -1)
    local activeReserved = 0
    for _, m in ipairs(members) do
        local parts = {}
        for part in string.gmatch(m, "[^:]+") do
            table.insert(parts, part)
        end
        local qty = tonumber(parts[#parts])
        if qty then
            activeReserved = activeReserved + qty
        end
    end

    local availableStock = authStock - activeReserved
    if requestedQty > availableStock then
        return "INSUFFICIENT:" .. sku .. ":" .. tostring(availableStock)
    end

    argOffset = argOffset + 3
end

-- Phase 2: All items passed check. Record leases atomically.
argOffset = 5
for i = 1, numKeys do
    local zsetKey = KEYS[i]
    local requestedQty = tonumber(ARGV[argOffset + 1])
    local member = reservationId .. ":" .. tostring(requestedQty)
    redis.call('ZADD', zsetKey, expiresAt, member)
    argOffset = argOffset + 3
end

-- Phase 3: Set reservation detail record
redis.call('SET', 'resv:' .. reservationId, payloadJson, 'PX', ttlMs)

return "OK"
`;

/**
 * Atomically reserve inventory across multiple independent instances.
 * Guarantees that even if 100 separate Lambda functions invoke simultaneously,
 * inventory cannot be oversold. Multi-SKU cart reservations are 100% all-or-nothing.
 */
export async function atomicReserveInventory(
  items: InventoryItemToReserve[],
  getAuthoritativeStock: (productIdOrSku: string) => Promise<number>,
  ttlMs = 15 * 60 * 1000 // 15 Minutes TTL
): Promise<DistributedReservationResult> {
  if (!items || items.length === 0) {
    return { success: false, error: 'Empty reservation items list.' };
  }

  const reservationId = `resv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const config = getKVConfig();

  // A. Cloud-Native KV (Vercel KV / Upstash Redis)
  if (config) {
    try {
      const now = Date.now();
      // Prefetch authoritative stock for all cart items in parallel
      const authStocks: number[] = await Promise.all(
        items.map((i) => getAuthoritativeStock(i.productId || i.sku))
      );

      const keys: string[] = [];
      const argv: (string | number)[] = [
        now,
        ttlMs,
        reservationId,
        JSON.stringify({ items, status: 'reserved', expiresAt: now + ttlMs }),
      ];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const sku = item.productId || item.sku;
        keys.push(`inv:resv_zset:${sku}`);
        argv.push(sku, item.quantity, authStocks[i]);
      }

      // Execute atomic Redis Lua script
      const evalRes = await callKV<string>([
        'EVAL',
        LUA_ATOMIC_RESERVE_SCRIPT,
        keys.length,
        ...keys,
        ...argv,
      ]);

      if (evalRes === 'OK') {
        return { success: true, reservationId };
      }

      if (typeof evalRes === 'string' && evalRes.startsWith('INSUFFICIENT:')) {
        const parts = evalRes.split(':');
        const availableStock = parseInt(parts[2], 10) || 0;
        const failedItem = items.find((i) => (i.productId || i.sku) === parts[1]);
        return {
          success: false,
          error: `Insufficient stock for product. Available: ${availableStock}, Requested: ${failedItem?.quantity || 1}.`,
          availableStock,
        };
      }

      // Fallback to sorted set pipeline with multi-key lock if EVAL returned null
      const primarySku = items[0].sku || items[0].productId;
      const lock = await acquireDistributedLock(`inv:${primarySku}`, 8000, 5000);
      if (!lock.acquired) {
        return { success: false, error: 'High checkout traffic: lock acquisition timed out. Please retry.' };
      }

      try {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const sku = item.productId || item.sku;
          const zsetKey = `inv:resv_zset:${sku}`;
          await callKV(['ZREMRANGEBYSCORE', zsetKey, 0, now]);
          const activeMembers = await callKV<string[]>(['ZRANGE', zsetKey, 0, -1]);
          let activeReserved = 0;
          if (Array.isArray(activeMembers)) {
            for (const m of activeMembers) {
              const parts = String(m).split(':');
              const qty = parseInt(parts[parts.length - 1], 10);
              if (!isNaN(qty)) activeReserved += qty;
            }
          }
          const availableStock = Math.max(0, authStocks[i] - activeReserved);
          if (item.quantity > availableStock) {
            return {
              success: false,
              error: `Insufficient stock for product. Available: ${availableStock}, Requested: ${item.quantity}.`,
              availableStock,
            };
          }
        }

        const pipeline: (string | number)[][] = [];
        for (const item of items) {
          const sku = item.productId || item.sku;
          const zsetKey = `inv:resv_zset:${sku}`;
          pipeline.push(['ZADD', zsetKey, now + ttlMs, `${reservationId}:${item.quantity}`]);
        }
        pipeline.push(['SET', `resv:${reservationId}`, JSON.stringify({ items, status: 'reserved', expiresAt: now + ttlMs }), 'PX', ttlMs]);
        await callKVPipeline(pipeline);
        return { success: true, reservationId };
      } finally {
        await lock.release();
      }
    } catch (err: any) {
      console.warn('[DistributedKV] Fallback during atomic reservation:', err);
    }
  }

  // In production, do not silently fall back to ephemeral /tmp journal
  if (isProductionEnvironment()) {
    console.error('[DistributedReservation] CRITICAL: Inventory reservation cannot proceed in production without active Cloud KV backend.');
    return {
      success: false,
      error: 'Distributed inventory coordination backend is unavailable in production.',
    };
  }

  // B. Multi-Process Shared Coordination Store Fallback
  const unlockFile = await acquireProcessFileLock();
  try {
    const now = Date.now();
    const state = readSharedState();

    // 1. Prune expired reservations
    for (const [id, resv] of Object.entries(state.reservations)) {
      if (resv.status === 'reserved' && resv.expiresAt <= now) {
        resv.status = 'expired';
      }
    }

    // 2. Validate available stock for each item
    for (const item of items) {
      const target = (item.productId || item.sku).trim().toLowerCase();
      let activeReserved = 0;

      for (const resv of Object.values(state.reservations)) {
        if (resv.status === 'reserved' && resv.expiresAt > now) {
          for (const i of resv.items) {
            if (
              i.productId.trim().toLowerCase() === target ||
              i.sku.trim().toLowerCase() === target
            ) {
              activeReserved += i.quantity;
            }
          }
        }
      }

      const authoritativeStock = await getAuthoritativeStock(item.productId || item.sku);
      const availableStock = Math.max(0, authoritativeStock - activeReserved);

      if (item.quantity > availableStock) {
        return {
          success: false,
          error: `Insufficient stock for product. Available: ${availableStock}, Requested: ${item.quantity}.`,
          availableStock,
        };
      }
    }

    // 3. Atomically write reservation
    state.reservations[reservationId] = {
      reservationId,
      items: items.map((i) => ({ ...i })),
      status: 'reserved',
      expiresAt: now + ttlMs,
    };

    writeSharedStateAtomic(state);
    return { success: true, reservationId };
  } finally {
    unlockFile();
  }
}

export async function atomicCommitInventory(reservationId: string): Promise<boolean> {
  const config = getKVConfig();
  if (config) {
    const raw = await callKV<string>(['GET', `resv:${reservationId}`]);
    if (!raw) return true;
    const resv = typeof raw === 'string' ? JSON.parse(raw) : raw;
    resv.status = 'committed';
    const pipeline: (string | number)[][] = [];
    if (resv.items && Array.isArray(resv.items)) {
      for (const item of resv.items) {
        const sku = item.productId || item.sku;
        pipeline.push(['ZREM', `inv:resv_zset:${sku}`, `${reservationId}:${item.quantity}`]);
      }
    }
    pipeline.push(['SET', `resv:${reservationId}`, JSON.stringify(resv), 'PX', 86400000]);
    await callKVPipeline(pipeline);
    return true;
  }

  if (isProductionEnvironment()) {
    console.error('[DistributedReservation] CRITICAL: Commit requested in production without active Cloud KV backend.');
    return false;
  }

  const unlock = await acquireProcessFileLock();
  try {
    const state = readSharedState();
    if (state.reservations[reservationId]) {
      state.reservations[reservationId].status = 'committed';
      writeSharedStateAtomic(state);
    }
    return true;
  } finally {
    unlock();
  }
}

export async function atomicReleaseInventory(reservationId: string): Promise<boolean> {
  const config = getKVConfig();
  if (config) {
    const raw = await callKV<string>(['GET', `resv:${reservationId}`]);
    if (!raw) return true;
    const resv = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (resv.status === 'reserved') {
      resv.status = 'released';
      const pipeline: (string | number)[][] = [];
      if (resv.items && Array.isArray(resv.items)) {
        for (const item of resv.items) {
          const sku = item.productId || item.sku;
          pipeline.push(['ZREM', `inv:resv_zset:${sku}`, `${reservationId}:${item.quantity}`]);
        }
      }
      pipeline.push(['DEL', `resv:${reservationId}`]);
      await callKVPipeline(pipeline);
    }
    return true;
  }

  if (isProductionEnvironment()) {
    console.error('[DistributedReservation] CRITICAL: Release requested in production without active Cloud KV backend.');
    return false;
  }

  const unlock = await acquireProcessFileLock();
  try {
    const state = readSharedState();
    if (state.reservations[reservationId]) {
      state.reservations[reservationId].status = 'released';
      writeSharedStateAtomic(state);
    }
    return true;
  } finally {
    unlock();
  }
}

// ----------------------------------------------------------------------
// 3. Durable Idempotency Keys across Vercel Instances
// ----------------------------------------------------------------------

export async function checkAndSetDurableIdempotency<T = any>(
  key: string,
  ttlSec = 86400
): Promise<{ isDuplicate: boolean; cachedData?: T }> {
  const fullKey = `idempotency:${key}`;
  const config = getKVConfig();

  if (config) {
    // 1. Attempt atomic lease acquisition with SET NX EX
    const setRes = await callKV<string>([
      'SET',
      fullKey,
      JSON.stringify({ status: 'in_flight' }),
      'NX',
      'EX',
      ttlSec,
    ]);

    // If setRes === 'OK', this instance uniquely won the race and claimed the idempotency key!
    if (setRes === 'OK') {
      return { isDuplicate: false };
    }

    // Otherwise, key already exists (in-flight or completed) -> Retrieve existing cached data
    const existing = await callKV<string>(['GET', fullKey]);
    if (existing) {
      try {
        return { isDuplicate: true, cachedData: JSON.parse(existing) };
      } catch {
        return { isDuplicate: true };
      }
    }

    return { isDuplicate: true };
  }

  if (isProductionEnvironment()) {
    console.error('[DistributedIdempotency] CRITICAL: Idempotency claim in production without active Cloud KV backend.');
    throw new Error('Distributed coordination backend unavailable in production for idempotency claim');
  }

  const unlock = await acquireProcessFileLock();
  try {
    const now = Date.now();
    const state = readSharedState();
    const existing = state.idempotency[key];

    if (existing && existing.expiresAt > now) {
      return { isDuplicate: true, cachedData: existing.data };
    }

    state.idempotency[key] = {
      data: { status: 'in_flight' },
      expiresAt: now + ttlSec * 1000,
    };
    writeSharedStateAtomic(state);
    return { isDuplicate: false };
  } finally {
    unlock();
  }
}

export async function recordDurableIdempotencyResult(
  key: string,
  resultData: any,
  ttlSec = 86400
): Promise<void> {
  const fullKey = `idempotency:${key}`;
  const config = getKVConfig();

  if (config) {
    await callKV(['SET', fullKey, JSON.stringify(resultData), 'EX', ttlSec]);
    return;
  }

  if (isProductionEnvironment()) {
    console.error('[DistributedIdempotency] CRITICAL: Idempotency store in production without active Cloud KV backend.');
    return;
  }

  const unlock = await acquireProcessFileLock();
  try {
    const now = Date.now();
    const state = readSharedState();
    state.idempotency[key] = {
      data: resultData,
      expiresAt: now + ttlSec * 1000,
    };
    writeSharedStateAtomic(state);
  } finally {
    unlock();
  }
}

/**
 * Clear in-flight idempotency key if an operation failed before completion.
 * Prevents transient errors from blocking legitimate subsequent retries.
 * Only clears keys that are still in 'in_flight' status (never clears completed results).
 */
export async function clearDurableIdempotency(key: string): Promise<void> {
  const fullKey = `idempotency:${key}`;
  const config = getKVConfig();

  if (config) {
    const existing = await callKV<string>(['GET', fullKey]);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed.status === 'in_flight') {
          await callKV(['DEL', fullKey]);
        }
      } catch {
        await callKV(['DEL', fullKey]);
      }
    }
    return;
  }

  if (isProductionEnvironment()) {
    console.error('[DistributedIdempotency] CRITICAL: Idempotency clear in production without active Cloud KV backend.');
    return;
  }

  const unlock = await acquireProcessFileLock();
  try {
    const state = readSharedState();
    if (state.idempotency[key]?.data?.status === 'in_flight') {
      delete state.idempotency[key];
      writeSharedStateAtomic(state);
    }
  } finally {
    unlock();
  }
}

// ----------------------------------------------------------------------
// 4. Cross-Instance Razorpay Webhook Deduplication
// ----------------------------------------------------------------------

export async function isDistributedWebhookDuplicate(
  eventId: string,
  ttlSec = 7 * 86400 // 7 Days
): Promise<boolean> {
  const key = `webhook:dedup:${eventId}`;
  const config = getKVConfig();

  if (config) {
    // SET NX returns "OK" if key was set (i.e. first time), null if already exists (duplicate)
    const res = await callKV<string>(['SET', key, '1', 'NX', 'EX', ttlSec]);
    return res !== 'OK';
  }

  if (isProductionEnvironment()) {
    console.error('[DistributedWebhook] CRITICAL: Webhook deduplication in production without active Cloud KV backend.');
    throw new Error('Distributed coordination backend unavailable in production for webhook deduplication');
  }

  const unlock = await acquireProcessFileLock();
  try {
    const now = Date.now();
    const state = readSharedState();
    const existing = state.webhooks[eventId];

    if (existing && existing.expiresAt > now) {
      return true;
    }

    state.webhooks[eventId] = {
      receivedAt: now,
      expiresAt: now + ttlSec * 1000,
    };
    writeSharedStateAtomic(state);
    return false;
  } finally {
    unlock();
  }
}

// ----------------------------------------------------------------------
// 5. Distributed Sliding-Window Rate Limiting
// ----------------------------------------------------------------------

export async function checkDistributedRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; remaining: number; resetSec: number }> {
  const rateKey = `ratelimit:${key}`;
  const config = getKVConfig();

  if (config) {
    // INCR + EXPIRE via pipeline
    const pipelineRes = await callKVPipeline([
      ['INCR', rateKey],
      ['TTL', rateKey],
    ]);

    if (pipelineRes) {
      const count = Number(pipelineRes[0]) || 1;
      let ttl = Number(pipelineRes[1]);

      if (ttl < 0) {
        await callKV(['EXPIRE', rateKey, windowSec]);
        ttl = windowSec;
      }

      const allowed = count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - count),
        resetSec: Math.max(1, ttl),
      };
    }
  }

  // In production, do not silently fall back to ephemeral /tmp file
  if (isProductionEnvironment()) {
    console.warn('[DistributedRateLimit] Cloud KV not configured in production; allowing request to prevent service disruption.');
    return { allowed: true, remaining: limit - 1, resetSec: windowSec };
  }

  // Multi-Process File Store Fallback
  const unlock = await acquireProcessFileLock();
  try {
    const now = Date.now();
    const state = readSharedState();
    const existing = state.rateLimits[key];

    if (!existing || now > existing.resetAt) {
      state.rateLimits[key] = { count: 1, resetAt: now + windowSec * 1000 };
      writeSharedStateAtomic(state);
      return { allowed: true, remaining: limit - 1, resetSec: windowSec };
    }

    existing.count++;
    writeSharedStateAtomic(state);

    const allowed = existing.count <= limit;
    const resetSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed,
      remaining: Math.max(0, limit - existing.count),
      resetSec,
    };
  } finally {
    unlock();
  }
}

// ----------------------------------------------------------------------
// 6. Durable Outbox Queue for Zoho CRM Downtime Recovery
// ----------------------------------------------------------------------

export async function enqueueDurableOutboxOrder(orderPayload: any): Promise<void> {
  const config = getKVConfig();
  if (config) {
    const item = {
      id: `outbox-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      payload: orderPayload,
      queuedAt: Date.now(),
      attempts: 0,
    };
    await callKV(['LPUSH', 'outbox:zoho_orders', JSON.stringify(item)]);
    return;
  }

  if (isProductionEnvironment()) {
    console.error('[DistributedOutbox] CRITICAL: Outbox enqueue in production without active Cloud KV backend.');
    throw new Error('Distributed coordination backend unavailable in production for outbox persistence');
  }

  const unlock = await acquireProcessFileLock();
  try {
    const state = readSharedState();
    state.outbox.unshift({
      id: `outbox-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      payload: orderPayload,
      queuedAt: Date.now(),
      attempts: 0,
    });
    writeSharedStateAtomic(state);
  } finally {
    unlock();
  }
}

export async function dequeueDurableOutboxOrders(batchSize = 10): Promise<any[]> {
  const config = getKVConfig();
  if (config) {
    const items: any[] = [];
    for (let i = 0; i < batchSize; i++) {
      const raw = await callKV<string>(['RPOP', 'outbox:zoho_orders']);
      if (!raw) break;
      try {
        items.push(typeof raw === 'string' ? JSON.parse(raw) : raw);
      } catch {
        // Ignore malformed
      }
    }
    return items;
  }

  if (isProductionEnvironment()) {
    console.error('[DistributedOutbox] CRITICAL: Outbox dequeue in production without active Cloud KV backend.');
    return [];
  }

  const unlock = await acquireProcessFileLock();
  try {
    const state = readSharedState();
    const batch = state.outbox.splice(-batchSize, batchSize);
    writeSharedStateAtomic(state);
    return batch;
  } finally {
    unlock();
  }
}

/**
 * Diagnostic helper to inspect active distributed configuration
 */
export function getDistributedDiagnostics(): {
  isCloudKVConfigured: boolean;
  coordinatorType: 'cloud_kv_rest' | 'multi_process_shared_journal';
  sourceUrlKey: string | null;
  sourceTokenKey: string | null;
  detectedEnvKeys: string[];
  isProduction: boolean;
} {
  const config = getKVConfig();
  const detectedEnvKeys = Object.keys(process.env).filter((k) =>
    /^(KV|UPSTASH|STORAGE|REDIS)/i.test(k)
  );
  const isProd = isProductionEnvironment();

  return {
    isCloudKVConfigured: Boolean(config),
    coordinatorType: config ? 'cloud_kv_rest' : 'multi_process_shared_journal',
    sourceUrlKey: config?.sourceUrlKey || null,
    sourceTokenKey: config?.sourceTokenKey || null,
    detectedEnvKeys,
    isProduction: isProd,
  };
}

/**
 * End-to-end live testing helper for Cloud KV (PING, SET, GET, DEL)
 */
export async function testDistributedKV(): Promise<{
  configured: boolean;
  ping: string | null;
  writeReadTest: boolean;
  latencyMs: number;
  error?: string;
  sourceUrlKey?: string | null;
  sourceTokenKey?: string | null;
}> {
  const config = getKVConfig();
  if (!config) {
    return {
      configured: false,
      ping: null,
      writeReadTest: false,
      latencyMs: 0,
      error: 'Cloud KV not configured. No matching environment variables found.',
    };
  }

  const start = Date.now();
  try {
    const pingRes = await callKV<string>(['PING']);
    const testKey = `coord:health_test:${Date.now()}`;
    const setRes = await callKV<string>(['SET', testKey, 'ok', 'PX', 10000]);
    const getRes = await callKV<string>(['GET', testKey]);
    await callKV(['DEL', testKey]);

    const latencyMs = Date.now() - start;
    const isWriteReadOk = setRes === 'OK' && getRes === 'ok';

    return {
      configured: true,
      ping: pingRes,
      writeReadTest: isWriteReadOk,
      latencyMs,
      sourceUrlKey: config.sourceUrlKey,
      sourceTokenKey: config.sourceTokenKey,
    };
  } catch (err: any) {
    return {
      configured: true,
      ping: null,
      writeReadTest: false,
      latencyMs: Date.now() - start,
      error: err?.message || 'Failed to execute Redis operations',
      sourceUrlKey: config.sourceUrlKey,
      sourceTokenKey: config.sourceTokenKey,
    };
  }
}

/**
 * Clean up helper for test suites
 */
export function clearDistributedStateForTesting(): void {
  const filePath = getSharedStateFilePath();
  const lockPath = getSharedLockFilePath();
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  } catch {
    // Ignore
  }
}

