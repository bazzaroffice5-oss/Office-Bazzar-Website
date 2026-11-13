'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Package,
} from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import WindowPagination from '@/components/ui/WindowPagination';
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
  baseRoute = '/category',
}: CategoryLandingClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read current view & sub from URL search params with fallback to initial props
  const viewParam = searchParams.get('view') || initialView || '';
  const subParam = searchParams.get('sub') || initialSub || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [currentPage, setCurrentPage] = useState<number>(!isNaN(pageParam) && pageParam > 0 ? pageParam : 1);
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
    const cards = [
      {
        id: 'all-products',
        name: 'All Products',
        href: '/products',
        imageUrl: category.imageUrl || '/images/categories/office-supplies-stationery.jpg',
        description: 'Browse our complete workplace catalogue across all 9 categories with direct wholesale pricing and GST input credit.',
      },
      ...(category.subcategories || []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        href: `${categoryBaseUrl}?sub=${sub.slug}`,
        imageUrl: sub.imageUrl || category.imageUrl || '/images/categories/office-supplies-stationery.jpg',
        description: sub.description,
      })),
    ];

    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 md:py-10">
        {/* Breadcrumb Navigation: Home → Main Category */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-[#526174] mb-6"
        >
          <Link href="/" className="hover:text-[#163A5F] transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#526174]/50 shrink-0" />
          <span className="font-semibold text-[#111827] truncate">
            {category.name}
          </span>
        </nav>

        {/* Centered Category Heading with orange underline */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827] tracking-tight">
            {category.name}
          </h1>
          <div className="w-16 h-[3px] bg-[#F97316] mx-auto mt-3 rounded-full" />
          {category.description && (
            <p className="text-xs sm:text-sm text-[#526174] mt-3 font-normal max-w-xl mx-auto leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* 10 Category Cards in Responsive Grid: 5 columns on desktop (2 balanced rows of 5), 4 on laptops, 3 on tablets, 2 on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5 md:gap-4">
          {cards.map((card, index) => (
            <Link
              key={card.id}
              href={card.href}
              className="group relative flex flex-col w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-slate-100 border border-[#E2EBE3] hover:border-[#163A5F]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#163A5F] focus-visible:ring-offset-2"
            >
              {/* Category Image with Smooth Hover Zoom */}
              <Image
                src={card.imageUrl}
                alt={`${card.name} Category`}
                fill
                priority={index < 4}
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />

              {/* Subtle Overall Gradient/Tint on Hover */}
              <div className="absolute inset-0 bg-slate-900/15 group-hover:bg-slate-900/25 transition-colors duration-300" />

              {/* Bottom Gradient Overlay with Category Name & Description */}
              <div className="absolute inset-x-0 bottom-0 z-10 pt-10 pb-3 sm:pb-3.5 px-3 sm:px-3.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
                <div className="flex items-center justify-between gap-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight drop-shadow-sm group-hover:text-blue-100 transition-colors leading-snug truncate">
                    {card.name}
                  </h2>
                  <ArrowRight className="w-3.5 h-3.5 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                {card.description && (
                  <p className="text-[11px] sm:text-xs text-slate-200/90 line-clamp-1 sm:line-clamp-2 mt-0.5 font-normal drop-shadow-sm leading-relaxed">
                    {card.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PRODUCT LISTING PAGE
  // Opens ONLY after user selects "All Products" or a Subcategory
  // ==========================================
  const activeTitle = isViewingAll ? `All ${category.name} Products` : (activeSubcategory ? `${activeSubcategory.name} — ${category.name}` : category.name);
  const activeSubtitle = isViewingAll
    ? `Displaying all ${displayedProducts.length} products across ${category.subcategories?.length || 0} subcategories in ${category.name}`
    : `Displaying all ${displayedProducts.length} products in ${activeSubcategory?.name}`;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 md:py-10">
      {/* Breadcrumb Navigation: Home → Main Category → All Products / Subcategory */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-[#526174] mb-6"
      >
        <Link href="/" className="hover:text-[#163A5F] transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#526174]/50 shrink-0" />
        <Link
          href={categoryBaseUrl}
          className="hover:text-[#163A5F] transition-colors font-medium"
        >
          {category.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#526174]/50 shrink-0" />
        <span className="font-semibold text-[#163A5F] truncate">
          {isViewingAll ? 'All Products' : (activeSubcategory?.name || 'Products')}
        </span>
      </nav>

      {/* Listing Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#E2EBE3] gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            {activeTitle}
          </h1>
          <p className="text-sm text-[#526174] mt-1 font-normal">
            {activeSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Back to Category Landing Page */}
          <Link
            href={categoryBaseUrl}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#163A5F] hover:text-[#163A5F]/90 bg-[#EFF6F0] hover:bg-[#EDF5EF] px-3.5 py-1.5 rounded-full transition-colors border border-[#E2EBE3]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {category.name}</span>
          </Link>

          {/* Product count badge */}
          <span className="text-xs sm:text-sm font-medium text-[#526174] bg-white px-3 py-1 rounded-full border border-[#E2EBE3]">
            <strong className="text-[#163A5F] font-semibold">{totalItems}</strong> products
          </span>
        </div>
      </div>

      {/* Subcategory Filter Switcher Tabs / Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8 pb-2 border-b border-[#E2EBE3]">
        <Link
          href={`${categoryBaseUrl}?view=all`}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
            isViewingAll
              ? 'bg-[#163A5F] text-white shadow-xs'
              : 'bg-white border border-[#E2EBE3] text-[#526174] hover:border-[#163A5F] hover:text-[#163A5F] hover:bg-[#EDF5EF]'
          }`}
        >
          <span>All {category.name}</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
              isViewingAll ? 'bg-white/20 text-white' : 'bg-[#EFF6F0] text-[#526174]'
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
                  ? 'bg-[#163A5F] text-white shadow-xs'
                  : 'bg-white border border-[#E2EBE3] text-[#526174] hover:border-[#163A5F] hover:text-[#163A5F] hover:bg-[#EDF5EF]'
              }`}
            >
              <span>{sub.name}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#EFF6F0] text-[#526174]'
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Responsive Product Cards Grid */}
      <h2 className="sr-only">{activeTitle} Catalogue</h2>
      {paginatedProducts.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-[#E2EBE3] p-8 sm:p-12 text-center space-y-4 my-8">
          <div className="w-14 h-14 rounded-full bg-[#EFF6F0] text-[#163A5F] mx-auto flex items-center justify-center">
            <Package className="w-7 h-7 text-[#526174]" />
          </div>
          <h2 className="text-xl font-bold text-[#111827]">
            {categoryProducts.length === 0 ? 'Corporate Catalogue Available on RFQ' : 'No products found in this subcategory'}
          </h2>
          <p className="text-sm text-[#526174] max-w-lg mx-auto">
            {categoryProducts.length === 0
              ? `${category.name} supplies are available under our Annual Rate Contract (ARC) and bulk B2B procurement agreements. Submit an RFQ with your requirement specs.`
              : `There are currently no catalog items matching this filter. You can request custom quotes or view all items in ${category.name}.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/request-quote"
              className="inline-flex items-center gap-2 bg-[#163A5F] hover:bg-[#163A5F]/90 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Request Corporate Quote</span>
            </Link>
            <Link
              href={categoryBaseUrl}
              className="inline-flex items-center gap-2 bg-[#EFF6F0] hover:bg-[#EDF5EF] text-[#163A5F] text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-[#E2EBE3]"
            >
              <span>Back to {category.name}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-3.5 md:gap-4 w-full">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Window-Based Pagination Controls (Max 6 pages at a time) */}
      <WindowPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => {
          setCurrentPage(p);
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (p > 1) params.set('page', p.toString());
            else params.delete('page');
            const q = params.toString();
            window.history.pushState({}, '', `${categoryBaseUrl}${q ? `?${q}` : ''}`);
            window.scrollTo({ top: 100, behavior: 'smooth' });
          }
        }}
        getPageUrl={(p) => {
          const params = new URLSearchParams();
          if (viewParam) params.set('view', viewParam);
          if (subParam) params.set('sub', subParam);
          if (p > 1) params.set('page', p.toString());
          const q = params.toString();
          return `${categoryBaseUrl}${q ? `?${q}` : ''}`;
        }}
        className="mt-12 pb-8"
      />
    </div>
  );
}
