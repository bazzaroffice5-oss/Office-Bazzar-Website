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
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const isValid = verifyAnalyticsCredentials(email, password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid administrator credentials. Access denied.' },
        { status: 401 }
      );
    }

    const sessionToken = createAnalyticsSessionToken(email);
    const response = NextResponse.json({ success: true, message: 'Authenticated successfully.' });

    // 1-Year persistent session cookie so admin stays logged in across browser restarts
    response.cookies.set(ANALYTICS_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 365 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
