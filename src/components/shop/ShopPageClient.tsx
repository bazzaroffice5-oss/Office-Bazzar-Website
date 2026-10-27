'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  ArrowRight,
  Store,
  ShoppingBasket,
} from 'lucide-react';
import { Category } from '@/types';

interface CategoryMetadata {
  productCount: number;
  brandCount: number;
}

interface ShopPageClientProps {
  categories: Category[];
  categoryStats: Record<string, CategoryMetadata>;
}

export default function ShopPageClient({
  categories,
  categoryStats,
}: ShopPageClientProps) {
  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Breadcrumb Navigation: Home → Shop */}
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-slate-500 mb-6"
        >
          <Link href="/" className="hover:text-[#004b87] transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900">Shop</span>
        </nav>
      </div>

      {/* Hero / Header Section matching Procura Business Shop */}
      <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Categories We Offer
          </h1>
          <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3.5 rounded-full" />
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
            We specialize in delivering workplace procurement solutions with pre-negotiated corporate rates and 100% GST tax credit.
          </p>
        </div>
      </section>

      {/* 4 Category Cards with "View Products" button (Procura Step 1 Structure) */}
      <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const stats = categoryStats[cat.id] || categoryStats[cat.slug] || {
              productCount: cat.itemCount || 0,
              brandCount: 4,
            };
            const imageUrl = cat.imageUrl || '/images/categories/office-supplies-stationery.jpg';

            return (
              <div
                key={cat.id}
                className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image & Overlapping Metadata Badge */}
                <div>
                  <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] bg-slate-100 overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={cat.name}
                      fill
                      priority
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Procura-style Overlapping Orange Metadata Badge */}
                  <div className="mx-4 -mt-4 relative z-10 flex items-center justify-center gap-3 bg-[#ea580c] py-2 px-3 rounded-lg text-xs font-bold text-white shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      <span>{stats.brandCount}+ Brands</span>
                    </div>
                    <div className="h-3 w-[1px] bg-white/40" />
                    <div className="flex items-center gap-1.5">
                      <ShoppingBasket className="w-3.5 h-3.5" />
                      <span>{stats.productCount}+ SKUs</span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="px-5 pt-4 pb-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#004b87] transition-colors leading-snug">
                      {cat.name}
                    </h2>
                    {cat.description && (
                      <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed font-normal">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* View Products Action Button -> Navigates to All Categories (/shop/categories) */}
                <div className="p-5 pt-3">
                  <Link
                    href="/shop/categories"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#004b87] hover:bg-[#003866] active:bg-[#002f57] text-white flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <span>View Products</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
