/**
 * Server-Side Persistent Token Store for Zoho OAuth 2.0
 *
 * Uses the Vercel server-side environment variable `ZOHO_REFRESH_TOKEN`
 * as the authoritative persistent OAuth credential across serverless cold starts.
 * Access tokens are kept in a secure server-side runtime cache and refreshed on demand.
 *
 * All operations execute strictly on the server tier.
 * Tokens and credentials are NEVER exposed to client components or the browser.
 */

// In-memory runtime cache for tokens within active serverless execution container
let inMemoryRefreshToken: string | null = null;
let lastPersistedAt: string | null = null;

export interface PersistTokenOptions {
  apiDomain?: string;
  location?: string;
  source?: string;
}

/**
 * Update the in-memory cache
 */
export function setCachedRefreshToken(token: string): void {
  inMemoryRefreshToken = token.trim();
}

/**
 * Clear the in-memory cache (primarily for tests)
 */
export function clearTokenStoreCache(): void {
  inMemoryRefreshToken = null;
  lastPersistedAt = null;
}

/**
 * Persist/Cache the Zoho refresh token in runtime memory.
 */
export async function persistZohoRefreshToken(
  refreshToken: string,
  _options: PersistTokenOptions = {}
): Promise<{ success: boolean; source: 'runtime_memory'; error?: string }> {
  const cleanToken = refreshToken.trim();
  if (!cleanToken) {
    return { success: false, source: 'runtime_memory', error: 'Empty refresh token provided.' };
  }

  inMemoryRefreshToken = cleanToken;
  lastPersistedAt = new Date().toISOString();

  return { success: true, source: 'runtime_memory' };
}

/**
 * Retrieve the latest refresh token.
 * Evaluates:
 * 1. In-memory runtime cache (if dynamically set)
 * 2. Vercel server-side environment variable `process.env.ZOHO_REFRESH_TOKEN`
 */
export async function getPersistedZohoRefreshToken(): Promise<string | null> {
  // 1. In-memory runtime fast path
  if (inMemoryRefreshToken) {
    return inMemoryRefreshToken;
  }

  // 2. Authoritative persistent environment variable (configured in Vercel)
  const envToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  if (envToken && !envToken.includes('your-') && !envToken.includes('placeholder')) {
    inMemoryRefreshToken = envToken;
    return inMemoryRefreshToken;
  }

  return null;
}
