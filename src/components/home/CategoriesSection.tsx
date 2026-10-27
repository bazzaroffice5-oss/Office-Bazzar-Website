'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '@/lib/data/catalog';
import { Category } from '@/types';

export default function CategoriesSection({
  categories = CATEGORIES,
}: {
  categories?: Category[];
}) {
  const displayCategories = categories && categories.length > 0 ? categories : CATEGORIES;
  return (
    <section className="w-full py-14 sm:py-18 bg-slate-50/70 border-b border-slate-100">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Workplace Procurement Categories
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl font-normal">
              From daily desk essentials to heavy-duty facility maintenance, source everything directly at pre-negotiated corporate rates.
            </p>
          </div>

          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#004b87] hover:text-[#003866] transition-colors"
          >
            <span>Explore All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Category Cards in 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {displayCategories.map((cat) => (
            <Link
              key={cat.id}
              href="/categories"
              className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2"
            >
              {/* Category Image Banner with Consistent Sizing and Smooth Hover */}
              <div className="relative w-full h-44 sm:h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                <Image
                  src={cat.imageUrl || '/images/categories/office-supplies-stationery.jpg'}
                  alt={`${cat.name} wholesale catalog`}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />
              </div>

              {/* Category Content Body */}
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-[#004b87] transition-colors tracking-tight">
                    {cat.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                    {cat.description || 'Corporate bulk supply and GST invoicing available.'}
                  </p>
                </div>

                {/* View Products Navy Brand Button */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  <div className="w-full py-2.5 px-4 rounded-xl bg-[#004b87] group-hover:bg-[#003866] active:bg-[#002f57] border border-[#004b87] text-white flex items-center justify-center gap-2 text-sm font-semibold shadow-xs transition-colors duration-200">
                    <span>View Products</span>
                    <ArrowRight className="w-4 h-4 text-white transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
