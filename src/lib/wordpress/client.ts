import { BLOG_POSTS, BlogPost } from '@/lib/data/blog';
import {
  WordPressPost,
  WordPressCategory,
  WordPressTag,
  UnifiedBlogPost,
} from './types';

// WordPress CMS base URL – configurable via environment variables
export const WORDPRESS_API_URL =
  (process.env.WORDPRESS_API_URL || 'https://cms.officebazzar.com').replace(/\/$/, '');

// Default canonical domain
const PRIMARY_CANONICAL_HOST = 'https://www.officebazzar.com';

/**
 * Clean and decode HTML entities commonly found in WordPress REST API outputs.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Strip raw HTML tags for clean excerpts and metadata summaries.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return decodeHtmlEntities(
    html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim()
  );
}

/**
 * Estimate reading time based on 200 words per minute average.
 */
export function estimateReadTime(text: string): string {
  const plainText = stripHtml(text);
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Format ISO or SQL dates to human-friendly format (e.g., "July 22, 2026").
 */
export function formatPostDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Sanitize and process WordPress HTML content before rendering.
 * Strips script tags, invalid javascript handlers, and ensures internal link hygiene.
 */
export function sanitizeWordPressHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let cleaned = rawHtml
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove inline event handlers (onclick, onload, onerror, etc.)
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    // Remove javascript: URLs
    .replace(/href=["']javascript:[^"']*["']/gi, 'href="#"')
    // Rewrite cms.officebazzar.com internal post links to /blog/
    .replace(
      /https?:\/\/(?:cms\.)?officebazzar\.(?:com|co\.in)\/blog\/([a-zA-Z0-9_-]+)\/?/gi,
      '/blog/$1'
    )
    .replace(
      /https?:\/\/(?:cms\.)?officebazzar\.(?:com|co\.in)\/([0-9]{4})\/([0-9]{2})\/([a-zA-Z0-9_-]+)\/?/gi,
      '/blog/$3'
    );

  return cleaned;
}

/**
 * Convert a raw WordPress REST API post to the unified application interface.
 */
export function transformWordPressPost(wpPost: WordPressPost): UnifiedBlogPost {
  const title = decodeHtmlEntities(wpPost.title?.rendered || 'Untitled Post');
  const rawExcerpt = wpPost.excerpt?.rendered || '';
  const rawContent = wpPost.content?.rendered || '';
  const excerpt = stripHtml(rawExcerpt) || stripHtml(rawContent).slice(0, 160) + '...';
  const contentHtml = sanitizeWordPressHtml(rawContent);

  // Extract featured media from _embedded
  let imageUrl = '/assets/brand/og-default.jpg';
  let imageAlt = title;

  const embeddedMedia = wpPost._embedded?.['wp:featuredmedia']?.[0];
  if (embeddedMedia) {
    imageUrl =
      embeddedMedia.media_details?.sizes?.large?.source_url ||
      embeddedMedia.source_url ||
      imageUrl;
    if (embeddedMedia.alt_text) {
      imageAlt = embeddedMedia.alt_text;
    }
  }

  // Extract author name
  const authorObj = wpPost._embedded?.author?.[0];
  const author = authorObj?.name ? decodeHtmlEntities(authorObj.name) : 'Office Bazzar Team';

  // Extract categories and tags
  const terms = wpPost._embedded?.['wp:term'] || [];
  const categoriesList: string[] = [];
  const tagsList: string[] = [];

  terms.forEach((termGroup) => {
    termGroup.forEach((term) => {
      if (term.taxonomy === 'category') {
        categoriesList.push(decodeHtmlEntities(term.name));
      } else if (term.taxonomy === 'post_tag') {
        tagsList.push(decodeHtmlEntities(term.name));
      }
    });
  });

  const primaryCategory = categoriesList[0] || 'Procurement Advisory';

  // Rank Math / Yoast SEO integration
  const yoast = wpPost.yoast_head_json;
  const rankMathTitle = wpPost.rank_math_title;
  const rankMathDesc = wpPost.rank_math_description;
  const rankMathCanonical = wpPost.rank_math_canonical_url;

  const seoTitle = rankMathTitle || yoast?.title || title;
  const seoDesc = rankMathDesc || yoast?.description || excerpt;
  const canonical =
    rankMathCanonical ||
    yoast?.canonical ||
    `${PRIMARY_CANONICAL_HOST}/blog/${wpPost.slug}`;

  return {
    id: `wp-${wpPost.id}`,
    slug: wpPost.slug,
    title,
    excerpt,
    contentHtml,
    category: primaryCategory,
    categories: categoriesList.length > 0 ? categoriesList : [primaryCategory],
    tags: tagsList.length > 0 ? tagsList : [primaryCategory],
    readTime: estimateReadTime(rawContent),
    publishedDate: formatPostDate(wpPost.date),
    publishedIsoDate: wpPost.date_gmt ? new Date(wpPost.date_gmt + 'Z').toISOString() : new Date(wpPost.date).toISOString(),
    modifiedIsoDate: wpPost.modified_gmt ? new Date(wpPost.modified_gmt + 'Z').toISOString() : new Date(wpPost.modified).toISOString(),
    author,
    imageUrl,
    imageAlt,
    isWordPress: true,
    seo: {
      title: seoTitle,
      description: seoDesc,
      canonical,
      ogTitle: yoast?.og_title || seoTitle,
      ogDescription: yoast?.og_description || seoDesc,
      ogImage: yoast?.og_image?.[0]?.url || imageUrl,
      schema: yoast?.schema,
      focusKeyword: wpPost.rank_math_focus_keyword,
    },
  };
}

