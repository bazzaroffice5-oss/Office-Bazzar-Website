import { NextRequest, NextResponse } from 'next/server';
import {
  verifyProductAdminCredentials,
  createProductAdminSessionToken,
  PRODUCT_ADMIN_COOKIE_NAME,
} from '@/lib/product-admin/auth';

const rateLimitMap = new Map<string, { attempts: number; resetAt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMinutes: number } {
  const record = rateLimitMap.get(ip);
  if (!record) return { allowed: true, retryAfterMinutes: 0 };

  if (Date.now() > record.resetAt) {
    rateLimitMap.delete(ip);
    return { allowed: true, retryAfterMinutes: 0 };
  }

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    const remainingMs = record.resetAt - Date.now();
    return {
      allowed: false,
      retryAfterMinutes: Math.ceil(remainingMs / 60000),
    };
  }

  return { allowed: true, retryAfterMinutes: 0 };
}

function recordFailedAttempt(ip: string) {
  const record = rateLimitMap.get(ip);
  if (!record || Date.now() > record.resetAt) {
    rateLimitMap.set(ip, { attempts: 1, resetAt: Date.now() + LOCKOUT_WINDOW_MS });
  } else {
    record.attempts += 1;
  }
}

function clearRateLimit(ip: string) {
  rateLimitMap.delete(ip);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Temporarily locked for security. Please try again in ${rateLimit.retryAfterMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Administrator email and password are required.' },
        { status: 400 }
      );
    }

    const { email, password } = body;
    const authResult = verifyProductAdminCredentials(email, password);

    if (!authResult.success || !authResult.user) {
      recordFailedAttempt(ip);
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json(
        { error: authResult.error || 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    clearRateLimit(ip);

    const token = createProductAdminSessionToken(authResult.user.email);
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful. Redirecting to Product Admin Dashboard...',
      user: authResult.user,
    });

    response.cookies.set(PRODUCT_ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('[Product Admin Login Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
