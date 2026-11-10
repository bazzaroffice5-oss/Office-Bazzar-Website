import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ----------------------------------------------------------------------
// HIGH-TRAFFIC CONCURRENCY RATE LIMITER (SLIDING WINDOW)
// ----------------------------------------------------------------------

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiting map per client IP
const rateLimitMap = new Map<string, RateLimitRecord>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  record.count++;
  if (record.count > limit) {
    return true;
  }

  return false;
}

// Periodically prune stale keys to prevent memory growth under continuous traffic
let lastCleanup = Date.now();
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup > 60000) {
    lastCleanup = now;
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }
}

export function proxy(request: NextRequest) {
  cleanupRateLimitMap();

  const host = request.headers.get('host')?.toLowerCase();

  // 1. Domain Canonicalization:
  // If request arrives at WWW domain (www.officebazzar.com), permanently redirect (HTTP 301) to official primary domain (officebazzar.com)
  if (host === 'www.officebazzar.com') {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = 'officebazzar.com';
    return NextResponse.redirect(url, 301);
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const pathname = request.nextUrl.pathname;
  const method = request.method.toUpperCase();

  // 2. High-Concurrency Rate Limiting for Sensitive Endpoints
  if (pathname === '/api/auth/send-otp') {
    if (isRateLimited(`otp-send:${ip}`, 6, 60000)) {
      return NextResponse.json(
        { error: 'Too many verification code requests. Please wait 1 minute before retrying.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  if (pathname === '/api/auth/verify-otp') {
    if (isRateLimited(`otp-verify:${ip}`, 12, 60000)) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait before retrying.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  if (pathname === '/api/orders/create' && method === 'POST') {
    if (isRateLimited(`order-create:${ip}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Checkout rate limit exceeded. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': '30' } }
      );
    }
  }

  if (pathname === '/api/quotations/create' && method === 'POST') {
    if (isRateLimited(`quote-create:${ip}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Quotation submission rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '30' } }
      );
    }
  }

  // 3. CSRF / Origin Header Verification on Mutating State Requests (Exempting Webhooks)
  if (
    (method === 'POST' || method === 'PUT' || method === 'DELETE') &&
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/webhooks/')
  ) {
    const origin = request.headers.get('origin');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        const hostWithoutPort = host.split(':')[0].toLowerCase();
        const originHostname = originUrl.hostname.toLowerCase();

        const isAllowed =
          originHostname === hostWithoutPort ||
          originHostname === 'officebazzar.com' ||
          originHostname.endsWith('.officebazzar.com') ||
          originHostname === 'localhost' ||
          originHostname === '127.0.0.1';

        if (!isAllowed) {
          return NextResponse.json(
            { error: 'Forbidden: Cross-site request rejected.' },
            { status: 403 }
          );
        }
      } catch {
        // Invalid origin format
      }
    }
  }

  // 4. Security Headers Injection
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except internal Next.js static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
