import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/blog-admin/auth';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    response.cookies.delete(ADMIN_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('Blog admin logout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to logout' }, { status: 500 });
  }
}

