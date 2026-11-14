import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../../keystatic.config';
import { BLOG_POSTS } from '@/lib/data/blog';

// Initialize server-side Keystatic reader reading directly from repo content
const reader = createReader(process.cwd(), keystaticConfig);

export interface KeystaticBlogPost {
  id: string;
  slug: string;
  title: string;
  status: 'published' | 'draft';
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

function estimateReadingTimeFromNodes(nodes: any[]): string {
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

/**
 * Fetch all published blog posts with pagination, category filter, and search.
 * Strictly excludes draft articles in production so they are never public or indexed.
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

  let rawPosts: Array<{ slug: string; entry: any }> = [];

  try {
    rawPosts = await reader.collections.posts.all();
  } catch (error) {
    console.warn('[Keystatic Reader] Error reading from disk:', error);
  }

  // Filter drafts, scheduled future posts, and trash items unless explicitly requested (e.g. preview mode)
  if (!includeDrafts) {
    const now = Date.now();
    rawPosts = rawPosts.filter((p) => {
      if (p.entry.status !== 'published') return false;
      if (p.entry.publishedDate) {
        const pubTime = new Date(p.entry.publishedDate).getTime();
        if (!isNaN(pubTime) && pubTime > now) return false;
      }
      return true;
    });
  }

  // Format into unified blog post interface
  let posts: KeystaticBlogPost[] = await Promise.all(
    rawPosts.map(async ({ slug, entry }) => {
      const content = await entry.content();
      const isoDate = entry.publishedDate
        ? new Date(entry.publishedDate).toISOString()
        : new Date().toISOString();

      const title = entry.title || 'Untitled Post';
      const excerpt = entry.excerpt || '';
      const canonical =
        entry.canonicalUrl || `${PRIMARY_CANONICAL_HOST}/blog/${slug}`;
      const imageUrl = entry.featuredImage || '/images/categories/office-supplies-stationery.jpg';

      return {
        id: `keystatic-${slug}`,
        slug,
        title,
        status: entry.status || 'published',
        excerpt,
        category: entry.category || 'Housekeeping & Hygiene',
        categories: [entry.category || 'Housekeeping & Hygiene'],
        tags: Array.isArray(entry.tags) ? entry.tags.filter(Boolean) : [],
        readTime: estimateReadingTimeFromNodes(content),
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
    })
  );

  // Fallback to static blog data if content directory was empty
  if (posts.length === 0) {
    posts = BLOG_POSTS.map((p) => {
      const d = new Date(p.publishedDate);
      const iso = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
      return {
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
      };
    });
  }

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
 */
export async function getBlogPostBySlug(
  slug: string,
  includeDrafts = false
): Promise<KeystaticBlogPost | null> {
  if (!slug) return null;

  try {
    const entry = await reader.collections.posts.read(slug);
    if (entry) {
      if (!includeDrafts) {
        if (entry.status !== 'published') {
          return null; // Exclude non-published
        }
        if (entry.publishedDate) {
          const pubTime = new Date(entry.publishedDate).getTime();
          if (!isNaN(pubTime) && pubTime > Date.now()) {
            return null; // Scheduled in the future
          }
        }
      }
      const content = await entry.content();
      const isoDate = entry.publishedDate
        ? new Date(entry.publishedDate).toISOString()
        : new Date().toISOString();

      const title = entry.title || 'Untitled Post';
      const excerpt = entry.excerpt || '';
      const canonical =
        entry.canonicalUrl || `${PRIMARY_CANONICAL_HOST}/blog/${slug}`;
      const imageUrl = entry.featuredImage || '/images/categories/office-supplies-stationery.jpg';

      return {
        id: `keystatic-${slug}`,
        slug,
        title,
        status: entry.status || 'published',
        excerpt,
        category: entry.category || 'Housekeeping & Hygiene',
        categories: [entry.category || 'Housekeeping & Hygiene'],
        tags: Array.isArray(entry.tags) ? entry.tags.filter(Boolean) : [],
        readTime: estimateReadingTimeFromNodes(content),
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

  // Fallback to static post definition
  const staticMatch = BLOG_POSTS.find((p) => p.slug === slug);
  if (staticMatch) {
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
 */
export async function getAllBlogSlugs(): Promise<string[]> {
  const slugs = new Set<string>();

  try {
    const rawPosts = await reader.collections.posts.all();
    rawPosts.forEach((p) => {
      if (p.entry.status === 'published' && p.slug) {
        slugs.add(p.slug);
      }
    });
  } catch {}

  // Fallback slugs
  BLOG_POSTS.forEach((p) => slugs.add(p.slug));

  return Array.from(slugs);
}

/**
 * Retrieve all categories with their published article count.
 */
export async function getAllBlogCategories(): Promise<
  Array<{ name: string; slug: string; count: number }>
> {
  const catMap = new Map<string, { name: string; slug: string; count: number }>();

  try {
    const rawPosts = await reader.collections.posts.all();
    rawPosts.forEach((p) => {
      if (p.entry.status === 'published' && p.entry.category) {
        const catName = p.entry.category;
        const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = catMap.get(slug);
        if (existing) {
          existing.count += 1;
        } else {
          catMap.set(slug, { name: catName, slug, count: 1 });
        }
      }
    });
  } catch {}

  if (catMap.size === 0) {
    BLOG_POSTS.forEach((p) => {
      const slug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = catMap.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        catMap.set(slug, { name: p.category, slug, count: 1 });
      }
    });
  }

  return Array.from(catMap.values());
}

