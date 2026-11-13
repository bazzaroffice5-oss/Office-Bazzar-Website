import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/blog-admin/auth';
import { listMediaItems, saveUploadedMedia } from '@/lib/blog-admin/storage';

export async function GET() {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await listMediaItems();
    return NextResponse.json({ media: items });
  } catch (error) {
    console.error('[Media API Error]:', error);
    return NextResponse.json({ error: 'Failed to list media items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await saveUploadedMedia(file.name, buffer);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Media Upload Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

