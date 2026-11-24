import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../../keystatic.config';
import { BLOG_POSTS } from '@/lib/data/blog';
import {
  getDurableDeletedSlugs,
  getDurableTrashedSlugs,
  getDurablePosts,
} from '@/lib/blog-admin/storage';
import { getDurableBlogState } from '@/lib/durable-store';

// Initialize server-side Keystatic reader reading directly from repo content
const reader = createReader(process.cwd(), keystaticConfig);

export interface KeystaticBlogPost {
  id: string;
  slug: string;
  title: string;
  status: 'published' | 'draft' | 'scheduled' | 'trash';
  excerpt: string;
  category: string;
  categories: string[];
  tags: string[];
  readTime: string;
  publishedDate: string;
  publishedIsoDate: string;
  modifiedIsoDate: string;
  author: string;
  imageUrl: string;
  imageAlt: string;
  content: any; // Keystatic Document AST
  seo: {
    title: string;
    description: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    focusKeyword?: string;
  };
}

const PRIMARY_CANONICAL_HOST = 'https://www.officebazzar.com';

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } catch {}
  return dateStr;
}

function estimateReadingTimeFromNodes(nodes: any): string {
  if (typeof nodes === 'string') {
    const words = nodes.trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  }
  if (!Array.isArray(nodes)) return '4 min read';
  let text = '';
  function extractText(node: any) {
    if (node?.text) text += ' ' + node.text;
    if (Array.isArray(node?.children)) {
      node.children.forEach(extractText);
    }
  }
  nodes.forEach(extractText);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function normalizeContentToAst(content: any): any[] {
  if (Array.isArray(content)) return content;
  if (typeof content === 'string') {
    return content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((para) => ({
        type: 'paragraph',
        children: [{ text: para }],
      }));
  }
  return [];
}

/**
 * Fetch all published blog posts with pagination, category filter, and search.
 * Strictly excludes draft, trashed, scheduled, and deleted articles so they are never public or indexed.
 */
export async function getBlogPosts(options: {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  search?: string;
  includeDrafts?: boolean;
} = {}): Promise<{
  posts: KeystaticBlogPost[];
  totalPages: number;
  totalPosts: number;
}> {
  const { page = 1, perPage = 12, categorySlug, search, includeDrafts = false } = options;

  const [deletedSlugs, trashedSlugs, durablePosts, blogState] = await Promise.all([
    getDurableDeletedSlugs(),
    getDurableTrashedSlugs(),
    getDurablePosts(),
    getDurableBlogState(),
  ]);

  const allDeleted = new Set([
    ...deletedSlugs,
    ...blogState.deletedSlugs.map((s) => s.toLowerCase()),
  ]);
  const allTrashed = new Set([
    ...trashedSlugs,
    ...blogState.trashedSlugs.map((s) => s.toLowerCase()),
  ]);
  const allUnpub = new Set(blogState.unpublishedSlugs.map((s) => s.toLowerCase()));

  let rawPosts: Array<{ slug: string; entry: any }> = [];

  try {
    rawPosts = await reader.collections.posts.all();
  } catch (error) {
    console.warn('[Keystatic Reader] Error reading from disk:', error);
  }

  // Filter out any permanently deleted posts
  rawPosts = rawPosts.filter((p) => !allDeleted.has(p.slug.toLowerCase()));

  const postMap = new Map<string, KeystaticBlogPost>();

  // 1. Process Keystatic repository posts
  for (const { slug, entry } of rawPosts) {
    const cleanSlug = slug.toLowerCase().trim();
    const durable = durablePosts.get(cleanSlug) || (blogState.posts ? blogState.posts[cleanSlug] : undefined);
    const isTrashed = allTrashed.has(cleanSlug);
    const isUnpub = allUnpub.has(cleanSlug);
    const effectiveStatus = (isTrashed
      ? 'trash'
      : isUnpub
      ? 'draft'
      : durable
      ? durable.status
      : entry.status || 'published') as
      | 'published'
      | 'draft'
      | 'scheduled'
      | 'trash';
    const effectivePublishedDate = durable ? durable.publishedDate : entry.publishedDate;

    // Filter drafts, future scheduled posts, and trash items unless explicitly requested
    if (!includeDrafts) {
      if (effectiveStatus !== 'published') continue;
      if (effectivePublishedDate) {
        const pubTime = new Date(effectivePublishedDate).getTime();
        if (!isNaN(pubTime) && pubTime > Date.now()) continue;
      }
    }

    const rawContent = durable ? durable.content : await entry.content();
    const content = normalizeContentToAst(rawContent);
    const isoDate = effectivePublishedDate
      ? new Date(effectivePublishedDate).toISOString()
      : new Date().toISOString();

    const title = durable?.title || entry.title || 'Untitled Post';
    const excerpt = durable?.excerpt || entry.excerpt || '';
    const canonical = durable?.canonicalUrl || entry.canonicalUrl || `${PRIMARY_CANONICAL_HOST}/blog/${slug}`;
    const imageUrl = durable?.featuredImage || entry.featuredImage || '/images/categories/office-supplies-stationery.jpg';
    const category = durable?.category || entry.category || 'Housekeeping & Hygiene';
    const tags = durable?.tags || (Array.isArray(entry.tags) ? entry.tags.filter(Boolean) : []);

    postMap.set(slug, {
      id: `keystatic-${slug}`,
      slug,
      title,
      status: effectiveStatus,
      excerpt,
      category,
      categories: [category],
      tags,
      readTime: estimateReadingTimeFromNodes(rawContent),
      publishedDate: formatDisplayDate(effectivePublishedDate),
      publishedIsoDate: isoDate,
      modifiedIsoDate: isoDate,
      author: durable?.author || entry.author || 'Office Bazzar Team',
      imageUrl,
      imageAlt: durable?.imageAlt || entry.imageAlt || title,
      content,
      seo: {
        title: durable?.seoTitle || entry.seoTitle || `${title} | OfficeBazzar`,
        description: durable?.seoDescription || entry.seoDescription || excerpt,
        canonical,
        ogTitle: durable?.ogTitle || entry.seoTitle || title,
        ogDescription: durable?.ogDescription || entry.seoDescription || excerpt,
        ogImage: durable?.ogImage || imageUrl,
        focusKeyword: durable?.focusKeyword || entry.focusKeyword,
      },
    });
  }

  // 2. Include any newly created posts in durable storage that aren't on disk
  for (const [slug, durable] of durablePosts.entries()) {
    if (deletedSlugs.has(slug)) continue;
    if (postMap.has(slug)) continue;

    if (!includeDrafts) {
      if (durable.status !== 'published') continue;
      if (durable.publishedDate) {
        const pubTime = new Date(durable.publishedDate).getTime();
        if (!isNaN(pubTime) && pubTime > Date.now()) continue;
      }
    }

    const isoDate = durable.publishedDate ? new Date(durable.publishedDate).toISOString() : new Date().toISOString();
    const canonical = durable.canonicalUrl || `${PRIMARY_CANONICAL_HOST}/blog/${slug}`;
    const imageUrl = durable.featuredImage || '/images/categories/office-supplies-stationery.jpg';
    const content = normalizeContentToAst(durable.content);

    postMap.set(slug, {
      id: `durable-${slug}`,
      slug,
      title: durable.title,
      status: durable.status,
      excerpt: durable.excerpt,
      category: durable.category,
      categories: [durable.category],
      tags: durable.tags || [],
      readTime: estimateReadingTimeFromNodes(durable.content),
      publishedDate: formatDisplayDate(durable.publishedDate),
      publishedIsoDate: isoDate,
      modifiedIsoDate: isoDate,
      author: durable.author || 'Office Bazzar Team',
      imageUrl,
      imageAlt: durable.imageAlt || durable.title,
      content,
      seo: {
        title: durable.seoTitle || `${durable.title} | OfficeBazzar`,
        description: durable.seoDescription || durable.excerpt,
        canonical,
        ogTitle: durable.ogTitle || durable.title,
        ogDescription: durable.ogDescription || durable.excerpt,
        ogImage: durable.ogImage || imageUrl,
        focusKeyword: durable.focusKeyword,
      },
    });
  }

  // 3. Fallback to static blog data only if rawPosts AND durablePosts were completely empty
  // and no deletions occurred.
  if (postMap.size === 0 && deletedSlugs.size === 0 && durablePosts.size === 0 && rawPosts.length === 0) {
    for (const p of BLOG_POSTS) {
      if (deletedSlugs.has(p.slug) || trashedSlugs.has(p.slug.toLowerCase().trim())) continue;
      const d = new Date(p.publishedDate);
      const iso = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
      postMap.set(p.slug, {
        id: p.id,
        slug: p.slug,
        title: p.title,
        status: 'published' as const,
        excerpt: p.excerpt,
        category: p.category,
        categories: [p.category],
        tags: p.tags,
        readTime: p.readTime,
        publishedDate: p.publishedDate,
        publishedIsoDate: iso,
        modifiedIsoDate: iso,
        author: p.author,
        imageUrl: p.imageUrl,
        imageAlt: p.title,
        content: p.content.map((para) => ({
          type: 'paragraph',
          children: [{ text: para }],
        })),
        seo: {
          title: `${p.title} | OfficeBazzar`,
          description: p.excerpt,
          canonical: `${PRIMARY_CANONICAL_HOST}/blog/${p.slug}`,
          ogTitle: p.title,
          ogDescription: p.excerpt,
          ogImage: p.imageUrl,
        },
      });
    }
  }

  let posts: KeystaticBlogPost[] = Array.from(postMap.values());

  // Filter by category
  if (categorySlug) {
    const targetSlug = categorySlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    posts = posts.filter(
      (p) =>
        p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug ||
        p.categories.some((c) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug)
    );
  }

  // Filter by search query
  if (search && search.trim().length > 0) {
    const q = search.toLowerCase().trim();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  posts.sort(
    (a, b) => new Date(b.publishedIsoDate).getTime() - new Date(a.publishedIsoDate).getTime()
  );

  const startIdx = (page - 1) * perPage;
  const paginated = posts.slice(startIdx, startIdx + perPage);

  return {
    posts: paginated,
    totalPages: Math.max(1, Math.ceil(posts.length / perPage)),
    totalPosts: posts.length,
  };
}

/**
 * Fetch a single blog post by its slug.
 * Strictly excludes trashed, draft, or deleted articles for public requests.
 */
export async function getBlogPostBySlug(
  slug: string,
  includeDrafts = false
): Promise<KeystaticBlogPost | null> {
  if (!slug) return null;

  // 1. If slug is permanently deleted or trashed, NEVER return it for public view!
  const [deletedSlugs, trashedSlugs, blogState] = await Promise.all([
    getDurableDeletedSlugs(),
    getDurableTrashedSlugs(),
    getDurableBlogState(),
  ]);
  const cleanSlug = slug.toLowerCase().trim();
  if (deletedSlugs.has(cleanSlug) || blogState.deletedSlugs.map((s) => s.toLowerCase()).includes(cleanSlug)) {
    return null;
  }
  if (
    !includeDrafts &&
    (trashedSlugs.has(cleanSlug) ||
      blogState.trashedSlugs.map((s) => s.toLowerCase()).includes(cleanSlug) ||
      blogState.unpublishedSlugs.map((s) => s.toLowerCase()).includes(cleanSlug))
  ) {
    return null;
  }

  // 2. Check durable storage
  const durablePosts = await getDurablePosts();
  const durable = durablePosts.get(slug);

  if (durable) {
    if (!includeDrafts) {
      if (durable.status !== 'published') return null;
      if (durable.publishedDate) {
        const pubTime = new Date(durable.publishedDate).getTime();
        if (!isNaN(pubTime) && pubTime > Date.now()) return null;
      }
    }

    const isoDate = durable.publishedDate ? new Date(durable.publishedDate).toISOString() : new Date().toISOString();
    const canonical = durable.canonicalUrl || `${PRIMARY_CANONICAL_HOST}/blog/${slug}`;
    const imageUrl = durable.featuredImage || '/images/categories/office-supplies-stationery.jpg';
    const content = normalizeContentToAst(durable.content);

    return {
      id: `durable-${slug}`,
      slug,
      title: durable.title,
      status: durable.status,
      excerpt: durable.excerpt,
      category: durable.category,
      categories: [durable.category],
      tags: durable.tags || [],
      readTime: estimateReadingTimeFromNodes(durable.content),
      publishedDate: formatDisplayDate(durable.publishedDate),
      publishedIsoDate: isoDate,
      modifiedIsoDate: isoDate,
      author: durable.author || 'Office Bazzar Team',
      imageUrl,
      imageAlt: durable.imageAlt || durable.title,
      content,
      seo: {
        title: durable.seoTitle || `${durable.title} | OfficeBazzar`,
        description: durable.seoDescription || durable.excerpt,
        canonical,
        ogTitle: durable.ogTitle || durable.title,
        ogDescription: durable.ogDescription || durable.excerpt,
        ogImage: durable.ogImage || imageUrl,
        focusKeyword: durable.focusKeyword,
      },
    };
  }

  // 3. Check Keystatic reader
  try {
    const entry = await reader.collections.posts.read(slug);
    if (entry) {
      const status = (entry.status || 'published') as 'published' | 'draft' | 'scheduled' | 'trash';
      if (!includeDrafts) {
        if (status !== 'published') return null;
        if (entry.publishedDate) {
          const pubTime = new Date(entry.publishedDate).getTime();
          if (!isNaN(pubTime) && pubTime > Date.now()) return null;
        }
      }

      const rawContent = await entry.content();
      const content = normalizeContentToAst(rawContent);
      const isoDate = entry.publishedDate ? new Date(entry.publishedDate).toISOString() : new Date().toISOString();
      const title = entry.title || 'Untitled Post';
      const excerpt = entry.excerpt || '';
      const canonical = entry.canonicalUrl || `${PRIMARY_CANONICAL_HOST}/blog/${slug}`;
      const imageUrl = entry.featuredImage || '/images/categories/office-supplies-stationery.jpg';

      return {
        id: `keystatic-${slug}`,
        slug,
        title,
        status,
        excerpt,
        category: entry.category || 'Housekeeping & Hygiene',
        categories: [entry.category || 'Housekeeping & Hygiene'],
        tags: Array.isArray(entry.tags) ? entry.tags.filter(Boolean) : [],
        readTime: estimateReadingTimeFromNodes(rawContent),
        publishedDate: formatDisplayDate(entry.publishedDate),
        publishedIsoDate: isoDate,
        modifiedIsoDate: isoDate,
        author: entry.author || 'Office Bazzar Team',
        imageUrl,
        imageAlt: entry.imageAlt || title,
        content,
        seo: {
          title: entry.seoTitle || `${title} | OfficeBazzar`,
          description: entry.seoDescription || excerpt,
          canonical,
          ogTitle: entry.seoTitle || title,
          ogDescription: entry.seoDescription || excerpt,
          ogImage: imageUrl,
          focusKeyword: entry.focusKeyword,
        },
      };
    }
  } catch (err) {
    console.warn(`[Keystatic Reader] Error fetching post by slug "${slug}":`, err);
  }

  // 4. Fallback to static post definition ONLY if NOT deleted and NOT in durable store
  const staticMatch = BLOG_POSTS.find((p) => p.slug === slug);
  if (staticMatch && !deletedSlugs.has(slug) && !trashedSlugs.has(cleanSlug)) {
    const d = new Date(staticMatch.publishedDate);
    const iso = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
    return {
      id: staticMatch.id,
      slug: staticMatch.slug,
      title: staticMatch.title,
      status: 'published',
      excerpt: staticMatch.excerpt,
      category: staticMatch.category,
      categories: [staticMatch.category],
      tags: staticMatch.tags,
      readTime: staticMatch.readTime,
      publishedDate: staticMatch.publishedDate,
      publishedIsoDate: iso,
      modifiedIsoDate: iso,
      author: staticMatch.author,
      imageUrl: staticMatch.imageUrl,
      imageAlt: staticMatch.title,
      content: staticMatch.content.map((para) => ({
        type: 'paragraph',
        children: [{ text: para }],
      })),
      seo: {
        title: `${staticMatch.title} | OfficeBazzar`,
        description: staticMatch.excerpt,
        canonical: `${PRIMARY_CANONICAL_HOST}/blog/${staticMatch.slug}`,
        ogTitle: staticMatch.title,
        ogDescription: staticMatch.excerpt,
        ogImage: staticMatch.imageUrl,
      },
    };
  }

  return null;
}

/**
 * Retrieve all published blog slugs for static generation and sitemap.
 * Strictly excludes trashed, draft, or deleted articles.
 */
export async function getAllBlogSlugs(): Promise<string[]> {
  const { posts } = await getBlogPosts({ perPage: 1000, includeDrafts: false });
  return posts.map((p) => p.slug);
}

/**
 * Retrieve all categories with their published article count.
 */
export async function getAllBlogCategories(): Promise<
  Array<{ name: string; slug: string; count: number }>
> {
  const { posts } = await getBlogPosts({ perPage: 1000, includeDrafts: false });
  const catMap = new Map<string, { name: string; slug: string; count: number }>();

  for (const post of posts) {
    if (!post.category) continue;
    const catName = post.category;
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = catMap.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      catMap.set(slug, { name: catName, slug, count: 1 });
    }
  }

  return Array.from(catMap.values());
}
