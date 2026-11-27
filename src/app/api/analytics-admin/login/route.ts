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
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }

    const authResult = verifyAnalyticsCredentials(email, password);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Invalid administrator credentials. Access denied.' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }

    const userEmail = authResult.email || String(email).trim().toLowerCase();
    const sessionToken = createAnalyticsSessionToken(userEmail);
    const isProduction = process.env.NODE_ENV === 'production';
    const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

    const response = NextResponse.json(
      {
        success: true,
        message: 'Authentication successful. Redirecting to Analytics Portal...',
        user: { email: userEmail },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );

    // Set single deterministic cookie (host-bound path=/, httpOnly, sameSite=lax)
    response.cookies.set(ANALYTICS_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('[AnalyticsAdmin Login Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  }
}
