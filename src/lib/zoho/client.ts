/**
 * Server-side Zoho CRM OAuth 2.0 Client
 *
 * Securely manages Zoho OAuth 2.0 access tokens via the offline refresh token grant
 * and exchanges authorization codes from the OAuth callback.
 * Persists refresh and access tokens in the AES-256-GCM Encrypted Persistent Vault
 * (`src/lib/zoho/token-store.ts`) as well as a local disk cache so all Vercel serverless
 * containers, cold starts, and build workers share the active credentials without
 * hitting Zoho's token refresh rate limit.
 * All credentials execute strictly on the server tier and are never exposed to the browser.
 */

import {
  getPersistedZohoRefreshToken,
  persistZohoRefreshToken,
  persistZohoAccessTokenInVault,
  getVaultCachedAccessToken,
  clearTokenStoreCache,
  setCachedRefreshToken,
} from './token-store';

export const ZOHO_REQUIRED_SCOPES =
  'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.send_mail.all.CREATE';

function getServerNodeFs(): { fs: any; path: any; os: any } | null {
  if (typeof window !== 'undefined') return null;
  try {
    const req = eval('require');
    return {
      fs: req('fs'),
      path: req('path'),
      os: req('os'),
    };
  } catch {
    return null;
  }
}

interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  api_domain?: string;
  token_type?: string;
  expires_in: number; // in seconds, typically 3600
  error?: string;
  error_description?: string;
}

export interface ZohoConfigDiagnostics {
  isConfigured: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  accountsUrl: string;
  apiDomain: string;
}

// In-memory access token cache (optimization within the active container)
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0; // Unix timestamp in milliseconds
let activeRefreshPromise: Promise<string> | null = null;

function getTokenCacheFilePath(): string | null {
  const mod = getServerNodeFs();
  if (!mod) return null;
  const { fs, path, os } = mod;
  const localPath = path.join(process.cwd(), '.zoho_token_cache.json');
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return localPath;
  } catch {
    return path.join(os.tmpdir(), '.zoho_token_cache.json');
  }
}

function readDiskCachedAccessToken(): { accessToken: string; expiresAt: number } | null {
  try {
    const mod = getServerNodeFs();
    const filePath = getTokenCacheFilePath();
    if (!mod || !filePath || !mod.fs.existsSync(filePath)) return null;
    const raw = mod.fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.expiresAt === 'number' &&
      Date.now() < parsed.expiresAt - 300 * 1000
    ) {
      return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt };
    }
  } catch {
    // Ignore disk cache read errors
  }
  return null;
}

function writeDiskCachedAccessToken(accessToken: string, expiresAt: number): void {
  try {
    const mod = getServerNodeFs();
    const filePath = getTokenCacheFilePath();
    if (!mod || !filePath) return;
    mod.fs.writeFileSync(
      filePath,
      JSON.stringify({ accessToken, expiresAt, updatedAt: new Date().toISOString() }),
      'utf8'
    );
  } catch {
    // Ignore disk cache write errors
  }
}

/**
 * Clean URL string by trimming whitespace and trailing slashes
 */
function cleanUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
}

/**
 * Resolve Zoho Accounts URL (default: India DC accounts.zoho.in)
 */
export function getZohoAccountsUrl(): string {
  return cleanUrl(process.env.ZOHO_ACCOUNTS_URL) || 'https://accounts.zoho.in';
}

/**
 * Resolve Zoho API Domain (default: India DC www.zohoapis.in)
 */
export function getZohoApiDomain(): string {
  return cleanUrl(process.env.ZOHO_API_DOMAIN) || 'https://www.zohoapis.in';
}

/**
 * Construct the Zoho OAuth 2.0 Authorization URL for the existing Office Bazzar Website Integration app.
 * Enforces:
 * - scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.send_mail.all.CREATE
 * - access_type=offline
 * - prompt=consent (mandatory so Zoho always issues a fresh refresh_token with the updated scopes)
 */
