import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAnalyticsCredentials,
  createAnalyticsSessionToken,
  ANALYTICS_COOKIE_NAME,
} from '@/lib/analytics/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Administrator email and password are required.' },
        { status: 400 }
      );
    }

    const authResult = verifyAnalyticsCredentials(email, password);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Invalid administrator credentials. Access denied.' },
        { status: 401 }
      );
    }

    const userEmail = authResult.email || String(email).trim().toLowerCase();
    const sessionToken = createAnalyticsSessionToken(userEmail);
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful. Redirecting to Analytics Portal...',
      user: { email: userEmail },
    });

    // Multi-domain support: set domain to .officebazzar.com in production so that
    // admin.officebazzar.com and www.officebazzar.com share the session seamlessly
    const host = req.headers.get('host') || '';
    const isOfficeBazzarDomain = host.includes('officebazzar.com');
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set(ANALYTICS_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      domain: isProduction && isOfficeBazzarDomain ? '.officebazzar.com' : undefined,
      maxAge: 365 * 24 * 60 * 60, // 365 days
    });

    return response;
  } catch (err) {
    console.error('[AnalyticsAdmin Login Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
