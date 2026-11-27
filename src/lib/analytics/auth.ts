import crypto from 'crypto';
import { cookies } from 'next/headers';
import { AnalyticsAdminSession } from './types';

export const ANALYTICS_COOKIE_NAME = 'ob_analytics_admin_session';
export const EXACT_ADMIN_PASSWORD = 'Officebazzar2026!';

const DEFAULT_ADMIN_EMAIL = 'bazzaroffice5@gmail.com';
const DEFAULT_SECONDARY_EMAIL = 'bazzaroffcie5@gmail.com';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const DETERMINISTIC_SECRET = 'officebazzar_analytics_sec_2026_durable_secret_key_chennai';

function getSigningSecret(): string {
  const secret = process.env.ADMIN_SECRET_KEY || process.env.ANALYTICS_SESSION_SECRET;
  if (secret && secret.trim()) {
    return secret.trim();
  }
  return DETERMINISTIC_SECRET;
}

function cleanEnvVal(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

/**
 * Validates admin credentials with an exact, case-sensitive lock against ONLY 'Officebazzar2026!'.
 * Eliminates all fuzzy, normalized, and alternative password fallbacks.
 */
export function verifyAnalyticsCredentials(
  email?: string,
  password?: string
): { success: boolean; email?: string; error?: string } {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  let cleanEmail = cleanEnvVal(email).toLowerCase();
  // Auto-normalize username prefix if entered without @gmail.com
  if (cleanEmail === 'bazzaroffice5' || cleanEmail === 'bazzaroffcie5') {
    cleanEmail = 'bazzaroffice5@gmail.com';
  }

  // 1. Strict, case-sensitive password lock: EXACTLY 'Officebazzar2026!'
  const inputPassword = password.trim();
  if (inputPassword !== EXACT_ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid administrator credentials. Access denied.' };
  }

  // 2. Authorized administrator emails
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

  if (process.env.ADMIN_ALLOWED_EMAILS) {
    process.env.ADMIN_ALLOWED_EMAILS.split(',').forEach((em) => {
      const e = cleanEnvVal(em).toLowerCase();
      if (e) authorizedEmails.add(e);
    });
  }

  if (authorizedEmails.has(cleanEmail)) {
    return { success: true, email: cleanEmail };
  }

  return { success: false, error: 'Invalid administrator credentials. Access denied.' };
}

export function createAnalyticsSessionToken(email: string): string {
  const expiresAt = Date.now() + ONE_YEAR_MS;
  const payload = JSON.stringify({ u: cleanEnvVal(email).toLowerCase(), exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', getSigningSecret()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifyAnalyticsSessionToken(token: string): { valid: boolean; email?: string } {
  try {
    if (!token || typeof token !== 'string') return { valid: false };
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(payloadB64).digest('base64url');

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
 * STRICT: Exclusively requires a valid ob_analytics_admin_session cookie.
 * Uses deterministic signing secret matching createAnalyticsSessionToken().
 */
export async function getAnalyticsAdminSession(): Promise<AnalyticsAdminSession> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ANALYTICS_COOKIE_NAME)?.value;

    if (!token) {
      return { authenticated: false };
    }

    const verified = verifyAnalyticsSessionToken(token);
    if (!verified.valid) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      email: verified.email,
    };
  } catch {
    return { authenticated: false };
  }
}
