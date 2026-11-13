import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  Tag,
  ArrowRight,
  Package,
  Share2,
  BookOpen,
} from 'lucide-react';
import {
  getCanonicalUrl,
  SITE_CONFIG,
  formatSeoTitle,
  getBreadcrumbJsonLd,
} from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';
import {
  getWordPressPostBySlug,
  getAllBlogSlugs,
  getWordPressPosts,
} from '@/lib/wordpress/client';
import { UnifiedBlogPost } from '@/lib/wordpress/types';

export const revalidate = 3600; // ISR: 1 hour cache with on-demand webhook revalidation

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getWordPressPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | OfficeBazzar',
      robots: { index: false, follow: false },
    };
  }

  const metaTitle = post.seo?.title || formatSeoTitle(post.title);
  const metaDescription =
    post.seo?.description || post.excerpt.replace(/\s*\[\.\.\.\]\s*$/, '').trim();
  const canonicalUrl = getCanonicalUrl(`/blog/${post.slug}`);
  const ogImageUrl = post.seo?.ogImage || post.imageUrl.startsWith('http')
    ? (post.seo?.ogImage || post.imageUrl)
    : `${SITE_CONFIG.url}${post.imageUrl}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.seo?.ogTitle || metaTitle,
      description: post.seo?.ogDescription || metaDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'article',
      publishedTime: post.publishedIsoDate,
      modifiedTime: post.modifiedIsoDate,
      authors: [post.author || 'Office Bazzar Editorial Team'],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.imageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.ogTitle || metaTitle,
      description: post.seo?.ogDescription || metaDescription,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  };
}

/**
 * Generate Article / BlogPosting schema for search engine rich results.
 */
function getUnifiedArticleJsonLd(post: UnifiedBlogPost) {
  const imageUrl = post.imageUrl.startsWith('http')
    ? post.imageUrl
    : `${SITE_CONFIG.url}${post.imageUrl}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [imageUrl],
    datePublished: post.publishedIsoDate,
    dateModified: post.modifiedIsoDate,
    author: {
      '@type': 'Organization',
      name: post.author || 'Office Bazzar Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.legalName,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}${SITE_CONFIG.logoUrl}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getCanonicalUrl(`/blog/${post.slug}`),
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getWordPressPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Fetch related articles
  const { posts: allPosts } = await getWordPressPosts({ perPage: 4 });
  const relatedPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 3);

  // Structured Data
  const articleJsonLd = getUnifiedArticleJsonLd(post);
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  // Contextual procurement internal links based on article tags / category
  const lowerCat = post.category.toLowerCase();
  const lowerSlug = post.slug.toLowerCase();

  let relatedCategoryLink = {
    name: 'Office Stationery & Desk Supplies',
    href: '/category/office-stationery',
    desc: 'Explore bulk copy paper, filing folders, ballpoint pens, and desktop essentials with GST invoices.',
  };

  if (
    lowerCat.includes('hygiene') ||
    lowerCat.includes('housekeeping') ||
    lowerSlug.includes('dustbin') ||
    lowerSlug.includes('clean')
  ) {
    relatedCategoryLink = {
      name: 'Housekeeping & Facility Supplies',
      href: '/category/housekeeping-hygiene',
      desc: 'Buy Diversey Taski chemicals, industrial dustbins, and facility sanitation tools wholesale.',
    };
  } else if (
    lowerCat.includes('print') ||
    lowerCat.includes('tech') ||
    lowerSlug.includes('toner') ||
    lowerSlug.includes('cartridge')
  ) {
    relatedCategoryLink = {
      name: 'Printers & Imaging Consumables',
      href: '/category/printers-technology',
      desc: 'Shop original HP/Canon laser toner cartridges, label tapes, and barcode ribbons.',
    };
  } else if (
    lowerCat.includes('pack') ||
    lowerSlug.includes('box') ||
    lowerSlug.includes('tape')
  ) {
    relatedCategoryLink = {
      name: 'Packaging & Warehouse Dispatch Supplies',
      href: '/category/packaging-supplies',
      desc: 'Procure heavy-duty BOPP packing tapes, corrugated boxes, and stretch film wraps.',
    };
  }

  const shareUrl = getCanonicalUrl(`/blog/${post.slug}`);

  return (
    <main className="min-h-screen bg-white py-8 sm:py-12">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <article className="w-full max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-xs text-slate-500 mb-6 font-medium"
        >
          <Link href="/" className="hover:text-[#004b87] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#004b87] transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-[280px] sm:max-w-md">
            {post.title}
          </span>
        </nav>

        {/* Header Section */}
        <header className="space-y-3 mb-6">
          <span className="inline-block px-3 py-1 bg-emerald-50 text-[#16a34a] border border-emerald-200 rounded-md text-xs font-semibold">
            {post.category}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-snug">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {post.publishedDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {post.readTime}
            </span>
            <span>•</span>
            <span>By {post.author}</span>
          </div>
        </header>

        {/* Hero Featured Image */}
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 mb-8 shadow-xs">
          <Image
            src={post.imageUrl}
            alt={post.imageAlt || post.title}
            fill
            priority
            quality={95}
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>

        {/* Article Content */}
        <div
          className="prose prose-slate max-w-none text-sm sm:text-base text-slate-700 leading-relaxed border-b border-slate-200 pb-10
            [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h2]:mb-3
            [&>h3]:text-lg sm:[&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-2
            [&>p]:leading-relaxed [&>p]:mb-4
            [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul>li]:mb-1
            [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>ol>li]:mb-1
            [&>blockquote]:border-l-4 [&>blockquote]:border-[#004b87] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-600
            [&>img]:rounded-xl [&>img]:border [&>img]:border-slate-200"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-6 mb-8">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mr-2">
              <Tag className="w-3.5 h-3.5" />
              Tags:
            </span>
            {post.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium transition-colors"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Contextual Commercial Linking: Relevant Procurement Category */}
        <section className="mb-10 p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#004b87]">
              <Package className="w-3.5 h-3.5" />
              <span>Related Procurement Supplies</span>
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              {relatedCategoryLink.name}
            </h2>
            <p className="text-xs text-slate-600 max-w-lg">
              {relatedCategoryLink.desc}
            </p>
          </div>
          <Link
            href={relatedCategoryLink.href}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#004b87] hover:bg-[#003866] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>View Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* Social Share Strip */}
        <div className="py-4 border-y border-slate-100 mb-10 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <Share2 className="w-4 h-4 text-slate-400" />
            <span>Share this guide:</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                post.title + ' ' + shareUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                shareUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                post.title
              )}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              X (Twitter)
            </a>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#004b87]" />
                More Procurement Guides
              </h2>
              <Link
                href="/blog"
                className="text-xs font-semibold text-[#16a34a] hover:text-[#15803d]"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group block p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <span className="text-[11px] font-semibold text-[#16a34a]">
                    {rel.category}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#004b87] transition-colors mt-1 line-clamp-2">
                    {rel.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {rel.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
