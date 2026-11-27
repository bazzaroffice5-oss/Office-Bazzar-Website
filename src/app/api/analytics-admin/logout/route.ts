import { NextRequest, NextResponse } from 'next/server';
import { ANALYTICS_COOKIE_NAME } from '@/lib/analytics/auth';
import { PRODUCT_ADMIN_COOKIE_NAME } from '@/lib/product-admin/auth';
import { ADMIN_COOKIE_NAME as BLOG_ADMIN_COOKIE_NAME } from '@/lib/blog-admin/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  const expiresHeader = 'Thu, 01 Jan 1970 00:00:00 GMT';

  const cookieNames = [
    ANALYTICS_COOKIE_NAME,
    PRODUCT_ADMIN_COOKIE_NAME,
    BLOG_ADMIN_COOKIE_NAME,
  ];

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully. All admin sessions cleared.',
  });

  for (const name of cookieNames) {
    // 1. Expire host-only cookie
    response.headers.append(
      'Set-Cookie',
      `${name}=; Path=/; Expires=${expiresHeader}; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag}`
    );

    // 2. Expire multi-subdomain cookie for .officebazzar.com
    response.headers.append(
      'Set-Cookie',
      `${name}=; Path=/; Domain=.officebazzar.com; Expires=${expiresHeader}; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag}`
    );

    // 3. Next.js internal cookie store deletion
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}
