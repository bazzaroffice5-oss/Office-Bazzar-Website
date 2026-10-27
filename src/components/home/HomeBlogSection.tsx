'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/data/blog';

export default function HomeBlogSection() {
  const posts = [...BLOG_POSTS]
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 2);

  return (
    <section className="w-full py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="w-full max-w-[840px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Latest Insights
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tips, guides and insights to optimise your workplace.
            </p>
          </div>

          <Link
            href="/blogs"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors group"
          >
            <span>View All Blogs</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 2 Proportional, Compact Blog Cards matching Category Card Proportions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full"
            >
              {/* Scaled Image Container matching Category Card proportions */}
              <Link
                href={`/blogs/${post.slug}`}
                className="relative w-full h-40 sm:h-44 bg-slate-100 overflow-hidden block flex-shrink-0"
                aria-label={post.title}
              >
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 420px"
                />
                <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 shadow-2xs">
                  {post.category}
                </div>
              </Link>

              {/* Card Body with strict flex alignment */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Date & Read Time */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2 h-4">
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

                  {/* Title */}
                  <h3 className="text-sm sm:text-[14.5px] font-bold text-slate-900 group-hover:text-[#004b87] transition-colors line-clamp-2 leading-snug min-h-[40px] flex items-start">
                    <Link href={`/blogs/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>

                  {/* Description Excerpt */}
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed min-h-[34px]">
                    {post.excerpt}
                  </p>
                </div>

                {/* Navy Blue "Read More" Button */}
                <div className="mt-4 pt-3.5 border-t border-slate-100">
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#004b87] hover:bg-[#003866] active:bg-[#002f57] border border-[#004b87] text-white flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold shadow-xs transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2"
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