export function buildZohoAuthorizationUrl(redirectUriOverride?: string): string {
  const clientId = (process.env.ZOHO_CLIENT_ID || '').trim();
  const accountsUrl = getZohoAccountsUrl();
  const redirectUri =
    redirectUriOverride ||
    (process.env.ZOHO_REDIRECT_URI || '').trim() ||
    'https://officebazzar.com/api/zoho/callback';

  const params = new URLSearchParams({
    scope: ZOHO_REQUIRED_SCOPES,
    client_id: clientId,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    redirect_uri: redirectUri,
  });

  return `${accountsUrl}/oauth/v2/auth?${params.toString()}`;
}

/**
 * Get the active refresh token from persistent encrypted vault, runtime cache, or environment
 */
export async function getZohoRefreshToken(): Promise<string | null> {
  return getPersistedZohoRefreshToken();
}

/**
 * Set in-memory cached refresh token
 */
export function setZohoRefreshToken(token: string): void {
  setCachedRefreshToken(token);
}

/**
 * Check whether required Zoho CRM credentials are fully configured (async)
 */
export async function isZohoConfigured(): Promise<boolean> {
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = await getPersistedZohoRefreshToken();

  return Boolean(
    clientId &&
      clientSecret &&
      refreshToken &&
      !clientId.includes('your-') &&
      !clientSecret.includes('your-') &&
      !refreshToken.includes('your-')
  );
}

/**
 * Synchronous check of environment variables
 */
export function isZohoConfiguredSync(): boolean {
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN?.trim();

  return Boolean(
    clientId &&
      clientSecret &&
      refreshToken &&
      !clientId.includes('your-') &&
      !clientSecret.includes('your-') &&
      !refreshToken.includes('your-')
  );
}

/**
 * Diagnostic helper to safely check configuration status without leaking secret values
 */
export async function getZohoConfigDiagnostics(): Promise<ZohoConfigDiagnostics> {
  const refreshToken = await getPersistedZohoRefreshToken();
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();

  return {
    isConfigured: Boolean(clientId && clientSecret && refreshToken),
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    hasRefreshToken: Boolean(refreshToken),
    accountsUrl: getZohoAccountsUrl(),
    apiDomain: getZohoApiDomain(),
  };
}

/**
 * Force clear cached tokens (primarily used in tests and manual reconciliation)
 */
export function clearZohoTokenCache(): void {
  cachedAccessToken = null;
  tokenExpiresAt = 0;
  activeRefreshPromise = null;
  clearTokenStoreCache();
  try {
    const mod = getServerNodeFs();
    const cacheFile = getTokenCacheFilePath();
    if (mod && cacheFile && mod.fs.existsSync(cacheFile)) {
      mod.fs.unlinkSync(cacheFile);
    }
  } catch {
    // Ignore
  }
}

/**
 * Obtain a valid Zoho CRM OAuth 2.0 access token.
 * Access tokens are cached in memory, in the AES-256-GCM encrypted vault, and on disk (.zoho_token_cache.json).
 * If expired or missing, a fresh access token is requested from Zoho using the persistent refresh token.
 */
