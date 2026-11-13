import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'ob_blog_admin_session';

export interface AdminAuthConfig {
  configured: boolean;
  username?: string;
  missing: string[];
}

/**
 * Check if the server-only admin authentication environment variables are configured.
 */
export function getAuthConfig(): AdminAuthConfig {
  const username = process.env.BLOG_ADMIN_USERNAME;
  const passwordHash = process.env.BLOG_ADMIN_PASSWORD_HASH;
  const sessionSecret = process.env.BLOG_ADMIN_SESSION_SECRET;

  const missing: string[] = [];
  if (!username) missing.push('BLOG_ADMIN_USERNAME');
  if (!passwordHash) missing.push('BLOG_ADMIN_PASSWORD_HASH');
  if (!sessionSecret) missing.push('BLOG_ADMIN_SESSION_SECRET');

  return {
    configured: missing.length === 0,
    username,
    missing,
  };
}

/**
 * Generate a cryptographically secure scrypt password hash.
 * Can be run by administrators to generate their BLOG_ADMIN_PASSWORD_HASH.
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
  const secret = process.env.BLOG_ADMIN_SESSION_SECRET || 'fallback-dev-secret-change-in-prod-32';
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = JSON.stringify({ u: username, exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * Verify session token integrity and expiration.
 */
export function verifySessionToken(token: string): { valid: boolean; username?: string } {
  try {
    const secret = process.env.BLOG_ADMIN_SESSION_SECRET || 'fallback-dev-secret-change-in-prod-32';
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [payloadB64, signature] = parts;

    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
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
  if (!config.configured) {
    return {
      authenticated: false,
      configured: false,
      missingConfig: config.missing,
    };
  }

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
}

