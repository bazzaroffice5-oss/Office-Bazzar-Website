'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import { Category } from '@/types';

interface AllCategoriesClientProps {
  categories: Category[];
  productCounts: Record<string, number>;
  baseRoute?: string;
}

export default function AllCategoriesClient({
  categories,
  productCounts,
  baseRoute,
}: AllCategoriesClientProps) {
  const pathname = usePathname();
  const categoryBase =
    baseRoute ||
    (pathname?.startsWith('/shop/categories')
      ? '/shop/categories'
      : pathname?.startsWith('/categories')
      ? '/categories'
      : '/category');
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Breadcrumb Navigation: Home → All Categories */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-slate-500 mb-6"
      >
        <Link href="/" className="hover:text-[#004b87] transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-semibold text-slate-900">All Categories</span>
      </nav>

      {/* Page Header: Clean, centered "All Categories" heading */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          All Categories
        </h1>
        <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3 rounded-full" />
      </div>

      {/* 4 Category Cards in 4-Column Responsive Grid with balanced sizing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
        {categories.map((cat) => {
          const count = productCounts[cat.id] || productCounts[cat.slug] || cat.itemCount || 0;
          const imageUrl = cat.imageUrl || '/images/categories/office-supplies-stationery.jpg';

          return (
            <Link
              key={cat.id}
              href={`${categoryBase}/${cat.slug}`}
              className="group relative block w-full aspect-[4/3] sm:aspect-[4/3.4] lg:aspect-[4/3.4] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2"
            >
              {/* Category Image with Smooth Hover Zoom */}
              <Image
                src={imageUrl}
                alt={cat.name}
                fill
                priority
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Subtle Overall Gradient/Tint on Hover */}
              <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors duration-300" />

              {/* Product Count Badge at Top-Right */}
              <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold text-slate-800 shadow-sm border border-slate-200/60 pointer-events-none">
                <Package className="w-3.5 h-3.5 text-[#004b87]" />
                <span>{count} Products</span>
              </div>

              {/* Bottom Gradient Overlay with Category Name (No buttons) */}
              <div className="absolute inset-x-0 bottom-0 z-10 pt-16 pb-4 sm:pb-5 px-4 sm:px-5 bg-gradient-to-t from-black/80 via-black/35 to-transparent">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm group-hover:text-blue-100 transition-colors leading-snug">
                  {cat.name}
                </h2>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

