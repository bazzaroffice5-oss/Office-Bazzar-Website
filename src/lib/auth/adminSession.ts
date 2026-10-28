import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/db/supabase';

export const ADMIN_COOKIE_NAME = 'ob_admin_session';

/**
 * Exactly two authorized admin email addresses permitted to access the control panel
 */
export const AUTHORIZED_ADMIN_EMAILS = [
  'sales4@officebazzar.com',
  'marketing@officebazzar.com',
] as const;

/**
 * Normalized lowercase comparison against the explicit admin allowlist
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.toLowerCase().trim();
  return AUTHORIZED_ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === clean);
}

const SESSION_SECRET =
  process.env.ADMIN_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'officebazzar-control-secret-key-2026-chennai';

export interface AdminSessionData {
  email: string;
  role: 'admin';
  userId?: string;
  exp: number; // UNIX epoch milliseconds
}

/**
 * Sign an admin session payload using HMAC-SHA256
 */
export function signAdminToken(payload: Omit<AdminSessionData, 'exp'> & { exp?: number }): string {
  const cleanEmail = payload.email.toLowerCase().trim();

  if (!isAuthorizedAdminEmail(cleanEmail)) {
    throw new Error(`Email ${cleanEmail} is not authorized for administrative access.`);
  }

  const sessionData: AdminSessionData = {
    email: cleanEmail,
    role: 'admin',
    userId: payload.userId,
    exp: payload.exp || Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days default
  };

  const jsonStr = JSON.stringify(sessionData);
  const base64Data = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Data)
    .digest('base64url');

  return `${base64Data}.${signature}`;
}

/**
 * Verify HMAC-SHA256 signature, expiration, and authorized email allowlist
 */
export function verifyAdminToken(token?: string | null): {
  isValid: boolean;
  session?: AdminSessionData;
  error?: string;
} {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { isValid: false, error: 'Missing or malformed token' };
  }

  const [base64Data, signature] = token.split('.');
  if (!base64Data || !signature) {
    return { isValid: false, error: 'Invalid token structure' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Data)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { isValid: false, error: 'Invalid signature' };
  }

  try {
    const rawJson = Buffer.from(base64Data, 'base64url').toString('utf8');
    const session = JSON.parse(rawJson) as AdminSessionData;

    if (!session.email || session.role !== 'admin') {
      return { isValid: false, error: 'Unauthorized role' };
    }

    if (!isAuthorizedAdminEmail(session.email)) {
      return { isValid: false, error: 'Unauthorized admin email' };
    }

    if (Date.now() > session.exp) {
      return { isValid: false, error: 'Session expired' };
    }

    return { isValid: true, session };
  } catch {
    return { isValid: false, error: 'Failed to decode session payload' };
  }
}

/**
 * Server-side helper to read and verify admin session from Next.js cookies
 */
export async function getAdminSession(): Promise<{
  isAuthenticated: boolean;
  email?: string;
  userId?: string;
  role?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const { isValid, session } = verifyAdminToken(token);

    if (isValid && session && isAuthorizedAdminEmail(session.email)) {
      return {
        isAuthenticated: true,
        email: session.email,
        userId: session.userId,
        role: session.role,
      };
    }
  } catch {
    // If called outside of request context
  }

  return { isAuthenticated: false };
}

/**
 * Authenticate credentials against Supabase Auth (with profiles.role check)
 * and fallback server-side environment variables.
 * Enforces that only sales4@officebazzar.com and marketing@officebazzar.com may authenticate.
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string; user?: { email: string; userId?: string } }> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Explicit allowlist check
  if (!isAuthorizedAdminEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Access denied: Only authorized admin accounts (sales4@officebazzar.com, marketing@officebazzar.com) have access.',
    };
  }

  if (!password || !password.trim()) {
    return {
      success: false,
      message: 'Password is required.',
    };
  }

  // 2. Check Supabase Auth if connected
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        // Query profiles table to verify admin role
        const client = supabaseAdmin || supabase;
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile || profile.role === 'admin' || profile.role === 'staff') {
          return {
            success: true,
            user: { email: cleanEmail, userId: data.user.id },
          };
        }
      }
    } catch {
      // Continue to environment configuration fallback
    }
  }

  // 3. Server-side environment admin configuration
  const sales4Pass = process.env.ADMIN_PASSWORD_SALES4 || process.env.ADMIN_PASSWORD;
  const marketingPass = process.env.ADMIN_PASSWORD_MARKETING || process.env.ADMIN_PASSWORD;

  // In non-production development environments, provide a fallback if env var is unset
  const devFallback = process.env.NODE_ENV !== 'production' ? 'OfficeBazzar@2026!' : undefined;

  const validSales4Pass = sales4Pass || devFallback;
  const validMarketingPass = marketingPass || devFallback;

  if (validSales4Pass && cleanEmail === 'sales4@officebazzar.com' && password === validSales4Pass) {
    return {
      success: true,
      user: { email: cleanEmail, userId: 'admin-sales4-user' },
    };
  }

  if (validMarketingPass && cleanEmail === 'marketing@officebazzar.com' && password === validMarketingPass) {
    return {
      success: true,
      user: { email: cleanEmail, userId: 'admin-marketing-user' },
    };
  }

  return {
    success: false,
    message: 'Invalid administrative password. Access is restricted to authorized personnel.',
  };
}

/**
 * Set HTTP-Only Cookie on response
 */
export function setAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear HTTP-Only Cookie on response
 */
export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
