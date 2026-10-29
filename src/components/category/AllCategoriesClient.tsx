'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  Package,
  ArrowRight,
  ShieldCheck,
  Truck,
  Headphones,
  Award,
  Layers,
} from 'lucide-react';
import { Category, Subcategory } from '@/types';

interface AllCategoriesClientProps {
  categories: Category[];
  subcategories?: Subcategory[];
  productCounts: Record<string, number>;
  baseRoute?: string;
}

export default function AllCategoriesClient({
  categories,
  subcategories = [],
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
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
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

      {/* ============================================================== */}
      {/* SECTION 1: 4 CORE PROCUREMENT DIVISIONS                        */}
      {/* ============================================================== */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          All Categories
        </h1>
        <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3 rounded-full" />
        <p className="text-xs sm:text-sm text-slate-600 mt-3 font-normal max-w-xl mx-auto leading-relaxed">
          Explore our 4 core workplace procurement divisions: Office Stationery, Housekeeping &amp; Hygiene, Printers &amp; Technology, and Packaging Supplies.
        </p>
      </div>

      {/* 4 Main Category Cards in 4-Column Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-16">
        {categories.map((cat) => {
          const count = productCounts[cat.id] ?? productCounts[cat.slug] ?? 0;
          const imageUrl = cat.imageUrl || '/images/categories/office-supplies-stationery.jpg';
          const hasProducts = count > 0;

          return (
            <Link
              key={cat.id}
              href={`${categoryBase}/${cat.slug}`}
              className="group relative flex flex-col w-full aspect-[4/3] sm:aspect-[4/3.4] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-slate-100 border border-slate-200/90 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2"
            >
              {/* Category Image with Smooth Hover Zoom */}
              <Image
                src={imageUrl}
                alt={`${cat.name} Category`}
                fill
                priority
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Subtle Overall Gradient/Tint on Hover */}
              <div className="absolute inset-0 bg-slate-900/15 group-hover:bg-slate-900/25 transition-colors duration-300" />

              {/* Product Count Badge at Top-Right */}
              <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold text-slate-800 shadow-sm border border-slate-200/60 pointer-events-none">
                <Package className={`w-3.5 h-3.5 ${hasProducts ? 'text-[#004b87]' : 'text-amber-600'}`} />
                <span>{hasProducts ? `${count} Products` : 'Available on RFQ'}</span>
              </div>

              {/* Bottom Gradient Overlay with Category Name & Description */}
              <div className="absolute inset-x-0 bottom-0 z-10 pt-16 pb-4 sm:pb-5 px-4 sm:px-5 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight drop-shadow-sm group-hover:text-blue-100 transition-colors leading-snug">
                    {cat.name}
                  </h2>
                  <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                {cat.description && (
                  <p className="text-xs text-slate-200/90 line-clamp-2 mt-1 font-normal drop-shadow-sm leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: EXPLORE ALL 9 CATEGORIES                            */}
      {/* ============================================================== */}
      {subcategories.length > 0 && (
        <section aria-labelledby="explore-all-9-heading" className="pt-6 border-t border-slate-200/80">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#004b87] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Specialized Workplace Catalog</span>
            </div>
            <h2
              id="explore-all-9-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight"
            >
              Explore All 9 Categories
            </h2>
            <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3 rounded-full" />
            <p className="text-xs sm:text-sm text-slate-600 mt-3 font-normal max-w-xl mx-auto leading-relaxed">
              Direct access to our complete workplace supplies catalog across all 9 specialized product categories.
            </p>
          </div>

          {/* 9 Subcategory Cards in 3-Column Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mb-16">
            {subcategories.map((sub) => {
              const count = productCounts[sub.id] ?? productCounts[sub.slug] ?? sub.itemCount ?? 0;
              const imageUrl = sub.imageUrl || '/images/categories/office-supplies-stationery.jpg';
              const hasProducts = count > 0;
              const parentSlug = sub.categoryId || 'office-stationery';
              const subHref = `${categoryBase}/${parentSlug}?sub=${sub.slug}`;

              return (
                <Link
                  key={sub.id}
                  href={subHref}
                  className="group relative flex flex-col w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-slate-100 border border-slate-200/90 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2"
                >
                  {/* Category Image with Smooth Hover Zoom */}
                  <Image
                    src={imageUrl}
                    alt={`${sub.name} Category`}
                    fill
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />

                  {/* Subtle Overall Gradient/Tint on Hover */}
                  <div className="absolute inset-0 bg-slate-900/15 group-hover:bg-slate-900/25 transition-colors duration-300" />

                  {/* Product Count Badge at Top-Right */}
                  <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold text-slate-800 shadow-sm border border-slate-200/60 pointer-events-none">
                    <Package className={`w-3.5 h-3.5 ${hasProducts ? 'text-[#004b87]' : 'text-amber-600'}`} />
                    <span>{hasProducts ? `${count} Products` : 'Available on RFQ'}</span>
                  </div>

                  {/* Bottom Gradient Overlay with Name & Description */}
                  <div className="absolute inset-x-0 bottom-0 z-10 pt-16 pb-4 sm:pb-5 px-4 sm:px-5 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight drop-shadow-sm group-hover:text-blue-100 transition-colors leading-snug">
                        {sub.name}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                    {sub.description && (
                      <p className="text-xs text-slate-200/90 line-clamp-2 mt-1 font-normal drop-shadow-sm leading-relaxed">
                        {sub.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: CORPORATE PROCUREMENT TRUST HIGHLIGHTS              */}
      {/* ============================================================== */}
      <div className="mt-8 pt-8 border-t border-slate-200/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004b87] mx-auto flex items-center justify-center mb-1">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">100% Genuine Supplies</h3>
            <p className="text-[11px] text-slate-500">Authorized brand distributors</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16a34a] mx-auto flex items-center justify-center mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">100% GST Tax Credit</h3>
            <p className="text-[11px] text-slate-500">Valid GST B2B invoice with ITC</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] mx-auto flex items-center justify-center mb-1">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Doorstep Metro Fleet</h3>
            <p className="text-[11px] text-slate-500">24-48 hr corporate dispatch</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-1">
              <Headphones className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">ARC &amp; Bulk Support</h3>
            <p className="text-[11px] text-slate-500">Custom pricing for institutions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
