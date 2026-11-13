import { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/db/store';
import { getBlogPosts } from '@/lib/keystatic/reader';
import { getCanonicalUrl } from '@/lib/seo/config';

// Verified catalogue and website update timestamp
const LATEST_UPDATE_DATE = new Date('2026-11-12T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Core Public Static Pages
  const staticPages = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/products', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/categories', changeFrequency: 'weekly' as const, priority: 0.85 },
    { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.75 },
    { path: '/bulk-orders', changeFrequency: 'monthly' as const, priority: 0.75 },
    { path: '/request-quote', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/careers', changeFrequency: 'monthly' as const, priority: 0.65 },
    { path: '/shipping-policy', changeFrequency: 'yearly' as const, priority: 0.5 },
    { path: '/returns-refunds', changeFrequency: 'yearly' as const, priority: 0.5 },
    { path: '/cancellation-policy', changeFrequency: 'yearly' as const, priority: 0.5 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.5 },
    { path: '/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.5 },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: getCanonicalUrl(page.path),
    lastModified: LATEST_UPDATE_DATE,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // 2. Dynamic Categories
  const categories = await getCategories();
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: getCanonicalUrl(`/category/${cat.slug}`),
    lastModified: LATEST_UPDATE_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. Dynamic Products
  const { products } = await getProducts({ limit: 5000 });
  const seenSlugs = new Set<string>(['kangaro-staplers-hd-10d', 'kangaro-staplers-hd-10d-1', 'tissue-paper-napkin-1']);
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((prod) => {
      if (prod.isActive === false || seenSlugs.has(prod.slug)) return false;
      seenSlugs.add(prod.slug);
      return true;
    })
    .map((prod) => ({
      url: getCanonicalUrl(`/product/${prod.slug}`),
      lastModified: LATEST_UPDATE_DATE,
      changeFrequency: 'daily' as const,
      priority: prod.featured ? 0.9 : 0.8,
    }));

  // 4. Published Blog Posts (Canonical: /blog/${slug})
  const { posts: blogPosts } = await getBlogPosts({ perPage: 100 });
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: getCanonicalUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.modifiedIsoDate || post.publishedIsoDate),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
