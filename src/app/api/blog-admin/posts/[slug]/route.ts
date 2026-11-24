import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/blog-admin/auth';
import { getAdminPostBySlug, saveAdminPost, deleteAdminPost, revalidateBlogCache } from '@/lib/blog-admin/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  const { slug } = await params;
  const post = await getAdminPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: NO_CACHE_HEADERS });
  }

  return NextResponse.json({ post }, { headers: NO_CACHE_HEADERS });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  const { slug } = await params;
  try {
    const existing = await getAdminPostBySlug(slug);
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const updates = await request.json().catch(() => ({}));
    const merged = { ...existing, ...updates, slug };
    const result = await saveAdminPost(merged);
    revalidateBlogCache(slug);
    return NextResponse.json({ success: true, post: merged, message: result.message }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return PATCH(request, context);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  const { slug } = await params;
  try {
    const result = await deleteAdminPost(slug);
    revalidateBlogCache(slug);
    return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

