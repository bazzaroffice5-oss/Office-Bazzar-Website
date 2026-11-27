import crypto from 'crypto';
import { cookies } from 'next/headers';
import { AnalyticsAdminSession } from './types';

export const ANALYTICS_COOKIE_NAME = 'ob_analytics_admin_session';

const DEFAULT_ADMIN_EMAIL = 'bazzaroffice5@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Officebazzar2026!';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const SESSION_SECRET =
  process.env.ADMIN_SECRET_KEY ||
  process.env.ANALYTICS_SESSION_SECRET ||
  'officebazzar_analytics_sec_2026_durable_secret_key_chennai';

export function verifyAnalyticsCredentials(email?: string, password?: string): boolean {
  if (!email || !password) return false;

  const configuredEmail = (process.env.ANALYTICS_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const configuredPassword = (process.env.ANALYTICS_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD).trim();

  const inputEmail = email.trim().toLowerCase();
  const inputPassword = password.trim();

  const emailMatch = inputEmail === configuredEmail;
  const passMatch = inputPassword === configuredPassword;

  return emailMatch && passMatch;
}

export function createAnalyticsSessionToken(email: string): string {
  const expiresAt = Date.now() + ONE_YEAR_MS;
  const payload = JSON.stringify({ u: email.trim().toLowerCase(), exp: expiresAt });
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

export async function getAnalyticsAdminSession(): Promise<AnalyticsAdminSession> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ANALYTICS_COOKIE_NAME)?.value;
    if (!token) return { authenticated: false };

    const verified = verifyAnalyticsSessionToken(token);
    if (!verified.valid) return { authenticated: false };

    return {
      authenticated: true,
      email: verified.email,
    };
  } catch {
    return { authenticated: false };
  }
}
