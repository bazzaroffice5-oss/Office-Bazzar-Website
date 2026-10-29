import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowLeft, ChevronRight } from 'lucide-react';
import { Category, Subcategory } from '@/types';

interface CategorySubcategoryGridProps {
  category: Category;
  subcategories: Subcategory[];
  totalProducts: number;
  basePath?: string;
  backHref?: string;
}

export default function CategorySubcategoryGrid({
  category,
  subcategories,
  totalProducts,
  basePath = `/category/${category.slug}`,
  backHref = '/categories',
}: CategorySubcategoryGridProps) {
  const separator = basePath.includes('?') ? '&' : '?';

  // Construct card list starting with "All Products" card, followed by real catalogue subcategories
  const cards = [
    {
      id: 'all-products',
      name: 'All Products',
      href: `${basePath}${separator}view=products`,
      imageUrl: category.imageUrl || '/images/categories/office-supplies-stationery.jpg',
      itemCount: totalProducts,
    },
    ...subcategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      href: `${basePath}${separator}sub=${sub.slug}`,
      imageUrl: sub.imageUrl || category.imageUrl || '/images/categories/office-supplies-stationery.jpg',
      itemCount: sub.itemCount || 0,
    })),
  ];

  return (
    <main className="min-h-screen bg-white py-6 sm:py-10">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mb-4">
          <Link href="/" className="hover:text-[#004b87] transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href="/categories" className="hover:text-[#004b87] transition-colors font-medium">
            All Categories
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900 truncate">
            {category.name}
          </span>
        </nav>

        {/* Back to All Categories Action */}
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#004b87] hover:text-[#003866] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to All Categories</span>
          </Link>
        </div>

        {/* Centered Main Category Heading matching Reference */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {category.name}
          </h1>
          <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3 rounded-full" />
          {category.description && (
            <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-2xl mx-auto leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* 4-Column Responsive Subcategory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group relative block aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c]"
            >
              {/* Authentic High-Resolution Photography with Restrained Hover Zoom */}
              <Image
                src={card.imageUrl}
                alt={`${card.name} catalogue`}
                fill
                priority
                className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Product-count badge with small package icon at top-right (only when itemCount > 0) */}
              {card.itemCount > 0 && (
                <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm border border-slate-200/60">
                  <Package className="w-3.5 h-3.5 text-slate-600" />
                  <span>{card.itemCount}</span>
                </div>
              )}

              {/* Dark Gradient Overlay for Maximum Title Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-40% to-transparent pointer-events-none" />

              {/* Subcategory Title Overlaid Near Bottom */}
              <div className="absolute bottom-4 left-3 right-3 sm:bottom-5 sm:left-4 sm:right-4 z-10 text-center">
                <h2 className="text-white font-bold text-base sm:text-lg leading-snug drop-shadow-sm group-hover:text-amber-200 transition-colors">
                  {card.name}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
