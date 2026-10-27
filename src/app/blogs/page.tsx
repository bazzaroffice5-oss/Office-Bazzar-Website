import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/data/blog';
import { getCanonicalUrl, getBreadcrumbJsonLd, SITE_CONFIG } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Latest Insights & Corporate Procurement Guides | OfficeBazzar India',
  description:
    'Expert procurement insights, workplace housekeeping guidelines, industrial dustbin sizing, Diversey Taski chemical manuals, and GST input tax credit tips for commercial offices.',
  alternates: {
    canonical: getCanonicalUrl('/blogs'),
  },
  openGraph: {
    title: 'Latest Insights & Corporate Procurement Guides | OfficeBazzar',
    description:
      'Expert advice on corporate office stationery, commercial cleaning chemicals, heavy-duty paper shredders, and GST input tax credit procurement.',
    url: getCanonicalUrl('/blogs'),
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Latest Insights & Procurement Guides | OfficeBazzar',
    description:
      'Expert advice on corporate office stationery, commercial cleaning chemicals, and GST procurement.',
  },
};

export default function BlogsPage() {
  const displayedBlogs = [...BLOG_POSTS]
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 2);

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Blogs', url: '/blogs' },
  ]);

  return (
    <main className="min-h-screen bg-white py-8 sm:py-12">
      <JsonLd data={breadcrumbJsonLd} />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500 mb-6 font-medium">
          <Link href="/" className="hover:text-[#004b87] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Blogs</span>
        </nav>

        {/* Heading */}
        <header className="mb-10 pb-6 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#16a34a] mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge &amp; Corporate Advisory
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Latest Insights &amp; Procurement Guides
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Actionable guides, hygiene manuals, and procurement insights to streamline facility management and maximize GST tax credits for Indian enterprises.
          </p>
        </header>

        {/* Blog Posts Grid: Exactly 2 featured articles displayed */}
        {displayedBlogs.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">No Articles Published Yet</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Official procurement insights and articles will appear here when published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {displayedBlogs.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-slate-300 transition-all duration-300 hover:shadow-lg"
              >
                <Link
                  href={`/blogs/${post.slug}`}
                  className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden block"
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 shadow-2xs">
                    {post.category}
                  </div>
                </Link>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {post.publishedDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-[#004b87] transition-colors line-clamp-2 leading-snug">
                      <Link href={`/blogs/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100">
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#004b87] hover:bg-[#003866] text-white flex items-center justify-center gap-2 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
