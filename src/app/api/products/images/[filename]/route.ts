import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getProductImage } from '@/lib/products/image-store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename) {
      return NextResponse.redirect(new URL('/assets/placeholder-product.svg', request.url));
    }

    const image = await getProductImage(filename);
    if (!image) {
      return NextResponse.redirect(new URL('/assets/placeholder-product.svg', request.url));
    }

    const etag = `"${crypto.createHash('md5').update(image.buffer).digest('hex')}"`;
    const clientEtag = request.headers.get('if-none-match');

    if (clientEtag === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(new Uint8Array(image.buffer), {
      status: 200,
      headers: {
        'Content-Type': image.mimeType,
        'Content-Length': image.buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
      },
    });
  } catch (err) {
    console.error('[Product Image API] Serving error:', err);
    return NextResponse.redirect(new URL('/assets/placeholder-product.svg', request.url));
  }
}
