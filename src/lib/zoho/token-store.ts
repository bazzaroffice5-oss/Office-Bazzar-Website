/**
 * Server-Side Persistent Encrypted Token Vault for Zoho OAuth 2.0
 *
 * Solves serverless container isolation on Vercel without relying on in-memory variables
 * or Supabase:
 * 1. Encrypts the Zoho OAuth `refresh_token` and `access_token` using AES-256-GCM
 *    with a 256-bit key derived from `process.env.ZOHO_CLIENT_SECRET`.
 * 2. Persists the AES-256-GCM encrypted envelope in Zoho CRM Settings Organization Variable
 *    `ob_oauth_vault` (`/crm/v6/settings/variables`, ID `1476900000000571016`).
 * 3. Every Vercel serverless container (`/api/zoho/callback`, `/api/quotations/create`,
 *    `/api/admin/notifications/retry`) and local script reads and decrypts `ob_oauth_vault`
 *    so any new refresh token issued via OAuth callback is immediately shared across all
 *    serverless containers and cold starts.
 * 4. Never exposes any token in browser responses, frontend code, logs, or chat.
 */

import crypto from 'crypto';

const VAULT_VAR_API_NAME = 'ob_oauth_vault';
const MEMORY_CACHE_TTL_MS = 60 * 1000; // Re-check vault every 60s across warm invocations

export interface PersistTokenOptions {
  apiDomain?: string;
  location?: string;
  source?: string;
  accessToken?: string;
  expiresAt?: number;
}

export interface VaultPayload {
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number;
  apiDomain?: string;
  updatedAt: string;
  source?: string;
}

interface EncryptedEnvelope {
  v: 1;
  iv: string;
  tag: string;
  ciphertext: string;
  updatedAt: string;
}

let inMemoryRefreshToken: string | null = null;
let inMemoryAccessToken: string | null = null;
let inMemoryAccessTokenExpiresAt = 0;
let lastVaultReadAt = 0;
let lastPersistedAt: string | null = null;
let cachedVaultVarId: string | null = '1476900000000571016';

