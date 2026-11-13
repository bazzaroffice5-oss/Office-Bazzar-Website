import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'ob_blog_admin_session';

// Pre-configured default credentials for the authorized administrator
// Can be overridden at runtime via Vercel Environment Variables
const DEFAULT_USERNAME = 'bazzaroffice5@gmail.com';
const DEFAULT_PASSWORD_HASH =
  'dad416ab2189368389e950507c5cee00:ad62a72c241d063b16480975455f1b6c5cfaecb8e5da4c6d9edbe486768f548fe31346a8ed003804d29fb665a04919f72bf20459bc7e572d88ae13e13fe2a080';
const DEFAULT_SESSION_SECRET =
  'ob_admin_sec_9b2e4f7a1c3d5e8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f';

export interface AdminAuthConfig {
  configured: boolean;
  username: string;
  passwordHash: string;
  sessionSecret: string;
  missing: string[];
}

/**
 * Retrieve admin authentication configuration with production fallbacks.
 */
export function getAuthConfig(): AdminAuthConfig {
  const username = process.env.BLOG_ADMIN_USERNAME || DEFAULT_USERNAME;
  const passwordHash = process.env.BLOG_ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
  const sessionSecret = process.env.BLOG_ADMIN_SESSION_SECRET || DEFAULT_SESSION_SECRET;

  return {
    configured: true,
    username,
    passwordHash,
    sessionSecret,
    missing: [],
  };
}

/**
 * Generate a cryptographically secure scrypt password hash.
 */
export function hashPassword(
  password: string,
  salt = crypto.randomBytes(16).toString('hex')
): string {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plain-text password against the stored scrypt hash using timing-safe comparison.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const parts = combinedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, storedHash] = parts;
    const storedBuffer = Buffer.from(storedHash, 'hex');
    const calculatedBuffer = crypto.scryptSync(password, salt, 64);
    if (storedBuffer.length !== calculatedBuffer.length) return false;
    return crypto.timingSafeEqual(storedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}

/**
 * Create a tamper-proof HMAC-signed session token with a 7-day expiration.
 */
export function createSessionToken(username: string): string {
  const { sessionSecret } = getAuthConfig();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = JSON.stringify({ u: username, exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * Verify session token integrity and expiration using timingSafeEqual.
 */
export function verifySessionToken(token: string): { valid: boolean; username?: string } {
  try {
    const { sessionSecret } = getAuthConfig();
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [payloadB64, signature] = parts;

    const expectedSig = crypto.createHmac('sha256', sessionSecret).update(payloadB64).digest('base64url');
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length) return { valid: false };
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return { valid: false };

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.u || !payload.exp) return { valid: false };
    if (Date.now() > payload.exp) return { valid: false };

    return { valid: true, username: payload.u };
  } catch {
    return { valid: false };
  }
}

/**
 * Retrieve current authenticated session from Next.js server context.
 */
export async function getAdminSession(): Promise<{
  authenticated: boolean;
  username?: string;
  configured: boolean;
  missingConfig?: string[];
}> {
  const config = getAuthConfig();

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return { authenticated: false, configured: true };
    }

    const result = verifySessionToken(token);
    if (!result.valid || result.username !== config.username) {
      return { authenticated: false, configured: true };
    }

    return {
      authenticated: true,
      username: result.username,
      configured: true,
    };
  } catch (err) {
    console.error('[Blog Admin Auth] Session retrieval error:', err);
    return { authenticated: false, configured: true };
  }
}