/**
 * Transform fallback static post to the unified format.
 */
export function transformStaticPost(post: BlogPost): UnifiedBlogPost {
  const contentHtml = post.content
    .map((p) => `<p class="leading-relaxed mb-4">${p}</p>`)
    .join('\n');

  const publishedDate = post.publishedDate;
  const d = new Date(publishedDate);
  const isoDate = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    contentHtml,
    category: post.category,
    categories: [post.category],
    tags: post.tags,
    readTime: post.readTime,
    publishedDate: post.publishedDate,
    publishedIsoDate: isoDate,
    modifiedIsoDate: isoDate,
    author: post.author,
    imageUrl: post.imageUrl,
    imageAlt: post.title,
    isWordPress: false,
    seo: {
      title: `${post.title} | OfficeBazzar`,
      description: post.excerpt,
      canonical: `${PRIMARY_CANONICAL_HOST}/blog/${post.slug}`,
      ogTitle: post.title,
      ogDescription: post.excerpt,
      ogImage: post.imageUrl,
    },
  };
}

/**
 * Fetch published WordPress blog posts with graceful fallback.
 * Strictly filters by status=publish to prevent draft or private exposure.
 */
export async function getWordPressPosts(options: {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  search?: string;
} = {}): Promise<{
  posts: UnifiedBlogPost[];
  totalPages: number;
  totalPosts: number;
  isFallback: boolean;
}> {
  const { page = 1, perPage = 12, categorySlug, search } = options;

  try {
    const url = new URL(`${WORDPRESS_API_URL}/wp-json/wp/v2/posts`);
    url.searchParams.set('status', 'publish');
    url.searchParams.set('_embed', 'true');
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));

    if (search && search.trim().length > 0) {
      url.searchParams.set('search', search.trim());
    }

    if (categorySlug) {
      // Look up category ID
      const catRes = await fetch(
        `${WORDPRESS_API_URL}/wp-json/wp/v2/categories?slug=${encodeURIComponent(categorySlug)}`,
        {
          signal: AbortSignal.timeout(3000),
          next: { revalidate: 3600, tags: ['wordpress-categories'] },
        }
      ).catch(() => null);

      if (catRes && catRes.ok) {
        const cats = await catRes.json();
        if (cats && cats.length > 0 && cats[0].id) {
          url.searchParams.set('categories', String(cats[0].id));
        }
      }
    }

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      next: {
        revalidate: 600, // ISR 10 minutes default
        tags: ['wordpress-posts'],
      },
    });

    if (res.ok) {
      const totalPosts = parseInt(res.headers.get('x-wp-total') || '0', 10);
      const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
      const rawPosts: WordPressPost[] = await res.json();

      // Ensure strictly published posts
      const validPosts = rawPosts.filter((p) => p.status === 'publish');

      if (validPosts.length > 0) {
        return {
          posts: validPosts.map(transformWordPressPost),
          totalPages: totalPages || 1,
          totalPosts: totalPosts || validPosts.length,
          isFallback: false,
        };
      }
    }
  } catch (error) {
    // WordPress API is offline, DNS not yet active, or timeout.
    // Graceful fallback prevents any build failure or user-facing downtime.
    console.warn(
      `[WordPress API] Unable to connect to ${WORDPRESS_API_URL}. Using graceful static fallback. Reason:`,
      error instanceof Error ? error.message : error
    );
  }

  // Fallback to local curated blog posts
  let fallbackPosts = BLOG_POSTS.map(transformStaticPost);

  if (categorySlug) {
    fallbackPosts = fallbackPosts.filter(
      (p) =>
        p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug.toLowerCase() ||
        p.categories.some(
          (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug.toLowerCase()
        )
    );
  }

  if (search && search.trim().length > 0) {
    const q = search.toLowerCase().trim();
    fallbackPosts = fallbackPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  // Sort by date descending
  fallbackPosts.sort(
    (a, b) => new Date(b.publishedIsoDate).getTime() - new Date(a.publishedIsoDate).getTime()
  );

  const startIdx = (page - 1) * perPage;
  const paginated = fallbackPosts.slice(startIdx, startIdx + perPage);

  return {
    posts: paginated,
    totalPages: Math.max(1, Math.ceil(fallbackPosts.length / perPage)),
    totalPosts: fallbackPosts.length,
    isFallback: true,
  };
}

/**
 * Fetch a single published post by its URL slug.
 */
export async function getWordPressPostBySlug(slug: string): Promise<UnifiedBlogPost | null> {
  if (!slug) return null;

  try {
    const url = new URL(`${WORDPRESS_API_URL}/wp-json/wp/v2/posts`);
    url.searchParams.set('slug', slug);
    url.searchParams.set('status', 'publish');
    url.searchParams.set('_embed', 'true');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      next: {
        revalidate: 3600, // ISR 1 hour
        tags: ['wordpress-posts', `wordpress-post-${slug}`],
      },
    });

    if (res.ok) {
      const posts: WordPressPost[] = await res.json();
      const match = posts.find((p) => p.slug === slug && p.status === 'publish');
      if (match) {
        return transformWordPressPost(match);
      }
    }
  } catch (error) {
    console.warn(
      `[WordPress API] Failed fetching post by slug "${slug}". Checking fallback. Reason:`,
      error instanceof Error ? error.message : error
    );
  }

  // Fallback to static posts
  const staticMatch = BLOG_POSTS.find((p) => p.slug === slug);
  if (staticMatch) {
    return transformStaticPost(staticMatch);
  }

  return null;
}

