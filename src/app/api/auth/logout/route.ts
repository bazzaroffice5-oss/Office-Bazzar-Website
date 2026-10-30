import { NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/auth/service';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });
  clearSessionCookies(res);
  return res;
}

