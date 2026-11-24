import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/blog-admin/auth';
import { listAllAdminPosts, saveAdminPost, revalidateBlogCache } from '@/lib/blog-admin/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  const posts = await listAllAdminPosts();
  return NextResponse.json({ posts }, { headers: NO_CACHE_HEADERS });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  try {
    const postData = await request.json();

    if (!postData.title || !postData.slug || !postData.excerpt) {
      return NextResponse.json(
        { error: 'Title, URL slug, and excerpt are required.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Slug validation
    const cleanSlug = postData.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    postData.slug = cleanSlug;
    if (!postData.publishedDate) {
      postData.publishedDate = new Date().toISOString().split('T')[0];
    }
    if (!postData.content) {
      postData.content = '';
    }

    const result = await saveAdminPost(postData);
    revalidateBlogCache(cleanSlug);
    return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('[Blog Admin Save Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save post' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

