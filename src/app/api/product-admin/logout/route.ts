import { NextResponse } from 'next/server';
import { PRODUCT_ADMIN_COOKIE_NAME } from '@/lib/product-admin/auth';

export async function POST() {
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
}
