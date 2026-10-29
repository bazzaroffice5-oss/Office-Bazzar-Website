'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  ChevronRight,
  ArrowLeft,
  Package,
} from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { Product, Category, Subcategory } from '@/types';
import { CATEGORY_MAP, isProductInSubcategory } from '@/lib/data/catalog';

interface CategoryLandingClientProps {
  category: Category;
  allProducts: Product[];
  initialView?: string;
  initialSub?: string;
  baseRoute?: string;
}

export default function CategoryLandingClient({
  category,
  allProducts,
  initialView,
  initialSub,
  baseRoute = '/categories',
}: CategoryLandingClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read current view & sub from URL search params with fallback to initial props
  const viewParam = searchParams.get('view') || initialView || '';
  const subParam = searchParams.get('sub') || initialSub || '';

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 48;

  // Filter products belonging to this main category
  const categoryProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (!p.isActive) return false;
      if (p.categoryId === category.id || p.categoryId === category.slug) return true;
      if (p.categoryName?.toLowerCase() === category.name.toLowerCase()) return true;
      const mapped = CATEGORY_MAP[p.subcategoryId || ''] || CATEGORY_MAP[p.categoryId || ''];
      if (mapped && (mapped.mainId === category.id || mapped.mainSlug === category.slug)) {
        return true;
      }
      return false;
    });
  }, [allProducts, category]);

  // Compute product counts for each subcategory across catalog
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    category.subcategories?.forEach((sub) => {
      const inSub = allProducts.filter((p) => isProductInSubcategory(p, sub.slug));
      const resolved = inSub.length > 0 ? inSub.length : (sub.itemCount || 0);
      counts[sub.slug] = resolved;
      counts[sub.id] = resolved;
    });
    return counts;
  }, [category, allProducts]);

  // Determine if product listing mode is active
  const isViewingAll = viewParam === 'all' || viewParam === 'products';
  const activeSubcategory: Subcategory | undefined = useMemo(() => {
    if (!subParam) return undefined;
    return category.subcategories?.find(
      (s) => s.slug === subParam || s.id === subParam
    );
  }, [category, subParam]);

  const isProductListingOpen = Boolean(isViewingAll || activeSubcategory);

  // Products filtered for the active product listing
  const displayedProducts = useMemo(() => {
    if (!isProductListingOpen) return [];
    if (isViewingAll || !activeSubcategory) {
      return categoryProducts;
    }
    return allProducts.filter((p) => isProductInSubcategory(p, activeSubcategory.slug));
  }, [categoryProducts, allProducts, isProductListingOpen, isViewingAll, activeSubcategory]);

  const totalItems = displayedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = displayedProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewParam, subParam]);

  // Navigation helpers
  const resolvedBaseRoute =
    pathname?.startsWith('/shop/categories')
      ? '/shop/categories'
      : pathname?.startsWith('/category')
      ? '/category'
      : baseRoute;

  const categoryBaseUrl = `${resolvedBaseRoute}/${category.slug}`;

  // ==========================================
  // VIEW 1: CATEGORY-SPECIFIC LANDING PAGE
  // Subcategory Grid matching reference design
  // ==========================================
  if (!isProductListingOpen) {
    return (
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Breadcrumb Navigation: Home → Main Category */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-slate-500 mb-6"
        >
          <Link href="/" className="hover:text-[#004b87] transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900 truncate">
            {category.name}
          </span>
        </nav>

        {/* Centered Category Heading with orange underline */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {category.name}
          </h1>
          <div className="w-16 h-[3px] bg-[#ea580c] mx-auto mt-3 rounded-full" />
        </div>

        {/* Responsive Grid of Image-Based Subcategory Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mb-8">
          {category.subcategories?.map((sub) => {
            const count = subcategoryCounts[sub.slug] || sub.itemCount || 0;
            const subImageUrl = sub.imageUrl || category.imageUrl || '/images/categories/office-supplies-stationery.jpg';

            return (
              <Link
                key={sub.id}
                href={`${categoryBaseUrl}?sub=${sub.slug}`}
                className="group relative block w-full aspect-[4/3] sm:aspect-[4/3.4] lg:aspect-[4/3.4] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2"
              >
                <Image
                  src={subImageUrl}
                  alt={sub.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Hover Tint */}
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors duration-300" />

                {/* Product Count Badge at Top-Right */}
                {count > 0 && (
                  <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold text-slate-800 shadow-sm border border-slate-200/60 pointer-events-none">
                    <Package className="w-3.5 h-3.5 text-[#004b87]" />
                    <span>{count} Products</span>
                  </div>
                )}

                {/* Subcategory Name near bottom */}
                <div className="absolute inset-x-0 bottom-0 z-10 pt-16 pb-4 sm:pb-5 px-4 sm:px-5 bg-gradient-to-t from-black/80 via-black/35 to-transparent">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm group-hover:text-blue-100 transition-colors leading-snug">
                    {sub.name}
                  </h2>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PRODUCT LISTING PAGE
  // Opens ONLY after user selects "All Products" or a Subcategory
  // ==========================================
  const activeTitle = isViewingAll ? `All ${category.name} Products` : (activeSubcategory?.name || category.name);
  const activeSubtitle = isViewingAll
    ? `Displaying all ${displayedProducts.length} products across ${category.subcategories?.length || 0} subcategories in ${category.name}`
    : `Displaying all ${displayedProducts.length} products in ${activeSubcategory?.name}`;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Breadcrumb Navigation: Home → Main Category → All Products / Subcategory */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-slate-500 mb-6"
      >
        <Link href="/" className="hover:text-[#004b87] transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link
          href={categoryBaseUrl}
          className="hover:text-[#004b87] transition-colors font-medium"
        >
          {category.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-semibold text-[#004b87] truncate">
          {isViewingAll ? 'All Products' : (activeSubcategory?.name || 'Products')}
        </span>
      </nav>

      {/* Listing Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {activeTitle}
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">
            {activeSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Back to Category Landing Page */}
          <Link
            href={categoryBaseUrl}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#004b87] hover:text-[#003866] bg-blue-50/80 hover:bg-blue-100/80 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {category.name}</span>
          </Link>

          {/* Product count badge */}
          <span className="text-xs sm:text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <strong className="text-[#004b87] font-semibold">{totalItems}</strong> products
          </span>
        </div>
      </div>

      {/* Subcategory Filter Switcher Tabs / Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8 pb-2 border-b border-slate-100">
        <Link
          href={`${categoryBaseUrl}?view=all`}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
            isViewingAll
              ? 'bg-[#004b87] text-white shadow-sm ring-2 ring-[#004b87]/30'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-[#004b87] hover:text-[#004b87]'
          }`}
        >
          <span>All {category.name}</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
              isViewingAll ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {categoryProducts.length}
          </span>
        </Link>

        {category.subcategories?.map((sub) => {
          const isSelected = subParam === sub.slug || subParam === sub.id;
          const count = subcategoryCounts[sub.slug] || sub.itemCount || 0;

          return (
            <Link
              key={sub.id}
              href={`${categoryBaseUrl}?sub=${sub.slug}`}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#004b87] text-white shadow-sm ring-2 ring-[#004b87]/30'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-[#004b87] hover:text-[#004b87]'
              }`}
            >
              <span>{sub.name}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Responsive Product Cards Grid */}
      {paginatedProducts.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-4 my-8">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#004b87] mx-auto flex items-center justify-center">
            <Package className="w-7 h-7 text-[#004b87]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {categoryProducts.length === 0 ? 'Corporate Catalogue Available on RFQ' : 'No products found in this subcategory'}
          </h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            {categoryProducts.length === 0
              ? `${category.name} supplies are available under our Annual Rate Contract (ARC) and bulk B2B procurement agreements. Submit an RFQ with your requirement specs.`
              : `There are currently no catalog items matching this filter. You can request custom quotes or view all items in ${category.name}.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/request-quote"
              className="inline-flex items-center gap-2 bg-[#004b87] hover:bg-[#003866] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <span>Request Corporate Quote</span>
            </Link>
            <Link
              href={categoryBaseUrl}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>Back to {category.name}</span>
            </Link>
          </div>
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
              window.scrollTo({ top: 100, behavior: 'smooth' });
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
                  window.scrollTo({ top: 100, behavior: 'smooth' });
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
              window.scrollTo({ top: 100, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
