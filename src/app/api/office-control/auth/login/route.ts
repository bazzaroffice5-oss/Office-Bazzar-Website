import { NextResponse } from 'next/server';
import { verifyAdminCredentials, signAdminToken, setAdminCookie, isAuthorizedAdminEmail } from '@/lib/auth/adminSession';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    console.log(`[AdminAuth] POST /login: Received login request for "${cleanEmail || 'empty'}"`);

    if (!cleanEmail || !password) {
      console.log(`[AdminAuth] POST /login: Rejected missing credentials.`);
      return NextResponse.json(
        { error: 'Both administrative email and password are required.' },
        { status: 400 }
      );
    }

    if (!isAuthorizedAdminEmail(cleanEmail)) {
      console.log(`[AdminAuth] POST /login: Rejected unauthorized email "${cleanEmail}".`);
      return NextResponse.json(
        { error: 'Access denied: Only authorized admin accounts (sales4@officebazzar.com, marketing@officebazzar.com) have access.' },
        { status: 401 }
      );
    }

    const verification = await verifyAdminCredentials(cleanEmail, String(password));

    if (!verification.success || !verification.user) {
      console.log(`[AdminAuth] POST /login: Authentication failed for "${cleanEmail}": ${verification.message}`);
      return NextResponse.json(
        { error: verification.message || 'Authentication failed. Please verify credentials.' },
        { status: 401 }
      );
    }

    // Generate signed HMAC-SHA256 session token
    const token = signAdminToken({
      email: verification.user.email,
      role: 'admin',
      userId: verification.user.userId,
    });

    console.log(`[AdminAuth] POST /login: Authentication SUCCESS for "${verification.user.email}". Setting session cookie.`);

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        email: verification.user.email,
        role: 'admin',
      },
    });

    setAdminCookie(response, token);
    return response;
  } catch (err: unknown) {
    console.error('[AdminAuth] POST /login error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Authentication processing error.' },
      { status: 500 }
    );
  }
}
