import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';
import {
  getWordPressPosts,
  getWordPressCategories,
} from '@/lib/wordpress/client';

export const revalidate = 600; // ISR: 10 minutes cache with on-demand webhook revalidation

export const metadata: Metadata = constructMetadata({
  title: 'Corporate Procurement & Facility Guides',
  description:
    'Read expert guides on corporate office stationery procurement, workplace housekeeping checklists, industrial hygiene supplies, and B2B facility management in India.',
  path: '/blog',
});

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function BlogListingPage({ searchParams }: BlogPageProps) {
  const resolvedParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const activeCategory = resolvedParams.category || '';
  const searchQuery = resolvedParams.search || '';

  // Fetch live published posts and available categories
  const [{ posts, totalPages, totalPosts, isFallback }, categories] =
    await Promise.all([
      getWordPressPosts({
        page: currentPage,
        perPage: 9,
        categorySlug: activeCategory || undefined,
        search: searchQuery || undefined,
      }),
      getWordPressCategories(),
    ]);

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
  ]);

  return (
    <main className="min-h-screen bg-white py-8 sm:py-12">
      <JsonLd data={breadcrumbJsonLd} />

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-xs text-slate-500 mb-6 font-medium"
        >
          <Link href="/" className="hover:text-[#004b87] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Blog</span>
          {activeCategory && (
            <>
              <span>/</span>
              <span className="text-slate-600 capitalize">
                {activeCategory.replace(/-/g, ' ')}
              </span>
            </>
          )}
        </nav>

        {/* Hero Header */}
        <header className="mb-10 pb-6 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#16a34a] mb-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100/80">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge &amp; Corporate Advisory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Latest Insights &amp; Procurement Guides
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Actionable manuals, facility checklists, product comparisons, and procurement
            strategies to streamline workplace operations and maximize GST input tax credits
            for Indian enterprises.
          </p>

          {/* Search & Category Filter Controls */}
          <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search form */}
            <form
              action="/blog"
              method="GET"
              className="relative flex-1 max-w-md"
            >
              {activeCategory && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search articles, topics, products..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
              />
            </form>

            {/* Total Results Summary */}
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-semibold text-slate-800">{totalPosts}</span>
              <span>{totalPosts === 1 ? 'Article' : 'Articles'} Published</span>
              {isFallback && (
                <span
                  title="Serving cached high-availability articles"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
                <Filter className="w-3 h-3" />
                Categories:
              </span>

              <Link
                href="/blog"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  !activeCategory
                    ? 'bg-[#004b87] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Topics
              </Link>

              {categories.map((cat) => {
                const isActive = activeCategory === cat.slug;
                return (
                  <Link
                    key={cat.slug}
                    href={`/blog?category=${encodeURIComponent(cat.slug)}${
                      searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
                    }`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#004b87] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        {/* Blog Posts Grid */}
        {posts.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              No Articles Found
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              {searchQuery || activeCategory
                ? 'No published guides matched your search criteria or category filter.'
                : 'Official procurement insights and articles will appear here when published.'}
            </p>
            {(searchQuery || activeCategory) && (
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004b87] hover:bg-[#003866] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Clear All Filters</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-slate-300 transition-all duration-300 hover:shadow-lg"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden block"
                  aria-label={post.title}
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.imageAlt || post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-[#004b87] transition-colors line-clamp-2 leading-snug">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#004b87] hover:bg-[#003866] text-white flex items-center justify-center gap-2 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <nav
            aria-label="Blog pagination"
            className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-center gap-2"
          >
            {currentPage > 1 && (
              <Link
                href={`/blog?page=${currentPage - 1}${
                  activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ''
                }${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Link>
            )}

            <span className="px-4 py-2 text-xs text-slate-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages && (
              <Link
                href={`/blog?page=${currentPage + 1}${
                  activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ''
                }${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
