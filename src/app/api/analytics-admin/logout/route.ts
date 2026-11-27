import { NextRequest, NextResponse } from 'next/server';
import { ANALYTICS_COOKIE_NAME } from '@/lib/analytics/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const isOfficeBazzarDomain = host.includes('officebazzar.com');
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.set(ANALYTICS_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    domain: isProduction && isOfficeBazzarDomain ? '.officebazzar.com' : undefined,
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