export async function getZohoAccessToken(): Promise<string> {
  const now = Date.now();

  // 1. Return in-memory cached access token if valid and not within 5-minute expiry threshold
  if (cachedAccessToken && now < tokenExpiresAt - 300 * 1000) {
    return cachedAccessToken;
  }

  // 2. Check cross-worker disk cache (.zoho_token_cache.json)
  const diskCached = readDiskCachedAccessToken();
  if (diskCached) {
    cachedAccessToken = diskCached.accessToken;
    tokenExpiresAt = diskCached.expiresAt;
    return cachedAccessToken;
  }

  // 3. Check persistent AES-256-GCM encrypted vault for a valid non-expired access token
  const vaultCached = await getVaultCachedAccessToken();
  if (vaultCached) {
    cachedAccessToken = vaultCached.accessToken;
    tokenExpiresAt = vaultCached.expiresAt;
    writeDiskCachedAccessToken(cachedAccessToken, tokenExpiresAt);
    return cachedAccessToken;
  }

  // 4. If a refresh is already in flight, reuse the promise to prevent duplicate API hits
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const clientId = process.env.ZOHO_CLIENT_ID?.trim();
      const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
      const refreshToken = await getPersistedZohoRefreshToken();
      const accountsUrl = getZohoAccountsUrl();

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(
          'Zoho CRM credentials missing: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN is not available.'
        );
      }

      const params = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      });

      const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data: ZohoTokenResponse = await response.json();

      if (!response.ok || data.error || !data.access_token) {
        const errMsg =
          data.error_description ||
          data.error ||
          `HTTP ${response.status} failed to obtain access token`;
        throw new Error(`Zoho OAuth token refresh failed: ${errMsg}`);
      }

      cachedAccessToken = data.access_token;
      const validDurationSec = Number(data.expires_in) || 3600;
      tokenExpiresAt = Date.now() + validDurationSec * 1000;
      writeDiskCachedAccessToken(cachedAccessToken, tokenExpiresAt);
      await persistZohoAccessTokenInVault(cachedAccessToken, tokenExpiresAt);

      return cachedAccessToken;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Exchange an OAuth authorization code for Zoho access and refresh tokens,
 * and persist them immediately in the AES-256-GCM Encrypted Persistent Vault.
 */
export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
  accountsServerOverride?: string
): Promise<{
  success: boolean;
  hasNewRefreshToken?: boolean;
  persistenceSource?: 'encrypted_vault' | 'runtime_memory';
  apiDomain?: string;
  expiresIn?: number;
  error?: string;
}> {
  try {
    const clientId = process.env.ZOHO_CLIENT_ID?.trim();
    const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
    const accountsUrl = cleanUrl(accountsServerOverride) || getZohoAccountsUrl();

    if (!clientId || !clientSecret) {
      return {
        success: false,
        error:
          'Zoho OAuth Client ID (ZOHO_CLIENT_ID) or Client Secret (ZOHO_CLIENT_SECRET) is missing in server environment variables.',
      };
    }

    if (!code || !code.trim()) {
      return {
        success: false,
        error: 'Missing authorization code in callback payload.',
      };
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code.trim(),
    });

    const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data: ZohoTokenResponse & { refresh_token?: string } = await response.json();

    if (!response.ok || data.error || !data.access_token) {
      const errMsg =
        data.error_description ||
        data.error ||
        `HTTP ${response.status} failed to exchange authorization code`;
      return {
        success: false,
        error: `Zoho token exchange failed: ${errMsg}`,
      };
    }

    // Cache the new access token in memory and disk
    cachedAccessToken = data.access_token;
    const validDurationSec = Number(data.expires_in) || 3600;
    tokenExpiresAt = Date.now() + validDurationSec * 1000;
    writeDiskCachedAccessToken(cachedAccessToken, tokenExpiresAt);

    let persistenceSource: 'encrypted_vault' | 'runtime_memory' = 'runtime_memory';

    if (data.refresh_token) {
      const persistRes = await persistZohoRefreshToken(data.refresh_token, {
        apiDomain: data.api_domain,
        source: 'oauth_callback',
        accessToken: cachedAccessToken,
        expiresAt: tokenExpiresAt,
      });
      persistenceSource = persistRes.source;
      console.log(
        `[Zoho OAuth] New refresh token persisted securely (storage: ${persistRes.source}).`
      );
    } else {
      // Even if Zoho only returned an access_token (e.g. if prompt=consent was omitted),
      // persist the newly scoped access_token in the encrypted vault so other containers can use it.
      await persistZohoAccessTokenInVault(cachedAccessToken, tokenExpiresAt);
    }

    return {
      success: true,
      hasNewRefreshToken: Boolean(data.refresh_token),
      persistenceSource,
      apiDomain: data.api_domain,
      expiresIn: data.expires_in,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errMsg,
    };
  }
}

export class ZohoApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ZohoApiError';
    this.status = status;
    this.details = details;
  }
}

export class ZohoCircuitBreakerError extends Error {
  public openUntil: number;

  constructor(message: string, openUntil: number) {
    super(message);
    this.name = 'ZohoCircuitBreakerError';
    this.openUntil = openUntil;
  }
}

