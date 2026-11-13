import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/blog-admin/auth';
import { duplicateAdminPost } from '@/lib/blog-admin/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  try {
    const post = await duplicateAdminPost(slug);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Duplication failed' },
      { status: 500 }
    );
  }
}
