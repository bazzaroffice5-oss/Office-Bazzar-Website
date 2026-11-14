import crypto from 'crypto';
import { cookies } from 'next/headers';
import { verifyAdminCredentials } from '@/lib/auth/service';

export const PRODUCT_ADMIN_COOKIE_NAME = 'ob_product_admin_session';

// Fixed Primary Administrator Credentials
// Fixed Password: Officebazzar2026 (stored via scrypt cryptographic hash)
const DEFAULT_PRIMARY_EMAIL = 'bazzaroffcie5@gmail.com';
const DEFAULT_SECONDARY_EMAIL = 'bazzaroffice5@gmail.com';

const FIXED_PASSWORD_SCRYPT_HASH =
  'f5d527b358692abbad144f8fc328e0e8:f531a4e7f1d6a249d52aa8dad3961180e6e85b28fccef2e41cb9b7e2fd2c3264209a140393bbd92b9a768ac36c8af21e3a3d2209b6ed64342dd793b45902bfba';

const DEFAULT_SESSION_SECRET =
  process.env.ADMIN_SECRET_KEY ||
  process.env.PRODUCT_ADMIN_SESSION_SECRET ||
  'ob_product_admin_sec_7a2e4f1c9d5e8f0a3b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3';

/**
 * Verify plain text password against stored scrypt hash using timing-safe comparison.
 */
export function verifyScryptPassword(password: string, combinedHash: string): boolean {
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
 * Verify credentials for Product Admin access.
 * Accepts:
 * 1. Fixed Administrator Email (bazzaroffcie5@gmail.com / bazzaroffice5@gmail.com) with password "Officebazzar2026"
 * 2. Any email overridden by environment variable PRODUCT_ADMIN_EMAIL
 * 3. Corporate admin emails configured in ADMIN_ALLOWED_EMAILS
 */
export function verifyProductAdminCredentials(
  email: string,
  password?: string
): { success: boolean; user?: { email: string; name: string }; error?: string } {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const configuredEmail = (process.env.PRODUCT_ADMIN_EMAIL || DEFAULT_PRIMARY_EMAIL).toLowerCase();
  const configuredHash = process.env.PRODUCT_ADMIN_PASSWORD_HASH || FIXED_PASSWORD_SCRYPT_HASH;
  const envPlainTextPassword = process.env.PRODUCT_ADMIN_PASSWORD;

  // 1. Check Fixed Administrator Email
  const isMatchEmail =
    cleanEmail === configuredEmail ||
    cleanEmail === DEFAULT_PRIMARY_EMAIL ||
    cleanEmail === DEFAULT_SECONDARY_EMAIL;

  if (isMatchEmail) {
    // Check against scrypt hash
    const isValidHash = verifyScryptPassword(password, configuredHash);
    const isValidPlainText = envPlainTextPassword ? password === envPlainTextPassword : false;

    if (isValidHash || isValidPlainText) {
      return {
        success: true,
        user: { email: cleanEmail, name: 'OfficeBazzar Master Admin' },
      };
    }
  }

  // 2. Check Corporate Admin Credentials if configured
  const adminAuth = verifyAdminCredentials(cleanEmail, password);
  if (adminAuth.success && adminAuth.user) {
    return {
      success: true,
      user: {
        email: adminAuth.user.email,
        name: adminAuth.user.name || 'OfficeBazzar Admin',
      },
    };
  }

  return { success: false, error: 'Invalid administrator email or password.' };
}

/**
 * Create a tamper-proof HMAC-signed session token with a 7-day expiration.
 */
export function createProductAdminSessionToken(email: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = JSON.stringify({ u: email, exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', DEFAULT_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * Verify session token integrity and expiration.
 */
export function verifyProductAdminSessionToken(token: string): {
  valid: boolean;
  email?: string;
} {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [payloadB64, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', DEFAULT_SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length) return { valid: false };
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return { valid: false };

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.u || !payload.exp) return { valid: false };
    if (Date.now() > payload.exp) return { valid: false };

    return { valid: true, email: payload.u };
  } catch {
    return { valid: false };
  }
}

/**
 * Retrieve current authenticated session from Next.js server context.
 */
export async function getProductAdminSession(): Promise<{
  authenticated: boolean;
  email?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PRODUCT_ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return { authenticated: false };
    }

    const result = verifyProductAdminSessionToken(token);
    if (!result.valid || !result.email) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      email: result.email,
    };
  } catch (err) {
    console.error('[Product Admin Auth] Session retrieval error:', err);
    return { authenticated: false };
  }
}