// ----------------------------------------------------------------------
// CONCURRENCY LIMITER (SEMAPHORE QUEUE)
// ----------------------------------------------------------------------

class ConcurrencySemaphore {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number = 8) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return () => this.release();
    }

    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    this.active--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  getActiveCount(): number {
    return this.active;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

const zohoSemaphore = new ConcurrencySemaphore(8);

// ----------------------------------------------------------------------
// CIRCUIT BREAKER
// ----------------------------------------------------------------------

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private openUntil = 0;
  private halfOpenProbeInFlight = false;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly cooldownMs: number = 30000
  ) {}

  canExecute(): boolean {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now >= this.openUntil) {
        this.state = 'HALF_OPEN';
        this.halfOpenProbeInFlight = false;
        return true;
      }
      return false;
    }
    if (this.state === 'HALF_OPEN') {
      if (!this.halfOpenProbeInFlight) {
        this.halfOpenProbeInFlight = true;
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
    this.halfOpenProbeInFlight = false;
  }

  recordFailure(): void {
    this.consecutiveFailures++;
    this.halfOpenProbeInFlight = false;
    if (this.consecutiveFailures >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.openUntil = Date.now() + this.cooldownMs;
      console.warn(
        `[ZohoCircuitBreaker] Circuit breaker tripped OPEN after ${this.consecutiveFailures} consecutive failures. Cooldown: ${this.cooldownMs / 1000}s.`
      );
    }
  }

  getState(): { state: CircuitState; consecutiveFailures: number; openUntil: number } {
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      openUntil: this.openUntil,
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.openUntil = 0;
    this.halfOpenProbeInFlight = false;
  }
}

const zohoCircuitBreaker = new CircuitBreaker(5, 30000);

// Request Coalescing Map: in-flight idempotent safe GET requests
const inflightGetRequests = new Map<string, Promise<any>>();

/**
 * Diagnostic helper to inspect active concurrency and circuit state
 */
export function getZohoConcurrencyDiagnostics(): {
  activeRequests: number;
  queuedRequests: number;
  circuitState: CircuitState;
  circuitFailures: number;
  coalescedInflight: number;
} {
  const cbState = zohoCircuitBreaker.getState();
  return {
    activeRequests: zohoSemaphore.getActiveCount(),
    queuedRequests: zohoSemaphore.getQueueLength(),
    circuitState: cbState.state,
    circuitFailures: cbState.consecutiveFailures,
    coalescedInflight: inflightGetRequests.size,
  };
}

/**
 * Execute an authenticated request against the Zoho CRM v6 API.
 * Automatically handles:
 * - Controlled concurrency limits (Semaphore max 8 parallel requests)
 * - Safe read request coalescing (inflight promise deduplication)
 * - Circuit breaker fail-fast protection for prolonged outages
 * - Bearer header injection & token refresh (401)
 * - Rate-limit backoff (429) with Retry-After and jitter
 * - Gateway outage retries (502/503/504) with exponential backoff
 */
export async function zohoFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD' || method === 'PUT';
  const isSafeRead = method === 'GET' || method === 'HEAD';

  const apiDomain = getZohoApiDomain();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = cleanEndpoint.startsWith('/crm/v')
    ? `${apiDomain}${cleanEndpoint}`
    : `${apiDomain}/crm/v6${cleanEndpoint}`;

  // 1. Request Coalescing: Deduplicate identical safe read requests in-flight
  if (isSafeRead && !options.body) {
    const coalesceKey = `${method}:${fullUrl}`;
    const existing = inflightGetRequests.get(coalesceKey);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = executeZohoRequest<T>(fullUrl, cleanEndpoint, options, method, isIdempotent).finally(() => {
      inflightGetRequests.delete(coalesceKey);
    });

    inflightGetRequests.set(coalesceKey, promise);
    return promise;
  }

  return executeZohoRequest<T>(fullUrl, cleanEndpoint, options, method, isIdempotent);
}

