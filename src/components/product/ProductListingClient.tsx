'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Package,
} from 'lucide-react';
import ProductCard from './ProductCard';
import { Product, Category, Brand } from '@/types';

interface ProductListingClientProps {
  initialProducts: Product[];
  categories: Category[];
  currentCategory?: Category | null;
  brands?: Brand[];
  initialCategorySlug?: string;
  initialSubcategorySlug?: string;
  initialBrandSlug?: string;
  initialQuery?: string;
  showAllCategoriesHeader?: boolean;
}

export default function ProductListingClient({
  initialProducts,
  categories,
  currentCategory,
  initialCategorySlug,
}: ProductListingClientProps) {
  // Active Category State
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(
    initialCategorySlug || currentCategory?.slug || ''
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 48; // Generous page size so all products in each of the 4 categories fit comfortably

  // Dynamic category product counts based on actual active products
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialProducts
      .filter((p) => p.isActive)
      .forEach((p) => {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      });
    return counts;
  }, [initialProducts]);

  const totalProductsCount = useMemo(() => {
    return initialProducts.filter((p) => p.isActive).length;
  }, [initialProducts]);

  // Active Category Object
  const activeCategory = useMemo(() => {
    if (selectedCategorySlug && selectedCategorySlug !== 'all') {
      return (
        categories.find(
          (c) => c.slug === selectedCategorySlug || c.id === selectedCategorySlug
        ) || null
      );
    }
    return null;
  }, [selectedCategorySlug, categories]);

  // Category Switcher with URL synchronization
  const handleSelectCategory = (slug: string) => {
    const nextSlug = slug === 'all' ? '' : slug;
    setSelectedCategorySlug(nextSlug);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      const url = nextSlug ? `/categories?category=${nextSlug}` : '/categories';
      window.history.pushState({}, '', url);
      if (nextSlug) {
        setTimeout(() => {
          const el = document.getElementById('category-products');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  };

  // Sync state if initialCategorySlug prop changes
  useEffect(() => {
    if (initialCategorySlug !== undefined) {
      setSelectedCategorySlug(initialCategorySlug);
      setCurrentPage(1);
    }
  }, [initialCategorySlug]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category') || '';
        setSelectedCategorySlug(cat);
        setCurrentPage(1);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Products scoped to selected category or across all 4 categories
  const scopedProducts = useMemo(() => {
    const activeList = initialProducts.filter((p) => p.isActive);
    if (activeCategory) {
      return activeList.filter(
        (p) =>
          p.categoryId === activeCategory.id ||
          p.categoryName.toLowerCase() === activeCategory.name.toLowerCase()
      );
    }
    return activeList;
  }, [initialProducts, activeCategory]);

  const totalItems = scopedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = scopedProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-[#004b87] transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <button
          type="button"
          onClick={() => handleSelectCategory('')}
          className={`hover:text-[#004b87] transition-colors font-medium cursor-pointer ${
            !selectedCategorySlug ? 'text-slate-900 font-bold' : ''
          }`}
        >
          All Categories
        </button>
        {activeCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-[#004b87]">
              {activeCategory.name}
            </span>
          </>
        )}
      </nav>

      {/* 1. Category Overview at the Top: Centered Header & Quick Filter Pills */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          All Categories
        </h1>
        <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3 rounded-full" />
        <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">
          Wholesale corporate procurement across our 4 core workplace categories with direct wholesale pricing and GST input invoicing.
        </p>

        {/* Quick Filter Pill Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-6">
          <button
            type="button"
            onClick={() => handleSelectCategory('')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              !selectedCategorySlug
                ? 'bg-[#004b87] text-white shadow-sm ring-2 ring-[#004b87]/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-[#004b87] hover:text-[#004b87]'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                !selectedCategorySlug ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {totalProductsCount}
            </span>
          </button>
          {categories.map((cat) => {
            const isCatActive = selectedCategorySlug === cat.slug || selectedCategorySlug === cat.id;
            const count = categoryCounts[cat.id] || cat.itemCount || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(isCatActive ? '' : cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCatActive
                    ? 'bg-[#004b87] text-white shadow-sm ring-2 ring-[#004b87]/30'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-[#004b87] hover:text-[#004b87]'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isCatActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Category Cards in 4-Column Responsive Grid with Clear “View Products” Actions */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 ${activeCategory ? 'mb-10 sm:mb-12' : 'mb-2'}`}>
        {categories.map((cat) => {
          const isCatActive = selectedCategorySlug === cat.slug || selectedCategorySlug === cat.id;
          const count = categoryCounts[cat.id] || cat.itemCount || 0;

          return (
            <div
              key={cat.id}
              className={`group flex flex-col bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
                isCatActive
                  ? 'border-[#004b87] ring-3 ring-[#004b87]/30 shadow-md -translate-y-1'
                  : 'border-slate-200/90 shadow-2xs hover:-translate-y-1 hover:border-slate-300'
              }`}
            >
              {/* Category Image Banner with Consistent Aspect Ratio */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] bg-slate-100 overflow-hidden">
                <Image
                  src={cat.imageUrl || '/images/categories/office-supplies-stationery.jpg'}
                  alt={`${cat.name} wholesale catalog`}
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Product-count badge at top-right */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-slate-800 shadow-sm border border-slate-200/60">
                  <Package className="w-3.5 h-3.5 text-[#004b87]" />
                  <span>{count} Products</span>
                </div>

                {/* Active indicator badge at top-left */}
                {isCatActive && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-[#004b87] text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md">
                    <span>Selected</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-[#004b87] transition-colors tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {cat.description || 'Corporate bulk supply and GST invoicing available.'}
                  </p>
                </div>

                {/* Clear “View Products” Action Button */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory(isCatActive ? '' : cat.slug)}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isCatActive
                      ? 'bg-[#16a34a] hover:bg-[#15803d] text-white'
                      : 'bg-[#004b87] hover:bg-[#003866] active:bg-[#002f57] text-white'
                  }`}
                >
                  <span>{isCatActive ? 'Viewing Products ✓' : 'View Products'}</span>
                  <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${isCatActive ? '' : 'group-hover:translate-x-1'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Category Product Listing - Rendered ONLY when a category is selected */}
      {activeCategory && (
        <section id="category-products" className="w-full pt-6 sm:pt-8 border-t border-slate-200">
          {/* Product Listing Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {activeCategory.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Displaying all {totalItems} products in {activeCategory.name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleSelectCategory('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#004b87] hover:text-[#003866] bg-blue-50/80 hover:bg-blue-100/80 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to All Categories</span>
              </button>
              <span className="text-xs sm:text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                <strong className="text-[#004b87] font-semibold">{totalItems}</strong> products
              </span>
            </div>
          </div>

          {/* Full-width Responsive Product Cards Grid */}
          {paginatedProducts.length === 0 ? (
            <div className="w-full bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#004b87] mx-auto flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No products available</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                There are currently no products available in this category.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCategory('')}
                className="inline-flex items-center gap-2 bg-[#004b87] hover:bg-[#003866] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Back to All Categories</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mx-auto flex w-full justify-center items-center gap-2 mt-12 pb-8 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  const el = document.getElementById('category-products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      setCurrentPage(page);
                      const el = document.getElementById('category-products');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      page === currentPage
                        ? 'bg-[#004b87] text-white shadow-xs'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  const el = document.getElementById('category-products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
