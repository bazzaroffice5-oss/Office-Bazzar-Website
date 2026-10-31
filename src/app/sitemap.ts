import { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/db/store';
import { BLOG_POSTS } from '@/lib/data/blog';
import { getCanonicalUrl } from '@/lib/seo/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentLastMod = new Date('2026-10-31T00:00:00.000Z');

  // 1. Core Public Indexable Pages
  const staticPages = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/products', changeFrequency: 'daily' as const, priority: 0.95 },
    { path: '/categories', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/request-quote', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/bulk-orders', changeFrequency: 'weekly' as const, priority: 0.85 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/blogs', changeFrequency: 'weekly' as const, priority: 0.75 },
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
    lastModified: currentLastMod,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // 2. Dynamic Core Categories
  const categories = await getCategories();
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: getCanonicalUrl(`/category/${cat.slug}`),
    lastModified: currentLastMod,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // 3. Dynamic Active Products (101 items)
  const { products } = await getProducts({ limit: 1000 });
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((prod) => prod.isActive !== false)
    .map((prod) => ({
      url: getCanonicalUrl(`/product/${prod.slug}`),
      lastModified: currentLastMod,
      changeFrequency: 'daily' as const,
      priority: prod.featured ? 0.9 : 0.8,
    }));

  // 4. Published Blog Posts (Canonical: /blogs/${slug})
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: getCanonicalUrl(`/blogs/${post.slug}`),
    lastModified: new Date(post.publishedDate),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
