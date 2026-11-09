import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase();

  // If request arrives at apex domain (officebazzar.com), permanently redirect (HTTP 301) to www.officebazzar.com
  if (host === 'officebazzar.com') {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = 'www.officebazzar.com';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except internal Next.js static files and images
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
