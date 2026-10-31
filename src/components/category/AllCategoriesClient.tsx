'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Truck,
  Headphones,
  Award,
} from 'lucide-react';
import { Subcategory, Category } from '@/types';

interface AllCategoriesClientProps {
  categories: (Subcategory | Category)[];
  productCounts?: Record<string, number>;
  baseRoute?: string;
}

export default function AllCategoriesClient({
  categories,
  baseRoute,
}: AllCategoriesClientProps) {
  const pathname = usePathname();
  const categoryBase =
    baseRoute ||
    (pathname?.startsWith('/shop/categories') ? '/shop/categories' : '/category');

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

      {/* Page Header: Clean, centered "All Categories" heading */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          All Categories
        </h1>
        <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3 rounded-full" />
        <p className="text-xs sm:text-sm text-slate-600 mt-3 font-normal max-w-xl mx-auto leading-relaxed">
          Explore our complete workplace catalogue across specialized procurement categories for enterprises, institutions, and facility managers across India.
        </p>
      </div>

      {/* 10 Category Cards in Responsive Grid: Desktop 4 cols, Medium screens 3 cols, Tablets 2 cols, Mobile 1 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 mb-14">
        {categories.map((cat, index) => {
          const isAllProducts = cat.id === 'all-products' || cat.slug === 'all-products';
          const parentSlug =
            'categoryId' in cat && cat.categoryId && cat.categoryId !== 'all'
              ? cat.categoryId
              : 'office-stationery';
          const href = isAllProducts
            ? '/products'
            : `${categoryBase}/${parentSlug}?sub=${cat.slug}`;
          const imageUrl = cat.imageUrl || '/images/categories/office-supplies-stationery.jpg';

          return (
            <Link
              key={cat.id}
              href={href}
              className="group relative flex flex-col w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-slate-100 border border-slate-200/90 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2"
            >
              {/* Category Image with Smooth Hover Zoom */}
              <Image
                src={imageUrl}
                alt={`${cat.name} Category`}
                fill
                priority={index < 4}
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Subtle Overall Gradient/Tint on Hover */}
              <div className="absolute inset-0 bg-slate-900/15 group-hover:bg-slate-900/25 transition-colors duration-300" />

              {/* Bottom Gradient Overlay with Category Name & Description */}
              <div className="absolute inset-x-0 bottom-0 z-10 pt-16 pb-4 sm:pb-5 px-4 sm:px-5 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm group-hover:text-blue-100 transition-colors leading-snug">
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

      {/* Corporate Procurement Trust Highlights */}
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
        {/* B2B Procurement Guide Section */}
        <section className="mt-12 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Consolidated B2B Workplace Procurement Across India
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Office Bazzar simplifies corporate purchasing by consolidating four core workplace supply chains—<strong>Office Stationery</strong>, <strong>Housekeeping &amp; Hygiene</strong>, <strong>Printers &amp; Technology</strong>, and <strong>Packaging Supplies</strong>—under a single GST-compliant vendor. Whether your organization is stocking a corporate headquarters in Chennai or managing multi-branch offices in Bangalore, Mumbai, and Hyderabad, our catalog covers 100+ verified SKUs from trusted brands including JK Paper, Kangaro, Taski Diversey, Hi-Clean, 3M, HP, Canon, Epson, Brother, and Roots.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Corporate administration teams, facility managers, IT parks, hospitals, and educational institutions can add required items directly to their quotation cart or apply for an Annual Rate Contract (ARC) with scheduled doorstep delivery and 100% Input Tax Credit (ITC) documentation.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold">
            <Link href="/bulk-orders" className="text-[#004b87] hover:underline">
              Explore Bulk Orders &amp; Rate Contracts →
            </Link>
            <Link href="/request-quote" className="text-[#16a34a] hover:underline">
              Submit a Custom RFQ →
            </Link>
            <Link href="/faq" className="text-slate-600 hover:text-slate-900 hover:underline">
              Read Corporate Procurement FAQ →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
