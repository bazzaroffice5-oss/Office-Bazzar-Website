'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const TRENDING_CATEGORIES = [
  {
    id: 'office-stationery',
    name: 'Office Stationery',
    tagline: 'Registers, box files, staplers, whiteboards & desk essentials',
    itemCount: '22 Products',
    href: '/category/office-stationery',
    image: '/images/categories/office-supplies-stationery.jpg',
    badge: 'Desk Essentials',
    badgeBg: 'bg-blue-50/80',
    badgeText: 'text-[#004b87]',
    badgeBorder: 'border-blue-200/60',
    hoverBorder: 'hover:border-[#004b87]/40',
  },
  {
    id: 'housekeeping-hygiene',
    name: 'Housekeeping & Hygiene',
    tagline: 'Taski chemicals, wringer trolleys, dustbins & washroom care',
    itemCount: '44 Products',
    href: '/category/housekeeping-hygiene',
    image: '/images/categories/housekeeping-facility.jpg',
    badge: 'Facility Care',
    badgeBg: 'bg-emerald-50/80',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200/60',
    hoverBorder: 'hover:border-emerald-500/40',
  },
  {
    id: 'printers-technology',
    name: 'Printers & Technology',
    tagline: 'Laser toners, barcode printers, consumables & shredders',
    itemCount: '26 Products',
    href: '/category/printers-technology',
    image: '/images/categories/printer-supplies-toner.jpg',
    badge: 'IT & Hardware',
    badgeBg: 'bg-sky-50/80',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200/60',
    hoverBorder: 'hover:border-sky-500/40',
  },
  {
    id: 'packaging-supplies',
    name: 'Packaging Supplies',
    tagline: 'BOPP brown cello tapes, bubble wraps & protective packaging',
    itemCount: '9 Products',
    href: '/category/packaging-supplies',
    image: '/images/categories/packaging-materials.jpg',
    badge: 'Dispatch & Store',
    badgeBg: 'bg-amber-50/80',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200/60',
    hoverBorder: 'hover:border-amber-500/40',
  },
];

export default function TrendingCategoriesSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative w-full py-14 sm:py-18 bg-white overflow-hidden border-b border-slate-100">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading with Refined Corporate Hierarchy */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-700 text-xs font-semibold mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Corporate Workplace Sourcing</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Trending Categories
          </h2>

          <div className="w-12 h-1 bg-gradient-to-r from-[#004b87] to-[#16a34a] rounded-full mx-auto mt-3.5 mb-2.5" />

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            Discover our most requested corporate workplace supplies, pre-approved for immediate delivery.
          </p>
        </div>

        {/* 4 Category Cards in 4-column Equal-Width Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {TRENDING_CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: 'easeOut' }}
              className="h-full"
            >
              <Link
                href={cat.href}
                className={`group relative flex flex-col h-full bg-white rounded-2xl p-5 border border-slate-200/90 ${cat.hoverBorder} transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2`}
              >
                {/* High-Resolution Product Preview Image Container */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-50/80 border border-slate-100 flex items-center justify-center p-3 mb-4 transition-colors duration-300 group-hover:bg-slate-100/60">
                  <Image
                    src={cat.image}
                    alt={`${cat.name} supplies wholesale catalog`}
                    fill
                    className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    priority={idx < 2}
                  />
                </div>

                {/* Card Meta Content with Aligned Baselines */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Count & Category Pill Tag */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-slate-500">
                        {cat.itemCount}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}
                      >
                        {cat.badge}
                      </span>
                    </div>

                    {/* Category Title */}
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-[#004b87] transition-colors tracking-tight line-clamp-1">
                      {cat.name}
                    </h3>

                    {/* Short Descriptive Subtitle */}
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[36px] font-normal">
                      {cat.tagline}
                    </p>
                  </div>

                  {/* Clearly Aligned "View Products" Link with Right Arrow */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#004b87] group-hover:text-[#16a34a] transition-colors">
                    <span>View Products</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#004b87] group-hover:text-white flex items-center justify-center transition-all duration-200">
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
