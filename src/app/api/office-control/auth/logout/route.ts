import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/auth/adminSession';

export const dynamic = 'force-dynamic';

export async function POST() {
  console.log('[AdminAuth] POST /logout: Terminating admin session and clearing cookie.');
  const response = NextResponse.json({
    success: true,
    message: 'Admin session terminated successfully.',
  });

  clearAdminCookie(response);
  return response;
}
