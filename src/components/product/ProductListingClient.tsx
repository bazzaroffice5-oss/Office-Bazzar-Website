'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Search,
  X,
  RotateCcw,
  Package,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import ProductCard from './ProductCard';
import WindowPagination from '@/components/ui/WindowPagination';
import { Product, Category, Brand } from '@/types';
import { NINE_SUBCATEGORIES } from '@/lib/data/catalog';

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'name';

interface ProductListingClientProps {
  initialProducts: Product[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  categories?: Category[];
  brands?: Brand[];
  availableBrands?: { id: string; name: string }[];
  categoryCounts?: Record<string, number>;
  subcategoryCounts?: Record<string, number>;
  brandCounts?: Record<string, number>;
  totalActiveProducts?: number;
  initialCategorySlug?: string;
  initialSubcategorySlug?: string;
  initialBrandSlug?: string;
  initialQuery?: string;
  initialSort?: SortOption;
}

export default function ProductListingClient({
  initialProducts,
  totalProducts,
  currentPage,
  totalPages,
  categories = [],
  availableBrands = [],
  categoryCounts = {},
  subcategoryCounts = {},
  brandCounts = {},
  totalActiveProducts = 0,
  initialCategorySlug = '',
  initialSubcategorySlug = '',
  initialBrandSlug = '',
  initialQuery = '',
  initialSort = 'relevance',
}: ProductListingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState<string>(
    initialSubcategorySlug
      ? `sub:${initialSubcategorySlug}`
      : initialCategorySlug
      ? `cat:${initialCategorySlug}`
      : 'all'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrandSlug);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort || 'relevance');

