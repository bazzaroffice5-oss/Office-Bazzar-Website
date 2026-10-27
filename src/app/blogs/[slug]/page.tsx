import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Tag, ArrowRight, Package } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/data/blog';
import { getArticleJsonLd, getBreadcrumbJsonLd, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: 'Article Not Found | OfficeBazzar',
      robots: { index: false, follow: false },
    };
  }

  const metaTitle = `${post.title} | OfficeBazzar Insights`;
  const metaDescription = post.excerpt;
  const canonicalUrl = getCanonicalUrl(`/blogs/${post.slug}`);
  const publishedTime = new Date(post.publishedDate).toISOString();

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'article',
      publishedTime,
      authors: [post.author || 'Office Bazzar Team'],
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [post.imageUrl],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  // Structured Data (BlogPosting & Breadcrumbs)
  const articleJsonLd = getArticleJsonLd(post);
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Blogs', url: '/blogs' },
    { name: post.title, url: `/blogs/${post.slug}` },
  ]);

  // Contextual product & category internal links based on article tags/category
  const isHousekeeping =
    post.category.toLowerCase().includes('hygiene') ||
    post.category.toLowerCase().includes('housekeeping') ||
    post.slug.includes('dustbin');

  const relatedCategoryLink = isHousekeeping
    ? {
        name: 'Housekeeping & Facility Supplies',
        href: '/category/housekeeping-facility-supplies',
        desc: 'Buy Diversey Taski chemicals, industrial dustbins, and housekeeping tools wholesale.',
      }
    : {
        name: 'Office Stationery & Desk Supplies',
        href: '/category/office-supplies-stationery',
        desc: 'Explore bulk copy paper, filing folders, ballpoint pens, and desktop essentials.',
      };

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
          <Link href="/blogs" className="hover:text-[#004b87] transition-colors">
            Blogs
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-[280px] sm:max-w-md">
            {post.title}
          </span>
        </nav>

        {/* Category & Title */}
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
            alt={post.title}
            fill
            priority
            quality={95}
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>

        {/* Article Body */}
        <div className="prose prose-slate max-w-none space-y-5 text-sm sm:text-base text-slate-700 leading-relaxed border-b border-slate-200 pb-10">
          {post.content.map((paragraph, index) => (
            <p key={index} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Tags */}
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

        {/* Contextual Commercial Linking: Relevant Procurement Category */}
        <section className="mb-10 p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#004b87]">
              <Package className="w-3.5 h-3.5" />
              Related Procurement Supplies
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              {relatedCategoryLink.name}
            </h3>
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

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="pt-8 border-t border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              More Procurement Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blogs/${rel.slug}`}
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
