import { NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/auth/service';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });
    clearSessionCookies(res);
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process logout.' }, { status: 500 });
  }
}