  // Sync state if initial props change on navigation
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialSubcategorySlug) {
      setSelectedFilter(`sub:${initialSubcategorySlug}`);
    } else if (initialCategorySlug) {
      setSelectedFilter(`cat:${initialCategorySlug}`);
    } else {
      setSelectedFilter('all');
    }
  }, [initialCategorySlug, initialSubcategorySlug]);

  useEffect(() => {
    setSelectedBrand(initialBrandSlug || '');
  }, [initialBrandSlug]);

  useEffect(() => {
    setSortBy(initialSort || 'relevance');
  }, [initialSort]);

  // Navigate using URL parameters to trigger server-side pagination & filtering
  const navigateWithParams = (
    newQuery: string,
    newFilter: string,
    newBrand: string,
    newSort: SortOption,
    newPage: number = 1
  ) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set('query', newQuery.trim());
    if (newFilter.startsWith('cat:')) params.set('category', newFilter.replace('cat:', ''));
    if (newFilter.startsWith('sub:')) params.set('sub', newFilter.replace('sub:', ''));
    if (newBrand) params.set('brand', newBrand);
    if (newSort !== 'relevance') params.set('sort', newSort);
    if (newPage > 1) params.set('page', newPage.toString());

    const queryStr = params.toString();
    const newUrl = queryStr ? `/products?${queryStr}` : '/products';
    startTransition(() => {
      router.push(newUrl);
    });
  };

  // Generate SEO crawlable page URL for pagination links
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('query', searchQuery.trim());
    if (selectedFilter.startsWith('cat:')) params.set('category', selectedFilter.replace('cat:', ''));
    if (selectedFilter.startsWith('sub:')) params.set('sub', selectedFilter.replace('sub:', ''));
    if (selectedBrand) params.set('brand', selectedBrand);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (page > 1) params.set('page', page.toString());
    const queryStr = params.toString();
    return queryStr ? `/products?${queryStr}` : '/products';
  };

  // Debounce live search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialQuery) {
        navigateWithParams(searchQuery, selectedFilter, selectedBrand, sortBy, 1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const handleFilterChange = (val: string) => {
    setSelectedFilter(val);
    navigateWithParams(searchQuery, val, selectedBrand, sortBy, 1);
  };

  const handleBrandChange = (val: string) => {
    setSelectedBrand(val);
    navigateWithParams(searchQuery, selectedFilter, val, sortBy, 1);
  };

  const handleSortChange = (val: SortOption) => {
    setSortBy(val);
    navigateWithParams(searchQuery, selectedFilter, selectedBrand, val, 1);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSelectedBrand('');
    setSortBy('relevance');
    startTransition(() => {
      router.push('/products');
    });
  };

  const handlePageChange = (page: number) => {
    navigateWithParams(searchQuery, selectedFilter, selectedBrand, sortBy, page);
    if (typeof window !== 'undefined') {
      const el = document.getElementById('products-grid-top');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    (selectedFilter && selectedFilter !== 'all') ||
    selectedBrand ||
    sortBy !== 'relevance'
  );

  // Active filter label for header
  const activeFilterLabel = useMemo(() => {
    if (selectedFilter.startsWith('cat:')) {
      const slug = selectedFilter.replace('cat:', '');
      const matched = categories.find((c) => c.slug === slug || c.id === slug);
      return matched ? matched.name : slug.replace(/-/g, ' ');
    }
    if (selectedFilter.startsWith('sub:')) {
      const slug = selectedFilter.replace('sub:', '');
      const matched = NINE_SUBCATEGORIES.find((s) => s.slug === slug || s.id === slug);
      return matched ? matched.name : slug.replace(/-/g, ' ');
    }
    return '';
  }, [selectedFilter, categories]);

  const itemsPerPage = 24;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalProducts);
  const totalCatalogCount = totalActiveProducts || totalProducts;

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-[#526174] mb-6"
      >
        <Link href="/" className="hover:text-[#163A5F] transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#526174]/50 shrink-0" />
        <Link
          href="/products"
          onClick={handleClearAll}
          className={`hover:text-[#163A5F] transition-colors font-medium ${
            !activeFilterLabel && !searchQuery ? 'text-[#111827] font-bold' : ''
          }`}
        >
          All Products
        </Link>
        {activeFilterLabel && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#526174]/50 shrink-0" />
            <span className="font-semibold text-[#163A5F] truncate">
              {activeFilterLabel}
            </span>
          </>
        )}
      </nav>

      {/* Page Header */}
      <div id="products-grid-top" className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827] tracking-tight">
              {searchQuery.trim()
                ? `Search: "${searchQuery.trim()}"`
                : activeFilterLabel
                ? activeFilterLabel
                : 'All Products'}
            </h1>
            <div className="w-16 h-[3px] bg-[#F97316] mt-3 rounded-full" />
            <p className="text-xs sm:text-sm text-[#526174] mt-2.5 max-w-2xl font-normal leading-relaxed">
              Explore our complete wholesale workplace catalogue across all categories with pre-negotiated corporate rates, volume packaging, and 100% GST input tax credit.
            </p>
          </div>

          {/* Product Count Display */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-xs sm:text-sm font-medium text-[#526174] bg-white px-3.5 py-1.5 rounded-full border border-[#E2EBE3] shadow-2xs flex items-center gap-1.5">
              {isPending ? (
                <Loader2 className="w-4 h-4 text-[#163A5F] animate-spin" />
              ) : (
                <Package className="w-4 h-4 text-[#163A5F]" />
              )}
              <span>
                {totalProducts > 0 ? (
                  <>
                    Showing <strong className="text-[#163A5F] font-bold">{startIndex + 1}-{endIndex}</strong> of {totalProducts} products
                  </>
                ) : (
                  <>0 products found</>
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#EFF6F0] rounded-2xl border border-[#E2EBE3] p-4 sm:p-5 mb-8 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#526174]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <label htmlFor="catalog-search-input" className="sr-only">
              Search products, brands, SKUs or specifications
            </label>
            <input
              id="catalog-search-input"
              type="text"
              aria-label="Search products, brands, SKUs or specifications"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products, brands, SKUs or specifications..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#E2EBE3] rounded-xl text-sm text-[#111827] placeholder:text-[#526174]/70 focus:bg-white focus:outline-none focus:border-[#163A5F] focus:ring-2 focus:ring-[#163A5F]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  navigateWithParams('', selectedFilter, selectedBrand, sortBy, 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526174]/60 hover:text-[#111827] p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Category Filter Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                aria-label="Filter by category"
                className="w-full sm:w-auto min-w-[170px] py-2.5 pl-3.5 pr-8 bg-white border border-[#E2EBE3] rounded-xl text-xs sm:text-sm font-medium text-[#111827] focus:bg-white focus:outline-none focus:border-[#163A5F] focus:ring-2 focus:ring-[#163A5F]/20 hover:bg-[#EDF5EF] transition-all cursor-pointer"
              >
                <option value="all">All Categories ({totalCatalogCount})</option>
                <optgroup label="Main Categories">
                  {categories.map((c) => (
                    <option key={`cat-${c.id}`} value={`cat:${c.slug}`}>
                      {c.name} ({categoryCounts[c.id] || categoryCounts[c.slug] || 0})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Subcategories">
                  {NINE_SUBCATEGORIES.map((s) => (
                    <option key={`sub-${s.id}`} value={`sub:${s.slug}`}>
                      {s.name} ({subcategoryCounts[s.slug] || 0})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Brand Filter Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                aria-label="Filter by brand"
                className="w-full sm:w-auto min-w-[140px] py-2.5 pl-3.5 pr-8 bg-white border border-[#E2EBE3] rounded-xl text-xs sm:text-sm font-medium text-[#111827] focus:bg-white focus:outline-none focus:border-[#163A5F] focus:ring-2 focus:ring-[#163A5F]/20 hover:bg-[#EDF5EF] transition-all cursor-pointer"
              >
                <option value="">All Brands ({totalCatalogCount})</option>
                {availableBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({brandCounts[b.id] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                aria-label="Sort products"
                className="w-full sm:w-auto min-w-[150px] py-2.5 pl-3.5 pr-8 bg-white border border-[#E2EBE3] rounded-xl text-xs sm:text-sm font-medium text-[#111827] focus:bg-white focus:outline-none focus:border-[#163A5F] focus:ring-2 focus:ring-[#163A5F]/20 hover:bg-[#EDF5EF] transition-all cursor-pointer"
              >
                <option value="relevance">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Cards Grid: Desktop 4 cols, Medium screens 3 cols, Tablets 2 cols, Mobile 1 col */}
      <h2 className="sr-only">Product Catalogue Grid</h2>
      {initialProducts.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-[#E2EBE3] p-12 sm:p-16 text-center space-y-4 my-6">
          <div className="w-14 h-14 rounded-full bg-[#EFF6F0] text-[#163A5F] mx-auto flex items-center justify-center">
            <Package className="w-7 h-7 text-[#526174]" />
          </div>
          <h2 className="text-xl font-bold text-[#111827]">No products found</h2>
          <p className="text-xs sm:text-sm text-[#526174] max-w-md mx-auto leading-relaxed">
            We couldn&apos;t find any products matching your current search or filter criteria. Try resetting filters to browse our full workplace catalogue.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 bg-[#163A5F] hover:bg-[#163A5F]/90 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Show All Products</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 w-full transition-opacity duration-200 ${
            isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}
        >
          {initialProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>
      )}

      {/* Window-Based Pagination Controls (Max 6 pages at a time) */}
      <WindowPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        getPageUrl={getPageUrl}
        className="mt-12 mb-6"
      />

      {/* Corporate Procurement Quotation CTA Banner */}
      <div className="mt-14 p-6 sm:p-8 bg-gradient-to-r from-[#111827] to-[#163A5F] rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Need Bulk Enterprise Pricing or Custom Invoicing?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
            Submit your itemized bill of quantities or product requirements to receive institutional corporate quotes with pre-negotiated volume pricing and full GST ITC credit.
          </p>
        </div>
        <Link
          href="/request-quote"
          className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white font-semibold px-6 py-3 rounded-full text-sm transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
        >
          <span>Request Corporate Quote</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
