import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/blog-admin/auth';
import { listMediaItems, saveUploadedMedia } from '@/lib/blog-admin/storage';

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

  try {
    const items = await listMediaItems();
    return NextResponse.json({ media: items }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('[Media API Error]:', error);
    return NextResponse.json({ error: 'Failed to list media items' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    // Strict 2MB file size enforcement
    const MAX_MEDIA_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_MEDIA_SIZE) {
      return NextResponse.json(
        {
          error: `File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 2MB. Please upload an image under 2MB.`,
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await saveUploadedMedia(file.name, buffer);
    return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('[Media Upload Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