/**
 * Retrieve all unique slugs for static parameter generation and sitemap inclusion.
 */
export async function getAllBlogSlugs(): Promise<string[]> {
  const slugs = new Set<string>();

  // Add static fallback slugs first
  BLOG_POSTS.forEach((p) => slugs.add(p.slug));

  try {
    const url = new URL(`${WORDPRESS_API_URL}/wp-json/wp/v2/posts`);
    url.searchParams.set('status', 'publish');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('_fields', 'slug,status');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      next: {
        revalidate: 3600,
        tags: ['wordpress-posts'],
      },
    });

    if (res.ok) {
      const posts: Array<{ slug: string; status: string }> = await res.json();
      posts.forEach((p) => {
        if (p.slug && p.status === 'publish') {
          slugs.add(p.slug);
        }
      });
    }
  } catch (err) {
    // Graceful offline fallback
    console.warn('[WordPress API] getAllBlogSlugs fallback to local slugs:', err instanceof Error ? err.message : err);
  }

  return Array.from(slugs);
}

/**
 * Fetch all categories with published articles.
 */
export async function getWordPressCategories(): Promise<
  Array<{ name: string; slug: string; count: number }>
> {
  try {
    const url = new URL(`${WORDPRESS_API_URL}/wp-json/wp/v2/categories`);
    url.searchParams.set('hide_empty', 'true');
    url.searchParams.set('per_page', '100');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      next: {
        revalidate: 3600,
        tags: ['wordpress-categories'],
      },
    });

    if (res.ok) {
      const cats: WordPressCategory[] = await res.json();
      if (cats && cats.length > 0) {
        return cats.map((c) => ({
          name: decodeHtmlEntities(c.name),
          slug: c.slug,
          count: c.count,
        }));
      }
    }
  } catch {
    // Offline fallback
  }

  // Fallback from static posts
  const catMap = new Map<string, { name: string; slug: string; count: number }>();
  BLOG_POSTS.forEach((p) => {
    const slug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = catMap.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      catMap.set(slug, { name: p.category, slug, count: 1 });
    }
  });

  return Array.from(catMap.values());
}

