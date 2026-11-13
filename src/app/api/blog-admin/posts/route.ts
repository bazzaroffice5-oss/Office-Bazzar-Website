import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/blog-admin/auth';
import { listAllAdminPosts, saveAdminPost } from '@/lib/blog-admin/storage';

export async function GET() {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posts = await listAllAdminPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const postData = await request.json();

    if (!postData.title || !postData.slug || !postData.excerpt) {
      return NextResponse.json(
        { error: 'Title, URL slug, and excerpt are required.' },
        { status: 400 }
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
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Blog Admin Save Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save post' },
      { status: 500 }
    );
  }
}

