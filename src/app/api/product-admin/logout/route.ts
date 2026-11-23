import { NextResponse } from 'next/server';
import { PRODUCT_ADMIN_COOKIE_NAME } from '@/lib/product-admin/auth';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully.',
    });

    response.cookies.set(PRODUCT_ADMIN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Product admin logout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to logout' }, { status: 500 });
  }
}
