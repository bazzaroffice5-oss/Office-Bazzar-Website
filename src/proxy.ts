import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkDistributedRateLimit } from '@/lib/distributed/coordinator';

export async function proxy(request: NextRequest) {
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

  // 2. Cross-Instance Distributed Rate Limiting for Sensitive Endpoints
  if (pathname === '/api/auth/send-otp') {
    const rate = await checkDistributedRateLimit(`otp-send:${ip}`, 6, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many verification code requests. Please wait before retrying.' },
        { status: 429, headers: { 'Retry-After': String(rate.resetSec) } }
      );
    }
  }

  if (pathname === '/api/auth/verify-otp') {
    const rate = await checkDistributedRateLimit(`otp-verify:${ip}`, 12, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait before retrying.' },
        { status: 429, headers: { 'Retry-After': String(rate.resetSec) } }
      );
    }
  }

  if (pathname === '/api/orders/create' && method === 'POST') {
    const rate = await checkDistributedRateLimit(`order-create:${ip}`, 20, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Checkout rate limit exceeded. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': String(rate.resetSec) } }
      );
    }
  }

  if (pathname === '/api/quotations/create' && method === 'POST') {
    const rate = await checkDistributedRateLimit(`quote-create:${ip}`, 20, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Quotation submission rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rate.resetSec) } }
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
