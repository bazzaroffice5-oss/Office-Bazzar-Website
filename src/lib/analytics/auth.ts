import crypto from 'crypto';
import { cookies } from 'next/headers';
import { AnalyticsAdminSession } from './types';
import {
  PRODUCT_ADMIN_COOKIE_NAME,
  verifyProductAdminSessionToken,
  verifyProductAdminCredentials,
} from '@/lib/product-admin/auth';
import {
  ADMIN_COOKIE_NAME as BLOG_ADMIN_COOKIE_NAME,
  verifySessionToken as verifyBlogAdminSessionToken,
  verifyPassword as verifyBlogScryptPassword,
  getAuthConfig as getBlogAuthConfig,
} from '@/lib/blog-admin/auth';
import { verifyAdminCredentials } from '@/lib/auth/service';

export const ANALYTICS_COOKIE_NAME = 'ob_analytics_admin_session';

const DEFAULT_ADMIN_EMAIL = 'bazzaroffice5@gmail.com';
const DEFAULT_SECONDARY_EMAIL = 'bazzaroffcie5@gmail.com';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const SESSION_SECRET =
  process.env.ADMIN_SECRET_KEY ||
  process.env.ANALYTICS_SESSION_SECRET ||
  'officebazzar_analytics_sec_2026_durable_secret_key_chennai';

function cleanEnvVal(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

/**
 * Validates admin credentials against all authorized administrator email & password variations,
 * environment variables (ANALYTICS_ADMIN_PASSWORD, ADMIN_PASSWORD, etc.), and cryptographic hashes.
 */
export function verifyAnalyticsCredentials(
  email?: string,
  password?: string
): { success: boolean; email?: string; error?: string } {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const cleanEmail = cleanEnvVal(email).toLowerCase();
  const cleanPassword = cleanEnvVal(password);

  // 1. Gather all authorized emails
  const authorizedEmails = new Set<string>([
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_SECONDARY_EMAIL,
    'sales4@officebazzar.com',
    'marketing@officebazzar.com',
  ]);

  const envAnalyticsEmail = cleanEnvVal(process.env.ANALYTICS_ADMIN_EMAIL).toLowerCase();
  if (envAnalyticsEmail) authorizedEmails.add(envAnalyticsEmail);

  const envAdminEmail = cleanEnvVal(process.env.ADMIN_EMAIL).toLowerCase();
  if (envAdminEmail) authorizedEmails.add(envAdminEmail);

  const envProductEmail = cleanEnvVal(process.env.PRODUCT_ADMIN_EMAIL).toLowerCase();
  if (envProductEmail) authorizedEmails.add(envProductEmail);

  const envBlogUser = cleanEnvVal(process.env.BLOG_ADMIN_USERNAME).toLowerCase();
  if (envBlogUser) authorizedEmails.add(envBlogUser);

  if (process.env.ADMIN_ALLOWED_EMAILS) {
    process.env.ADMIN_ALLOWED_EMAILS.split(',').forEach((em) => {
      const e = cleanEnvVal(em).toLowerCase();
      if (e) authorizedEmails.add(e);
    });
  }

  // 2. Gather all authorized passwords
  const authorizedPasswords = new Set<string>([
    'Officebazzar2026!',
    'Officebazzar2026',
    'OfficeBazzar@2026!',
    'OfficeBazzar2026!',
    'OfficeBazzar2026',
  ]);

  const envAnalyticsPass = cleanEnvVal(process.env.ANALYTICS_ADMIN_PASSWORD);
  if (envAnalyticsPass) authorizedPasswords.add(envAnalyticsPass);

  const envAdminPass = cleanEnvVal(process.env.ADMIN_PASSWORD);
  if (envAdminPass) authorizedPasswords.add(envAdminPass);

  const envProductPass = cleanEnvVal(process.env.PRODUCT_ADMIN_PASSWORD);
  if (envProductPass) authorizedPasswords.add(envProductPass);

  const envSalesPass = cleanEnvVal(process.env.ADMIN_PASSWORD_SALES4);
  if (envSalesPass) authorizedPasswords.add(envSalesPass);

  const envMarketingPass = cleanEnvVal(process.env.ADMIN_PASSWORD_MARKETING);
  if (envMarketingPass) authorizedPasswords.add(envMarketingPass);

  // Check direct authorized set
  if (authorizedEmails.has(cleanEmail) && authorizedPasswords.has(cleanPassword)) {
    return { success: true, email: cleanEmail };
  }

  // 3. Delegate to Product Admin verification (checks scrypt hash + fixed admin credentials)
  try {
    const productAuth = verifyProductAdminCredentials(cleanEmail, cleanPassword);
    if (productAuth.success && productAuth.user) {
      return { success: true, email: productAuth.user.email };
    }
  } catch {
    // Continue fallback
  }

  // 4. Delegate to Blog Admin verification (checks scrypt hash)
  try {
    const blogConfig = getBlogAuthConfig();
    if (
      blogConfig.username.toLowerCase() === cleanEmail &&
      verifyBlogScryptPassword(cleanPassword, blogConfig.passwordHash)
    ) {
      return { success: true, email: cleanEmail };
    }
  } catch {
    // Continue fallback
  }

  // 5. Delegate to Corporate Admin verification (handles sales4@ / marketing@)
  try {
    const corporateAuth = verifyAdminCredentials(cleanEmail, cleanPassword);
    if (corporateAuth.success && corporateAuth.user) {
      return { success: true, email: corporateAuth.user.email };
    }
  } catch {
    // Continue fallback
  }

  return { success: false, error: 'Invalid administrator credentials. Access denied.' };
}

export function createAnalyticsSessionToken(email: string): string {
  const expiresAt = Date.now() + ONE_YEAR_MS;
  const payload = JSON.stringify({ u: cleanEnvVal(email).toLowerCase(), exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifyAnalyticsSessionToken(token: string): { valid: boolean; email?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload?.u || !payload?.exp || Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, email: payload.u };
  } catch {
    return { valid: false };
  }
}

/**
 * Retrieves the current admin session.
 * Supports primary analytics session token, plus seamless SSO with Product Admin and Blog Admin session cookies.
 */
export async function getAnalyticsAdminSession(): Promise<AnalyticsAdminSession> {
  try {
    const cookieStore = await cookies();

    // 1. Direct analytics session cookie
    const token = cookieStore.get(ANALYTICS_COOKIE_NAME)?.value;
    if (token) {
      const verified = verifyAnalyticsSessionToken(token);
      if (verified.valid) {
        return {
          authenticated: true,
          email: verified.email,
        };
      }
    }

    // 2. Product Admin SSO session cookie
    const productToken = cookieStore.get(PRODUCT_ADMIN_COOKIE_NAME)?.value;
    if (productToken) {
      const verifiedProduct = verifyProductAdminSessionToken(productToken);
      if (verifiedProduct.valid) {
        return {
          authenticated: true,
          email: verifiedProduct.email,
        };
      }
    }

    // 3. Blog Admin SSO session cookie
    const blogToken = cookieStore.get(BLOG_ADMIN_COOKIE_NAME)?.value;
    if (blogToken) {
      const verifiedBlog = verifyBlogAdminSessionToken(blogToken);
      if (verifiedBlog.valid) {
        return {
          authenticated: true,
          email: verifiedBlog.username,
        };
      }
    }

    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}
