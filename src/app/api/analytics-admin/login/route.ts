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

    const host = req.headers.get('host') || '';
    const isOfficeBazzarDomain = host.includes('officebazzar.com');
    const isProduction = process.env.NODE_ENV === 'production';
    const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

    // 1. Host-bound cookie (guaranteed to work on https://www.officebazzar.com and localhost)
    response.cookies.set(ANALYTICS_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
    });

    // 2. Also set multi-subdomain cookie (.officebazzar.com) when accessed via officebazzar.com
    if (isProduction && isOfficeBazzarDomain) {
      response.headers.append(
        'Set-Cookie',
        `${ANALYTICS_COOKIE_NAME}=${sessionToken}; Path=/; Domain=.officebazzar.com; Max-Age=${ONE_YEAR_SECONDS}; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`
      );
    }

    return response;
  } catch (err) {
    console.error('[AnalyticsAdmin Login Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
