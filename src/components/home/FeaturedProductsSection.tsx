'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { Product } from '@/types';

interface FeaturedProductsSectionProps {
  products: Product[];
}

export default function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  // Select top featured/bestseller products or the first 6
  const featured = products
    .filter((p) => p.featured || p.bestseller || p.isActive)
    .slice(0, 6);

  return (
    <section className="w-full py-10 sm:py-12 bg-white border-b border-slate-100">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header matching Panel 1 */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Featured Products
          </h2>

          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors group"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product Cards Row with right carousel navigation arrow */}
        <div className="relative pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Right arrow matching Panel 1 reference */}
          <Link
            href="/products"
            aria-label="View more products"
            className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all z-10 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
