import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordPageView, formatToIST } from '@/lib/analytics/store';

export const dynamic = 'force-dynamic';

const BOT_REGEX = /bot|crawler|spider|crawling|googlebot|bingbot|yandex|slurp|duckduckbot|baiduspider|headlesschrome|lighthouse|inspect|curl|wget/i;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

function detectDevice(ua: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (!ua) return 'unknown';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) return 'mobile';
  return 'desktop';
}

export async function POST(req: NextRequest) {
  try {
    // 1. Ignore prefetch requests
    const purpose = req.headers.get('purpose') || req.headers.get('sec-purpose') || req.headers.get('x-purpose');
    if (purpose && purpose.includes('prefetch')) {
      return NextResponse.json({ ok: true, ignored: 'prefetch' }, { status: 200 });
    }

    // 2. Ignore crawlers & search bots
    const userAgent = req.headers.get('user-agent') || '';
    if (BOT_REGEX.test(userAgent)) {
      return NextResponse.json({ ok: true, ignored: 'bot' }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));
    const rawPath = typeof body.path === 'string' ? body.path.trim() : '';

    if (!rawPath) {
      return NextResponse.json({ ok: true, ignored: 'empty_path' }, { status: 200 });
    }

    // 3. Exclude admin routes, API endpoints, and static asset paths
    const cleanPath = rawPath.split('?')[0].split('#')[0];
    const isExcluded =
      cleanPath.startsWith('/api') ||
      cleanPath.startsWith('/product-admin-panel') ||
      cleanPath.startsWith('/blog-admin-panel') ||
      cleanPath.startsWith('/analytics-admin-panel') ||
      cleanPath.startsWith('/admin') ||
      cleanPath.includes('/_next') ||
      cleanPath.endsWith('.png') ||
      cleanPath.endsWith('.jpg') ||
      cleanPath.endsWith('.webp') ||
      cleanPath.endsWith('.svg') ||
      cleanPath.endsWith('.ico') ||
      cleanPath.endsWith('.txt') ||
      cleanPath.endsWith('.xml');

    if (isExcluded) {
      return NextResponse.json({ ok: true, ignored: 'excluded_path' }, { status: 200 });
    }

    // 4. Compute daily anonymous salt hash for unique visitor metrics
    const clientIp = getClientIp(req);
    const today = new Date().toISOString().split('T')[0];
    const visitorHash = crypto
      .createHash('sha256')
      .update(`${today}:${clientIp}:${userAgent}`)
      .digest('hex')
      .substring(0, 16);

    const now = new Date();
    const referrer = typeof body.referrer === 'string' && body.referrer.trim() ? body.referrer.trim().substring(0, 300) : undefined;
    const deviceType = detectDevice(userAgent);

    // 5. Asynchronously record the page view in the background
    recordPageView({
      page_path: cleanPath || '/',
      visitor_hash: visitorHash,
      referrer,
      device_type: deviceType,
      visited_at: now.toISOString(),
      visited_at_ist: formatToIST(now),
    }).catch(() => {});

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