async function executeZohoRequest<T = unknown>(
  fullUrl: string,
  cleanEndpoint: string,
  options: RequestInit,
  method: string,
  isIdempotent: boolean
): Promise<T> {
  // 2. Circuit Breaker Check: Fail fast if Zoho CRM is experiencing prolonged outage
  if (!zohoCircuitBreaker.canExecute()) {
    const cbState = zohoCircuitBreaker.getState();
    const waitSec = Math.max(1, Math.ceil((cbState.openUntil - Date.now()) / 1000));
    throw new ZohoCircuitBreakerError(
      `Zoho CRM service circuit is temporarily OPEN due to sustained upstream errors. Next probe allowed in ${waitSec}s.`,
      cbState.openUntil
    );
  }

  // 3. Controlled Concurrency Limiter: Wait in queue if 8 requests are already in-flight
  const releaseSemaphore = await zohoSemaphore.acquire();

  const MAX_ATTEMPTS = 3;
  const REQUEST_TIMEOUT_MS = 8000;
  let lastError: unknown = null;

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        let token = await getZohoAccessToken();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let response: Response;
        try {
          response = await fetch(fullUrl, {
            ...options,
            signal: options.signal || controller.signal,
            headers: {
              Authorization: `Zoho-oauthtoken ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...options.headers,
            },
          });
        } finally {
          clearTimeout(timeoutId);
        }

        let rawText = await response.text();
        let parsed: any = null;
        try {
          parsed = rawText ? JSON.parse(rawText) : {};
        } catch {
          parsed = { raw: rawText };
        }

        // Handle Expired OAuth Access Token (401)
        if (response.status === 401 && parsed?.code !== 'OAUTH_SCOPE_MISMATCH' && attempt < MAX_ATTEMPTS) {
          cachedAccessToken = null;
          tokenExpiresAt = 0;
          try {
            const mod = getServerNodeFs();
            const cacheFile = getTokenCacheFilePath();
            if (mod && cacheFile && mod.fs.existsSync(cacheFile)) mod.fs.unlinkSync(cacheFile);
          } catch {
            // Ignore
          }
          continue;
        }

        // Handle Rate Limiting (429)
        if (response.status === 429 && attempt < MAX_ATTEMPTS) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 0;
          const jitter = Math.floor(Math.random() * 250);
          const backoffMs = retryAfterSec > 0
            ? retryAfterSec * 1000 + jitter
            : Math.min(3000, Math.pow(2, attempt) * 500 + jitter);
          console.warn(`[ZohoClient] Rate limit (429) hit for ${cleanEndpoint}. Retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})...`);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        // Handle Transient Gateway Outage (502, 503, 504)
        if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < MAX_ATTEMPTS && isIdempotent) {
          const backoffMs = Math.pow(2, attempt) * 400 + Math.floor(Math.random() * 200);
          console.warn(`[ZohoClient] Gateway status ${response.status} for ${cleanEndpoint}. Retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})...`);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        if (!response.ok) {
          if (response.status >= 500) {
            zohoCircuitBreaker.recordFailure();
          }
          throw new ZohoApiError(
            `Zoho CRM API request to ${cleanEndpoint} failed with HTTP ${response.status}`,
            response.status,
            parsed
          );
        }

        // Request succeeded
        zohoCircuitBreaker.recordSuccess();
        return parsed as T;
      } catch (err: any) {
        lastError = err;
        const isAbortOrTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError' || (typeof err?.message === 'string' && err.message.includes('timeout'));
        const isNetworkErr = err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'));

        if ((isAbortOrTimeout || isNetworkErr) && attempt < MAX_ATTEMPTS && isIdempotent) {
          const backoffMs = Math.pow(2, attempt) * 300 + Math.floor(Math.random() * 150);
          console.warn(`[ZohoClient] Network interruption/timeout on ${cleanEndpoint}. Retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})...`);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        if (err instanceof ZohoApiError) {
          throw err;
        }

        // Network or system failure
        zohoCircuitBreaker.recordFailure();
        throw err;
      }
    }

    zohoCircuitBreaker.recordFailure();
    throw lastError;
  } finally {
    releaseSemaphore();
  }
}
