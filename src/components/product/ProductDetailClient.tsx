'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Check, Heart } from 'lucide-react';
import { Brand, Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { getBrandLogoUrl } from '@/lib/utils/brandLogos';
import ProductCard from './ProductCard';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  brand?: Brand | null;
}

const FALLBACK_IMAGE =
  'https://officebazzar.co.in/wp-content/uploads/2022/12/cardboard-tag-file-500x500-1.jpg';

export default function ProductDetailClient({
  product,
  relatedProducts,
  brand,
}: ProductDetailClientProps) {
  const { addToCart, items } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addedFeedback, setAddedFeedback] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const cartItem = items.find((i) => i.product.id === product.id);
  const displayImage = product.images?.[0] || FALLBACK_IMAGE;

  // Resolve brand logo (from passed brand prop, or helper mapping)
  const brandLogo = getBrandLogoUrl(product.brandName, brand?.logoUrl);

  // URLs
  const categoryHref = `/category/${product.categoryId}`;
  const subcategoryHref = product.subcategoryId
    ? `/category/${product.categoryId}?sub=${product.subcategoryId}`
    : null;
  const brandHref = brand?.slug
    ? `/products?brand=${brand.slug}`
    : `/products?brand=${encodeURIComponent(product.brandName || '')}`;

  const handleAddToCart = () => {
    addToCart(product, product.minOrderQuantity || 1);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 bg-white">
      {/* A. Breadcrumb: Categories / [Category] / [Subcategory] / [Product Name] */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-1.5 text-xs text-gray-500 mb-5 sm:mb-6 flex-wrap gap-y-1 font-normal"
      >
        <div className="flex items-center space-x-1.5">
          <Link href="/categories" className="text-gray-500 hover:text-gray-900 transition-colors">
            Categories
          </Link>
          <span className="text-gray-300">/</span>
        </div>

        {product.categoryName && (
          <div className="flex items-center space-x-1.5">
            <Link href={categoryHref} className="text-gray-500 hover:text-gray-900 transition-colors">
              {product.categoryName}
            </Link>
            <span className="text-gray-300">/</span>
          </div>
        )}

        {product.subcategoryName && subcategoryHref && (
          <div className="flex items-center space-x-1.5">
            <Link href={subcategoryHref} className="text-gray-500 hover:text-gray-900 transition-colors">
              {product.subcategoryName}
            </Link>
            <span className="text-gray-300">/</span>
          </div>
        )}

        <div className="flex items-center space-x-1.5">
          <span className="font-medium text-gray-900 truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </div>
      </nav>

      {/* B. Main Product Information: Compact Two-Column Layout */}
      <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 md:gap-10">
        {/* Left Column — Reduced Product Image Container (~20-25% smaller, centered, never stretched) */}
        <div className="w-full sm:w-[250px] md:w-[270px] shrink-0 mx-auto sm:mx-0 max-w-[280px] sm:max-w-none">
          <div className="flex aspect-square w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="relative w-full h-full p-4 flex items-center justify-center">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 640px) 280px, 270px"
                className="aspect-square w-full object-contain object-center p-2.5 transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Right Column — Compact Product Details */}
        <div className="flex-1 min-w-0 w-full">
          {/* 1. Brand logo and brand name (aligned, more compact) */}
          <Link
            href={brandHref}
            className="inline-flex items-center space-x-2 text-xs sm:text-[13px] font-semibold text-[#ea580c] hover:text-[#c2410c] transition-colors mb-1.5"
          >
            {brandLogo && (
              <div className="relative h-7 w-11 sm:h-8 sm:w-12 shrink-0 bg-white border border-gray-100 rounded-md p-0.5 flex items-center justify-center shadow-2xs">
                <Image
                  src={brandLogo}
                  alt={product.brandName}
                  fill
                  className="object-contain p-0.5"
                />
              </div>
            )}
            <span className="font-semibold">{product.brandName}</span>
          </Link>

          {/* 2. Product Name heading */}
          <h1 className="mb-3 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-snug tracking-tight">
            {product.name}
          </h1>

          {/* 3 to 7. Tightened Label-Value Rows */}
          <div className="space-y-2 text-gray-700">
            {/* 3. Product Name */}
            <div className="flex items-baseline text-xs sm:text-[13px]">
              <span className="w-32 font-semibold text-gray-900 shrink-0">Product Name:</span>
              <span className="ml-2 font-normal text-gray-600 break-words">{product.name}</span>
            </div>

            {/* 4. Product Code / SKU */}
            <div className="flex items-baseline text-xs sm:text-[13px]">
              <span className="w-32 font-semibold text-gray-900 shrink-0">Product Code:</span>
              <span className="ml-2 font-normal text-gray-600 font-mono">
                {product.sku || product.id}
              </span>
            </div>

            {/* 5. Unit in Business */}
            <div className="flex items-baseline text-xs sm:text-[13px]">
              <span className="w-32 font-semibold text-gray-900 shrink-0">Unit in Business:</span>
              <span className="ml-2 font-normal text-gray-600">{product.packSize || 'PCS'}</span>
            </div>

            {/* 6. Category */}
            <div className="flex items-baseline text-xs sm:text-[13px]">
              <span className="w-32 font-semibold text-gray-900 shrink-0">Category:</span>
              <Link
                href={categoryHref}
                className="ml-2 font-normal text-[#ea580c] hover:underline"
              >
                {product.categoryName}
              </Link>
            </div>

            {/* 7. Brand */}
            <div className="flex items-baseline text-xs sm:text-[13px]">
              <span className="w-32 font-semibold text-gray-900 shrink-0">Brand:</span>
              <Link
                href={brandHref}
                className="ml-2 font-normal text-[#ea580c] hover:underline"
              >
                {product.brandName}
              </Link>
            </div>

            {/* 8. Compact & Consistently Sized Wishlist and Add Cart Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`flex w-36 sm:w-40 h-9 sm:h-10 items-center justify-center space-x-2 overflow-hidden rounded-md border px-3 sm:px-4 text-center text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  inWishlist
                    ? 'border-rose-500 bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'border-slate-800 text-slate-800 hover:border-[#ea580c] hover:bg-[#ea580c] hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{inWishlist ? 'In Wishlist' : 'Wishlist'}</span>
              </button>

              {/* Add Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                aria-label="Add Cart"
                className={`flex w-36 sm:w-40 h-9 sm:h-10 items-center justify-center space-x-2 overflow-hidden rounded-md border px-3 sm:px-4 text-center text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  addedFeedback
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-[#ea580c] bg-[#ea580c] text-white hover:bg-[#c2410c] hover:border-[#c2410c] shadow-xs'
                }`}
              >
                {addedFeedback ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                <span>{addedFeedback ? 'Added Cart' : 'Add Cart'}</span>
              </button>

              {cartItem && !addedFeedback && (
                <Link
                  href="/cart"
                  className="text-xs font-semibold text-slate-500 hover:text-[#004b87] underline ml-1 cursor-pointer transition-colors"
                  title="View Dedicated Quote Cart"
                >
                  In quote cart: {cartItem.quantity} (View Cart)
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* C. Similar Products Section with tighter whitespace */}
      {relatedProducts.length > 0 && (
        <section
          className="flex flex-col mt-8 sm:mt-10 pt-6 border-t border-gray-100"
          aria-labelledby="similar-products-heading"
        >
          <h2
            id="similar-products-heading"
            className="mb-3 text-lg sm:text-xl font-semibold text-gray-800"
          >
            Similar Products
          </h2>
          <div className="relative w-full">
            <div className="flex space-x-3.5 sm:space-x-4 overflow-x-auto overflow-y-hidden pb-3 scrollbar-thin scrollbar-thumb-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
              {relatedProducts.map((rel) => (
                <div key={rel.id} className="w-44 sm:w-48 shrink-0">
                  <ProductCard product={rel} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
