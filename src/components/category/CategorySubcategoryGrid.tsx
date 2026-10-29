import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Category, Subcategory } from '@/types';

interface CategorySubcategoryGridProps {
  category: Category;
  subcategories: Subcategory[];
  totalProducts?: number;
  basePath?: string;
  backHref?: string;
}

export default function CategorySubcategoryGrid({
  category,
  subcategories,
  basePath = `/category/${category.slug}`,
}: CategorySubcategoryGridProps) {
  const separator = basePath.includes('?') ? '&' : '?';

  // Construct card list starting with "All Products" card, followed by the subcategories
  const cards = [
    {
      id: 'all-products',
      name: 'All Products',
      href: '/products',
      imageUrl: category.imageUrl || '/images/categories/office-supplies-stationery.jpg',
      description: 'Browse our complete workplace catalogue across all 9 categories with direct wholesale pricing and GST input credit.',
    },
    ...subcategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      href: `${basePath}${separator}sub=${sub.slug}`,
      imageUrl: sub.imageUrl || category.imageUrl || '/images/categories/office-supplies-stationery.jpg',
      description: sub.description,
    })),
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-6 sm:py-10">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#004b87] transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900 truncate">
            {category.name}
          </span>
        </nav>

        {/* Centered Main Category Heading matching Reference */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {category.name}
          </h1>
          <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3 rounded-full" />
          {category.description && (
            <p className="text-xs sm:text-sm text-slate-600 mt-3 font-normal max-w-xl mx-auto leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* 10 Category Cards in Responsive Grid: Desktop 4 cols, Medium screens 3 cols, Tablets 2 cols, Mobile 1 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 mb-14">
          {cards.map((card, index) => (
            <Link
              key={card.id}
              href={card.href}
              className="group relative flex flex-col w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-slate-100 border border-slate-200/90 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2"
            >
              {/* Category Image with Smooth Hover Zoom */}
              <Image
                src={card.imageUrl}
                alt={`${card.name} Category`}
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
                    {card.name}
                  </h2>
                  <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                {card.description && (
                  <p className="text-xs text-slate-200/90 line-clamp-2 mt-1 font-normal drop-shadow-sm leading-relaxed">
                    {card.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
