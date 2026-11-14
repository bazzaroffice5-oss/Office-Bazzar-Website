import crypto from 'crypto';
import { cookies } from 'next/headers';
import { verifyAdminCredentials } from '@/lib/auth/service';
import { getAuthConfig, verifyPassword } from '@/lib/blog-admin/auth';

export const PRODUCT_ADMIN_COOKIE_NAME = 'ob_product_admin_session';

const DEFAULT_SESSION_SECRET =
  process.env.ADMIN_SECRET_KEY ||
  process.env.BLOG_ADMIN_SESSION_SECRET ||
  'ob_product_admin_sec_7a2e4f1c9d5e8f0a3b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3';

/**
 * Verify credentials for Product Admin access.
 * Accepts:
 * 1. Default super-admin email (bazzaroffice5@gmail.com) via scrypt hash
 * 2. Enterprise admin emails (sales4@officebazzar.com, marketing@officebazzar.com, etc.)
 */
export function verifyProductAdminCredentials(
  email: string,
  password?: string
): { success: boolean; user?: { email: string; name: string }; error?: string } {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Check super-admin email
  const superAdminConfig = getAuthConfig();
  if (cleanEmail === superAdminConfig.username.toLowerCase()) {
    const isValid = verifyPassword(password, superAdminConfig.passwordHash);
    if (isValid) {
      return {
        success: true,
        user: { email: cleanEmail, name: 'OfficeBazzar Master Admin' },
      };
    }
  }

  // 2. Check corporate admin credentials
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

  return { success: false, error: 'Invalid administrator credentials.' };
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
