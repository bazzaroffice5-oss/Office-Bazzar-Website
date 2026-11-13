import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/blog-admin/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password string is required' }, { status: 400 });
    }

    const hash = hashPassword(password);
    return NextResponse.json({ hash });
  } catch {
    return NextResponse.json({ error: 'Failed to hash password' }, { status: 500 });
  }
}

