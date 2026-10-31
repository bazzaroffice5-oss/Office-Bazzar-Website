'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Search,
  X,
  RotateCcw,
  Package,
  ArrowRight,
} from 'lucide-react';
import ProductCard from './ProductCard';
import { Product, Category, Brand } from '@/types';
import { NINE_SUBCATEGORIES, isProductInSubcategory } from '@/lib/data/catalog';

interface ProductListingClientProps {
  initialProducts: Product[];
  categories?: Category[];
  currentCategory?: Category | null;
  brands?: Brand[];
  initialCategorySlug?: string;
  initialSubcategorySlug?: string;
  initialBrandSlug?: string;
  initialQuery?: string;
  showAllCategoriesHeader?: boolean;
}

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'name';

export default function ProductListingClient({
  initialProducts,
  categories = [],
  brands = [],
  initialCategorySlug = '',
  initialSubcategorySlug = '',
  initialBrandSlug = '',
  initialQuery = '',
}: ProductListingClientProps) {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState<string>(
    initialSubcategorySlug ? `sub:${initialSubcategorySlug}` : (initialCategorySlug ? `cat:${initialCategorySlug}` : 'all')
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrandSlug);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 24;

  // Sync state if initial props change
  useEffect(() => {
    if (initialQuery !== undefined) setSearchQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialSubcategorySlug) {
      setSelectedFilter(`sub:${initialSubcategorySlug}`);
    } else if (initialCategorySlug) {
      setSelectedFilter(`cat:${initialCategorySlug}`);
    }
  }, [initialCategorySlug, initialSubcategorySlug]);

  useEffect(() => {
    if (initialBrandSlug !== undefined) setSelectedBrand(initialBrandSlug);
  }, [initialBrandSlug]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('query') || '';
        const cat = params.get('category') || '';
        const sub = params.get('sub') || '';
        const brand = params.get('brand') || '';
        setSearchQuery(q);
        if (sub) {
          setSelectedFilter(`sub:${sub}`);
        } else if (cat) {
          setSelectedFilter(`cat:${cat}`);
        } else {
          setSelectedFilter('all');
        }
        setSelectedBrand(brand);
        setCurrentPage(1);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL query params without reloading
  const updateUrl = (q: string, filter: string, brand: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (q.trim()) params.set('query', q.trim());
    if (filter.startsWith('cat:')) params.set('category', filter.replace('cat:', ''));
    if (filter.startsWith('sub:')) params.set('sub', filter.replace('sub:', ''));
    if (brand) params.set('brand', brand);

    const queryStr = params.toString();
    const newUrl = queryStr ? `/products?${queryStr}` : '/products';
    window.history.pushState({}, '', newUrl);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    updateUrl(val, selectedFilter, selectedBrand);
  };

  const handleFilterChange = (val: string) => {
    setSelectedFilter(val);
    setCurrentPage(1);
    updateUrl(searchQuery, val, selectedBrand);
  };

  const handleBrandChange = (val: string) => {
    setSelectedBrand(val);
    setCurrentPage(1);
    updateUrl(searchQuery, selectedFilter, val);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSelectedBrand('');
    setSortBy('relevance');
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/products');
    }
  };

  // Active products list
  const activeProducts = useMemo(() => {
    return initialProducts.filter((p) => p.isActive !== false);
  }, [initialProducts]);

  // Compute unique brands available in the active catalog or passed brands
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, { id: string; name: string }>();
    brands.forEach((b) => {
      brandMap.set(b.id, { id: b.id, name: b.name });
    });
    activeProducts.forEach((p) => {
      if (p.brandName) {
        const id = p.brandId || p.brandName.toLowerCase().replace(/\s+/g, '-');
        if (!brandMap.has(id)) {
          brandMap.set(id, { id, name: p.brandName });
        }
      }
    });
    return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [brands, activeProducts]);

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    let result = [...activeProducts];

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brandName?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.subcategoryName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 2. Category / Subcategory Filter
    if (selectedFilter && selectedFilter !== 'all') {
      if (selectedFilter.startsWith('cat:')) {
        const catSlug = selectedFilter.replace('cat:', '');
        result = result.filter(
          (p) =>
            p.categoryId === catSlug ||
            p.categoryName.toLowerCase().includes(catSlug.replace(/-/g, ' '))
        );
      } else if (selectedFilter.startsWith('sub:')) {
        const subSlug = selectedFilter.replace('sub:', '');
        result = result.filter((p) => isProductInSubcategory(p, subSlug));
      }
    }

    // 3. Brand Filter
    if (selectedBrand) {
      const bSlug = selectedBrand.toLowerCase();
      result = result.filter(
        (p) =>
          p.brandId?.toLowerCase() === bSlug ||
          p.brandName?.toLowerCase() === bSlug ||
          p.brandName?.toLowerCase().replace(/\s+/g, '-') === bSlug
      );
    }

    // 4. Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'relevance':
      default:
        result.sort((a, b) => {
          if (a.bestseller && !b.bestseller) return -1;
          if (!a.bestseller && b.bestseller) return 1;
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.rating ?? 0) - (a.rating ?? 0);
        });
        break;
    }

    return result;
  }, [activeProducts, searchQuery, selectedFilter, selectedBrand, sortBy]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-slate-500 mb-6"
      >
        <Link href="/" className="hover:text-[#004b87] transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link
          href="/products"
          onClick={handleClearAll}
          className={`hover:text-[#004b87] transition-colors font-medium ${
            !activeFilterLabel && !searchQuery ? 'text-slate-900 font-bold' : ''
          }`}
        >
          All Products
        </Link>
        {activeFilterLabel && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-[#004b87] truncate">
              {activeFilterLabel}
            </span>
          </>
        )}
      </nav>

      {/* Page Header */}
      <div id="products-grid-top" className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {searchQuery.trim()
                ? `Search: "${searchQuery.trim()}"`
                : activeFilterLabel
                ? activeFilterLabel
                : 'All Products'}
            </h1>
            <div className="w-16 h-[3px] bg-[#ea580c] mt-3 rounded-full" />
            <p className="text-xs sm:text-sm text-slate-600 mt-2.5 max-w-2xl font-normal leading-relaxed">
              Explore our complete wholesale workplace catalogue across all categories with pre-negotiated corporate rates, volume packaging, and 100% GST input tax credit.
            </p>
          </div>

          {/* Product Count Display */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-xs sm:text-sm font-medium text-slate-600 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-2xs flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#004b87]" />
              <span>
                Showing <strong className="text-[#004b87] font-bold">{totalItems}</strong> of {activeProducts.length} products
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 mb-8 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#004b87] focus:ring-2 focus:ring-[#004b87]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
                className="w-full sm:w-auto min-w-[170px] py-2.5 pl-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#004b87] focus:ring-2 focus:ring-[#004b87]/20 transition-all cursor-pointer"
              >
                <option value="all">All Categories ({activeProducts.length})</option>
                <optgroup label="Main Categories">
                  {categories.map((c) => (
                    <option key={`cat-${c.id}`} value={`cat:${c.slug}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Subcategories">
                  {NINE_SUBCATEGORIES.map((s) => (
                    <option key={`sub-${s.id}`} value={`sub:${s.slug}`}>
                      {s.name}
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
                className="w-full sm:w-auto min-w-[140px] py-2.5 pl-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#004b87] focus:ring-2 focus:ring-[#004b87]/20 transition-all cursor-pointer"
              >
                <option value="">All Brands</option>
                {availableBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="w-full sm:w-auto min-w-[150px] py-2.5 pl-3.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#004b87] focus:ring-2 focus:ring-[#004b87]/20 transition-all cursor-pointer"
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
      {paginatedProducts.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-12 sm:p-16 text-center space-y-4 my-6">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#004b87] mx-auto flex items-center justify-center">
            <Package className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No products found</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            We couldn&apos;t find any products matching your current search or filter criteria. Try resetting filters to browse our full workplace catalogue.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 bg-[#004b87] hover:bg-[#003866] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Show All Products</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 w-full">
          {paginatedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mx-auto flex w-full justify-center items-center gap-1.5 sm:gap-2 mt-12 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const page = idx + 1;
            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  page === currentPage
                    ? 'bg-[#004b87] text-white shadow-xs'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Corporate Procurement Quotation CTA Banner */}
      <div className="mt-14 p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-[#002f57] rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
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
          className="inline-flex items-center gap-2 bg-[#ea580c] hover:bg-[#d94e08] text-white font-semibold px-6 py-3 rounded-full text-sm transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
        >
          <span>Request Corporate Quote</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
