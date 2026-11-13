import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthConfig,
  verifyPassword,
  createSessionToken,
  ADMIN_COOKIE_NAME,
} from '@/lib/blog-admin/auth';

export async function POST(request: NextRequest) {
  try {
    const config = getAuthConfig();

    if (!config.configured) {
      return NextResponse.json(
        {
          error:
            'Admin authentication is not configured on the server. Please configure BLOG_ADMIN_USERNAME, BLOG_ADMIN_PASSWORD_HASH, and BLOG_ADMIN_SESSION_SECRET in Vercel.',
          configured: false,
          missing: config.missing,
        },
        { status: 500 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    // Verify username match
    if (username.trim() !== config.username) {
      // Artificial delay to prevent timing analysis
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Verify password against stored scrypt hash
    const isValid = verifyPassword(password, process.env.BLOG_ADMIN_PASSWORD_HASH || '');
    if (!isValid) {
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Generate secure session token
    const token = createSessionToken(username);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('[Blog Admin Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal authentication error.' },
      { status: 500 }
    );
  }
}

