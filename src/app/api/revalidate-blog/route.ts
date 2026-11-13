import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Handle incoming on-demand ISR revalidation requests from Headless WordPress.
 * Supports webhooks fired when posts are published, edited, unpublished, or trashed.
 */
async function handleRevalidation(request: NextRequest) {
  try {
    const configuredSecret = process.env.WORDPRESS_REVALIDATE_SECRET;

    // 1. Extract secret from Authorization header, custom headers, or query string
    const authHeader = request.headers.get('authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : null;
    const headerSecret =
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-revalidate-secret') ||
      bearerSecret;
    const querySecret = request.nextUrl.searchParams.get('secret');

    const providedSecret = headerSecret || querySecret;

    // 2. Secret Verification
    if (!configuredSecret) {
      console.error(
        '[WordPress Webhook] WORDPRESS_REVALIDATE_SECRET is not configured on the server.'
      );
      return NextResponse.json(
        {
          error:
            'Server revalidation secret not configured. Please set WORDPRESS_REVALIDATE_SECRET in Vercel environment variables.',
        },
        { status: 500 }
      );
    }

    if (!providedSecret || providedSecret !== configuredSecret) {
      console.warn('[WordPress Webhook] Unauthorized webhook attempt: Invalid or missing secret.');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing revalidation secret.' },
        { status: 401 }
      );
    }

    // 3. Extract payload details (slug, action, post_type)
    let slug = request.nextUrl.searchParams.get('slug');
    let action = 'revalidate';

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const body = await request.json();
          slug =
            body.slug ||
            body.post_name ||
            body.post?.post_name ||
            body.data?.post?.post_name ||
            slug;
          action = body.action || body.hook || action;
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          slug = (formData.get('slug') as string) || slug;
          action = (formData.get('action') as string) || action;
        }
      } catch {
        // Fallback to query params if body parsing fails
      }
    }

    // 4. Trigger Next.js cache revalidations
    const revalidatedPaths: string[] = ['/blog', '/', '/sitemap.xml'];

    // Invalidate tagged cache keys
    revalidateTag('wordpress-posts', { expire: 0 });
    revalidateTag('wordpress-categories', { expire: 0 });

    // Invalidate main blog listing and home page
    revalidatePath('/blog');
    revalidatePath('/');
    revalidatePath('/sitemap.xml');

    // Invalidate specific post if slug provided
    if (slug) {
      const cleanSlug = String(slug).trim().replace(/^\/+|\/+$/g, '');
      revalidateTag(`wordpress-post-${cleanSlug}`, { expire: 0 });
      revalidatePath(`/blog/${cleanSlug}`);
      revalidatedPaths.push(`/blog/${cleanSlug}`);
    }

    console.info(
      `[WordPress Webhook] Successfully processed ISR revalidation (action: ${action}, slug: ${slug || 'all'}).`
    );

    return NextResponse.json({
      revalidated: true,
      action,
      slug: slug || null,
      paths: revalidatedPaths,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WordPress Webhook] Error during ISR cache revalidation:', error);
    return NextResponse.json(
      {
        error: 'Failed to revalidate Next.js cache.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRevalidation(request);
}

export async function POST(request: NextRequest) {
  return handleRevalidation(request);
}