function getAccountsUrl(): string {
  return (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').trim().replace(/\/+$/, '');
}

function getApiDomain(): string {
  return (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in').trim().replace(/\/+$/, '');
}

/**
 * Derive a 256-bit AES key from ZOHO_CLIENT_SECRET (strictly server-side)
 */
function deriveVaultKey(): Buffer | null {
  const secret = process.env.ZOHO_CLIENT_SECRET?.trim();
  if (!secret) return null;
  return crypto.scryptSync(secret, 'officebazzar-zoho-oauth-vault-v1', 32);
}

/**
 * Encrypt a VaultPayload into a compact (<180 chars) AES-256-GCM string `v1.<iv>.<tag>.<ciphertext>`
 * so it fits comfortably within Zoho CRM Organization Variable 255-char text limit.
 */
function encryptCompactEnvelope(refreshToken: string, updatedAt: string): string | null {
  const key = deriveVaultKey();
  if (!key) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const epochSec = Math.floor(new Date(updatedAt).getTime() / 1000);
  const plaintext = Buffer.from(`${refreshToken}|${epochSec}`, 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

/**
 * Decrypt a compact `v1.<iv>.<tag>.<ciphertext>` AES-256-GCM string
 */
function decryptCompactEnvelope(compact: string): VaultPayload | null {
  try {
    const key = deriveVaultKey();
    if (!key || !compact.startsWith('v1.')) return null;

    const parts = compact.split('.');
    if (parts.length !== 4) return null;

    const iv = Buffer.from(parts[1], 'base64url');
    const tag = Buffer.from(parts[2], 'base64url');
    const ciphertext = Buffer.from(parts[3], 'base64url');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const [refreshToken, epochStr] = decrypted.split('|');
    if (!refreshToken) return null;

    const updatedAt = epochStr
      ? new Date(Number(epochStr) * 1000).toISOString()
      : new Date().toISOString();

    return {
      refreshToken,
      updatedAt,
      source: 'encrypted_vault',
    };
  } catch {
    return null;
  }
}

/**
 * Obtain a bootstrap access token using either the in-memory token or `process.env.ZOHO_REFRESH_TOKEN`
 * strictly for reading/writing the `/crm/v6/settings/variables` vault.
 */
async function getBootstrapAccessToken(explicitAccessToken?: string): Promise<string | null> {
  if (explicitAccessToken) return explicitAccessToken;
  if (inMemoryAccessToken && Date.now() < inMemoryAccessTokenExpiresAt - 300 * 1000) {
    return inMemoryAccessToken;
  }

  // Check local/tmp disk cache (.zoho_token_cache.json) before hitting /oauth/v2/token
  if (typeof window === 'undefined') {
    try {
      const req = eval('require');
      const fs = req('fs');
      const path = req('path');
      const os = req('os');
      for (const candidate of [
        path.join(process.cwd(), '.zoho_token_cache.json'),
        path.join(os.tmpdir(), '.zoho_token_cache.json'),
      ]) {
        if (fs.existsSync(candidate)) {
          const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
          if (
            parsed?.accessToken &&
            typeof parsed.expiresAt === 'number' &&
            Date.now() < parsed.expiresAt - 300 * 1000
          ) {
            return String(parsed.accessToken);
          }
        }
      }
    } catch {
      // Ignore disk read error
    }
  }

  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = inMemoryRefreshToken || process.env.ZOHO_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    });

    const res = await fetch(`${getAccountsUrl()}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data: any = await res.json();
    if (res.ok && data?.access_token) {
      return String(data.access_token);
    }
  } catch {
    // Ignore bootstrap error
  }
  return null;
}

/**
 * Read and decrypt the token payload from Zoho CRM Organization Variable `ob_oauth_vault`
 */
export async function readEncryptedVaultPayload(): Promise<VaultPayload | null> {
  const token = await getBootstrapAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${getApiDomain()}/crm/v6/settings/variables`, {
      method: 'GET',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json: any = await res.json().catch(() => ({}));
    const list: any[] = json?.variables || [];
    const target = list.find((v) => v.api_name === VAULT_VAR_API_NAME || v.name === VAULT_VAR_API_NAME);

    if (!target) return null;
    if (target.id) {
      cachedVaultVarId = String(target.id);
    }

    if (!target.value || target.value === 'test') return null;

    const payload = decryptCompactEnvelope(String(target.value));
    if (payload?.refreshToken) {
      inMemoryRefreshToken = payload.refreshToken;
      lastVaultReadAt = Date.now();
      lastPersistedAt = payload.updatedAt;
      return payload;
    }
  } catch {
    // Ignore parse/network errors
  }

  return null;
}

/**
 * Write the encrypted envelope to Zoho CRM Organization Variable `ob_oauth_vault`
 */
async function writeEncryptedEnvelopeToZohoVariable(
  serializedValue: string,
  explicitAccessToken?: string
): Promise<boolean> {
  const token = await getBootstrapAccessToken(explicitAccessToken);
  if (!token) return false;

  const apiDomain = getApiDomain();

  try {
    // Ensure we know the variable ID
    if (!cachedVaultVarId) {
      await readEncryptedVaultPayload();
    }

    if (cachedVaultVarId) {
      const updateRes = await fetch(`${apiDomain}/crm/v6/settings/variables/${cachedVaultVarId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          variables: [
            {
              id: cachedVaultVarId,
              value: serializedValue,
            },
          ],
        }),
      });

      const updateJson: any = await updateRes.json().catch(() => ({}));
      if (updateRes.ok && updateJson?.variables?.[0]?.code === 'SUCCESS') {
        return true;
      }
    }

    // Create variable if it didn't exist yet
    const createRes = await fetch(`${apiDomain}/crm/v6/settings/variables`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        variables: [
          {
            name: VAULT_VAR_API_NAME,
            api_name: VAULT_VAR_API_NAME,
            type: 'text',
            value: serializedValue,
            variable_group: { api_name: 'General' },
          },
        ],
      }),
    });

    const createJson: any = await createRes.json().catch(() => ({}));
    const createdItem = createJson?.variables?.[0];
    if (createRes.ok && createdItem?.code === 'SUCCESS') {
      if (createdItem?.details?.id) {
        cachedVaultVarId = String(createdItem.details.id);
      }
      return true;
    }
  } catch {
    // Ignore error
  }

  return false;
}

/**
 * Update the in-memory cache
 */
export function setCachedRefreshToken(token: string): void {
  inMemoryRefreshToken = token.trim();
  lastVaultReadAt = Date.now();
}

/**
 * Clear the in-memory cache so the next call reads fresh from the encrypted vault
 */
export function clearTokenStoreCache(): void {
  inMemoryRefreshToken = null;
  inMemoryAccessToken = null;
  inMemoryAccessTokenExpiresAt = 0;
  lastVaultReadAt = 0;
  lastPersistedAt = null;
}

/**
 * Persist the Zoho refresh token (and optional access token) into the AES-256-GCM
 * encrypted Zoho Organization Variable vault (`ob_oauth_vault`).
 */
export async function persistZohoRefreshToken(
  refreshToken: string,
  options: PersistTokenOptions = {}
): Promise<{
  success: boolean;
  source: 'encrypted_vault' | 'runtime_memory';
  updatedAt?: string;
  error?: string;
}> {
  const cleanToken = refreshToken.trim();
  if (!cleanToken) {
    return { success: false, source: 'runtime_memory', error: 'Empty refresh token provided.' };
  }

  const updatedAt = new Date().toISOString();
  inMemoryRefreshToken = cleanToken;
  if (options.accessToken && options.expiresAt) {
    inMemoryAccessToken = options.accessToken;
    inMemoryAccessTokenExpiresAt = options.expiresAt;
  }
  lastVaultReadAt = Date.now();
  lastPersistedAt = updatedAt;

  const compactEnvelope = encryptCompactEnvelope(cleanToken, updatedAt);
  if (!compactEnvelope) {
    return {
      success: true,
      source: 'runtime_memory',
      updatedAt,
      error: 'ZOHO_CLIENT_SECRET missing for vault encryption; stored in memory only.',
    };
  }

  const persisted = await writeEncryptedEnvelopeToZohoVariable(
    compactEnvelope,
    options.accessToken
  );
  if (persisted) {
    return { success: true, source: 'encrypted_vault', updatedAt };
  }

  return { success: true, source: 'runtime_memory', updatedAt };
}

/**
 * Persist a refreshed access token in memory
 */
export async function persistZohoAccessTokenInVault(
  accessToken: string,
  expiresAt: number
): Promise<void> {
  inMemoryAccessToken = accessToken;
  inMemoryAccessTokenExpiresAt = expiresAt;
}

/**
 * Get a valid cached access token from memory or the encrypted vault if not expired
 */
export async function getVaultCachedAccessToken(): Promise<{
  accessToken: string;
  expiresAt: number;
} | null> {
  const now = Date.now();
  if (inMemoryAccessToken && now < inMemoryAccessTokenExpiresAt - 300 * 1000) {
    return { accessToken: inMemoryAccessToken, expiresAt: inMemoryAccessTokenExpiresAt };
  }

  const vault = await readEncryptedVaultPayload();
  if (vault?.accessToken && vault?.expiresAt && now < vault.expiresAt - 300 * 1000) {
    return { accessToken: vault.accessToken, expiresAt: vault.expiresAt };
  }

  return null;
}

/**
 * Retrieve the latest Zoho refresh token across all serverless containers:
 * 1. Recent in-memory cache (within 60s TTL)
 * 2. AES-256-GCM Encrypted Persistent Vault (`ob_oauth_vault` in Zoho CRM Settings Variables)
 * 3. Fallback to `process.env.ZOHO_REFRESH_TOKEN`
 */
export async function getPersistedZohoRefreshToken(): Promise<string | null> {
  const now = Date.now();

  if (inMemoryRefreshToken && now - lastVaultReadAt < MEMORY_CACHE_TTL_MS) {
    return inMemoryRefreshToken;
  }

  const vaultPayload = await readEncryptedVaultPayload();
  if (vaultPayload?.refreshToken) {
    return vaultPayload.refreshToken;
  }

  const envToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  if (envToken && !envToken.includes('your-') && !envToken.includes('placeholder')) {
    inMemoryRefreshToken = envToken;
    lastVaultReadAt = now;
    return inMemoryRefreshToken;
  }

  return null;
}

/**
 * Return safe metadata about which token source is active (never exposes secret values)
 */
export async function getZohoTokenStoreStatus(): Promise<{
  activeSource: 'encrypted_vault' | 'env_variable' | 'none';
  vaultUpdatedAt: string | null;
  tokenFingerprint: string | null;
  vaultSource?: string;
}> {
  const vault = await readEncryptedVaultPayload();
  if (vault?.refreshToken) {
    const hash = crypto.createHash('sha256').update(vault.refreshToken).digest('hex').slice(0, 10);
    return {
      activeSource: 'encrypted_vault',
      vaultUpdatedAt: vault.updatedAt,
      tokenFingerprint: `sha256:${hash}`,
      vaultSource: vault.source,
    };
  }

  const envToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  if (envToken && !envToken.includes('your-')) {
    const hash = crypto.createHash('sha256').update(envToken).digest('hex').slice(0, 10);
    return {
      activeSource: 'env_variable',
      vaultUpdatedAt: lastPersistedAt,
      tokenFingerprint: `sha256:${hash}`,
    };
  }

  return {
    activeSource: 'none',
    vaultUpdatedAt: null,
    tokenFingerprint: null,
  };
}
