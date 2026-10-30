/**
 * Server-side Zoho CRM OAuth 2.0 Client
 *
 * Securely manages Zoho OAuth 2.0 access tokens via the offline refresh token grant
 * and exchanges authorization codes from the OAuth callback.
 * Automatically retrieves the refresh token from persistent Supabase storage across cold starts.
 * All credentials execute strictly on the server tier and are never exposed to the browser.
 */

import {
  getPersistedZohoRefreshToken,
  persistZohoRefreshToken,
  clearTokenStoreCache,
  setCachedRefreshToken,
} from './token-store';

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
 * Get the active refresh token from persistent storage, runtime cache, or environment
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
}

/**
 * Obtain a valid Zoho CRM OAuth 2.0 access token.
 * Access tokens are cached in memory as an optimization.
 * If expired or missing, a fresh access token is requested from Zoho using the persistent refresh token.
 */
export async function getZohoAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached access token if valid and not within 5-minute expiry threshold
  if (cachedAccessToken && now < tokenExpiresAt - 300 * 1000) {
    return cachedAccessToken;
  }

  // If a refresh is already in flight, reuse the promise to prevent duplicate API hits
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
        throw new Error('Zoho CRM credentials missing: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN is not available.');
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
        const errMsg = data.error_description || data.error || `HTTP ${response.status} failed to obtain access token`;
        throw new Error(`Zoho OAuth token refresh failed: ${errMsg}`);
      }

      cachedAccessToken = data.access_token;
      // Expires_in is in seconds (e.g. 3600)
      const validDurationSec = Number(data.expires_in) || 3600;
      tokenExpiresAt = Date.now() + validDurationSec * 1000;

      return cachedAccessToken;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Exchange an OAuth authorization code for Zoho access and refresh tokens.
 * Persists the refresh token to persistent storage (Supabase app_settings) and caches access token.
 */
export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
  accountsServerOverride?: string
): Promise<{
  success: boolean;
  refreshToken?: string;
  accessToken?: string;
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
        error: 'Zoho OAuth Client ID (ZOHO_CLIENT_ID) or Client Secret (ZOHO_CLIENT_SECRET) is missing in server environment variables.',
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
      const errMsg = data.error_description || data.error || `HTTP ${response.status} failed to exchange authorization code`;
      return {
        success: false,
        error: `Zoho token exchange failed: ${errMsg}`,
      };
    }

    // Cache the access token in memory as optimization
    cachedAccessToken = data.access_token;
    const validDurationSec = Number(data.expires_in) || 3600;
    tokenExpiresAt = Date.now() + validDurationSec * 1000;

    // Persist refresh token securely in Supabase storage
    if (data.refresh_token) {
      await persistZohoRefreshToken(data.refresh_token, {
        apiDomain: data.api_domain,
        source: 'oauth_callback',
      });
      console.log('[Zoho OAuth] New refresh token persisted securely.');
    }

    return {
      success: true,
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
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

/**
 * Execute an authenticated request against the Zoho CRM v6 API.
 * Automatically handles Bearer header injection and retries once if access token expired.
 */
export async function zohoFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiDomain = getZohoApiDomain();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${apiDomain}/crm/v6${cleanEndpoint}`;

  let token = await getZohoAccessToken();

  let response = await fetch(fullUrl, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  // If unauthorized (token invalidated prematurely), clear cache and retry once
  if (response.status === 401) {
    cachedAccessToken = null;
    tokenExpiresAt = 0;
    token = await getZohoAccessToken();

    response = await fetch(fullUrl, {
      ...options,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });
  }

  const rawText = await response.text();
  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    parsed = { raw: rawText };
  }

  if (!response.ok) {
    throw new ZohoApiError(
      `Zoho CRM API request to ${endpoint} failed with HTTP ${response.status}`,
      response.status,
      parsed
    );
  }

  return parsed as T;
}
