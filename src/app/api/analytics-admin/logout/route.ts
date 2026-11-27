import { NextResponse } from 'next/server';
import { ANALYTICS_COOKIE_NAME } from '@/lib/analytics/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json(
    {
      success: true,
      message: 'Logged out successfully. Admin session cleared.',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );

  response.cookies.set(ANALYTICS_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
