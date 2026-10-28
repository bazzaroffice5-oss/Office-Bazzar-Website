import { NextResponse } from 'next/server';
import { getAdminSession, isAuthorizedAdminEmail, clearAdminCookie } from '@/lib/auth/adminSession';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session.isAuthenticated || !session.email || !isAuthorizedAdminEmail(session.email)) {
      console.log(`[AdminAuth] /me check: Unauthenticated or unauthorized. Email: "${session.email || 'none'}". Clearing cookie.`);
      const response = NextResponse.json(
        { isAuthenticated: false, error: 'Unauthorized. Valid admin session required.' },
        { status: 401 }
      );
      clearAdminCookie(response);
      return response;
    }

    console.log(`[AdminAuth] /me check: Verified authorized admin "${session.email}".`);
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        email: session.email,
        role: session.role,
        userId: session.userId,
      },
    });
  } catch (err: unknown) {
    console.error('[AdminAuth] /me check error:', err instanceof Error ? err.message : err);
    const response = NextResponse.json(
      { isAuthenticated: false, error: 'Internal verification failure.' },
      { status: 500 }
    );
    return response;
  }
}
