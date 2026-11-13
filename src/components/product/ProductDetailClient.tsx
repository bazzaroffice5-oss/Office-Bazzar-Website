'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Check, Heart, ShieldCheck } from 'lucide-react';
import { Brand, Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { getBrandLogoUrl } from '@/lib/utils/brandLogos';
import { getVersionedImageUrl } from '@/lib/utils/image';
import ProductCard from './ProductCard';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  brand?: Brand | null;
}

const FALLBACK_IMAGE =
  '/assets/placeholder-product.svg';

export default function ProductDetailClient({
  product,
  relatedProducts,
  brand,
}: ProductDetailClientProps) {
  const { addToCart, items } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Active image selector (strictly new supplier catalog only)
  const validImages = (product.images && product.images.length > 0 ? product.images : []).filter(
    (img) => typeof img === 'string' && (img.startsWith('/assets/products/catalog_2026/') || img.startsWith('/assets/supplier-library/') || img.startsWith('/assets/product/'))
  );
  const rawImages = validImages.length > 0 ? validImages : [FALLBACK_IMAGE];
  const productImages = rawImages.map((img) => getVersionedImageUrl(img));
  const [activeImage, setActiveImage] = useState<string>(productImages[0]);

  const inWishlist = isInWishlist(product.id);
  const cartItem = items.find((i) => i.product.id === product.id);

  // Resolve brand logo
  const brandLogo = getBrandLogoUrl(product.brandName, brand?.logoUrl);

  // Navigation Links
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
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-[#111827]">
      {/* 1. Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-1.5 text-xs text-[#526174] mb-6 flex-wrap gap-y-1 font-normal"
      >
        <Link href="/categories" className="text-[#526174] hover:text-[#163A5F] transition-colors">
          Categories
        </Link>
        <span className="text-[#526174]/40">/</span>

        {product.categoryName && (
          <>
            <Link href={categoryHref} className="text-[#526174] hover:text-[#163A5F] transition-colors">
              {product.categoryName}
            </Link>
            <span className="text-[#526174]/40">/</span>
          </>
        )}

        {product.subcategoryName && subcategoryHref && (
          <>
            <Link href={subcategoryHref} className="text-[#526174] hover:text-[#163A5F] transition-colors">
              {product.subcategoryName}
            </Link>
            <span className="text-[#526174]/40">/</span>
          </>
        )}

        <span className="font-semibold text-[#111827] truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Section (Two-Column Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column — Large Product Image Container */}
        <div className="md:col-span-5 lg:col-span-5 flex flex-col space-y-4">
          <div className="w-full aspect-square rounded-2xl border border-[#E2EBE3] bg-white p-6 flex items-center justify-center relative overflow-hidden shadow-xs">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-contain p-4 transition-transform duration-300 hover:scale-105"
              onError={() => setActiveImage(getVersionedImageUrl(FALLBACK_IMAGE))}
            />
          </div>

          {/* Thumbnail Gallery (if multiple images exist) */}
          {productImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`relative w-16 h-16 rounded-xl border p-1 bg-white shrink-0 overflow-hidden transition-all cursor-pointer ${
                    activeImage === img
                      ? 'border-[#F97316] ring-2 ring-[#F97316]/30 shadow-xs'
                      : 'border-[#E2EBE3] hover:border-[#163A5F]/40'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    loading="lazy"
                    sizes="64px"
                    className="object-contain p-0.5"
                  />
                </button>
              ))}
            </div>
          )}

          {/* OfficeBazzar Authenticity Badge */}
          <div className="p-3.5 rounded-xl bg-[#EFF6F0] border border-[#E2EBE3] flex items-center justify-center gap-2 text-xs text-[#163A5F] font-medium text-center">
            <ShieldCheck className="w-4 h-4 text-[#F97316] shrink-0" />
            <span>OfficeBazzar Certified Procurement • Royapettah Fulfillment Hub</span>
          </div>
        </div>

        {/* Right Column — Product Details */}
        <div className="md:col-span-7 lg:col-span-7 flex flex-col space-y-5">
          {/* Brand Header & Logo */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={brandHref}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#F97316] hover:text-[#F97316]/80 transition-colors"
            >
              {brandLogo && (
                <div className="relative h-7 w-12 shrink-0 bg-white border border-[#E2EBE3] rounded-md p-0.5 flex items-center justify-center shadow-2xs">
                  <Image
                    src={brandLogo}
                    alt={product.brandName}
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
              )}
              <span>{product.brandName}</span>
            </Link>

            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526174] bg-white px-2.5 py-0.5 rounded-md border border-[#E2EBE3]">
              Corporate Catalogue
            </span>
          </div>

          {/* Large Product Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] leading-snug tracking-tight">
            {product.name}
          </h1>

          {/* Key Specifications & Metadata Table */}
          <div className="bg-[#EFF6F0] border border-[#E2EBE3] rounded-2xl p-4 sm:p-5 space-y-3">
            {/* Product Name */}
            <div className="flex items-baseline text-xs sm:text-sm">
              <span className="w-36 font-semibold text-[#111827] shrink-0">Product Name:</span>
              <span className="font-normal text-[#526174] break-words">{product.name}</span>
            </div>

            {/* Product Code / SKU */}
            <div className="flex items-baseline text-xs sm:text-sm">
              <span className="w-36 font-semibold text-[#111827] shrink-0">Product Code:</span>
              <span className="font-mono font-medium text-[#111827] px-2 py-0.5 rounded bg-white border border-[#E2EBE3] text-xs">
                {product.sku || product.id}
              </span>
            </div>

            {/* Unit in Business */}
            <div className="flex items-baseline text-xs sm:text-sm">
              <span className="w-36 font-semibold text-[#111827] shrink-0">Unit in Business:</span>
              <span className="font-semibold text-[#111827]">{product.packSize || 'Standard Pack'}</span>
            </div>

            {/* Category */}
            <div className="flex items-baseline text-xs sm:text-sm">
              <span className="w-36 font-semibold text-[#111827] shrink-0">Category:</span>
              <Link
                href={categoryHref}
                className="font-medium text-[#163A5F] hover:underline"
              >
                {product.categoryName}
              </Link>
            </div>

            {/* Brand */}
            <div className="flex items-baseline text-xs sm:text-sm">
              <span className="w-36 font-semibold text-[#111827] shrink-0">Brand:</span>
              <Link
                href={brandHref}
                className="font-medium text-[#163A5F] hover:underline"
              >
                {product.brandName}
              </Link>
            </div>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="pt-2 text-sm text-[#526174] leading-relaxed space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                Product Overview
              </h2>
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Technical Specifications (if available) */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            (() => {
              const IGNORED_KEYS = new Set(['source', 'catalogueCode', 'brand', 'category', 'subcategory', 'inventoryStatus', '0', '1', '2', '3', '4', '5']);
              const validEntries = Object.entries(product.specifications).filter(
                ([k, v]) => !IGNORED_KEYS.has(k) && typeof v === 'string' && v.trim().length > 0 && isNaN(Number(k))
              );
              if (validEntries.length === 0) return null;

              const formatKey = (k: string) => {
                if (k === 'specs') return 'Technical Specifications';
                if (k === 'cataloguePage') return 'Catalogue Reference Page';
                if (k === 'stockVerification') return 'Verification Status';
                return k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
              };

              return (
                <div className="pt-2 text-sm text-[#526174] leading-relaxed space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                    Technical Specifications
                  </h2>
                  <div className="border border-[#E2EBE3] rounded-xl overflow-hidden divide-y divide-[#E2EBE3] bg-white text-xs">
                    {validEntries.map(([k, v]) => (
                      <div key={k} className="flex px-3.5 py-2.5">
                        <span className="w-44 font-semibold text-[#111827] shrink-0">{formatKey(k)}:</span>
                        <span className="text-[#526174] break-words">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}

          {/* Action Buttons: Wishlist & Add Cart (Quote Cart) */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            {/* Wishlist Button */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`flex h-11 items-center justify-center space-x-2 px-5 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                inWishlist
                  ? 'border-rose-500 bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'border-[#163A5F] text-[#163A5F] hover:border-[#163A5F] hover:bg-[#163A5F] hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{inWishlist ? 'In Wishlist' : 'Wishlist'}</span>
            </button>

            {/* Add Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label="Add Cart"
              className={`flex h-11 items-center justify-center space-x-2 px-6 rounded-xl text-sm font-bold text-white shadow-md transition-all duration-200 cursor-pointer ${
                addedFeedback
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-[#F97316] hover:bg-[#F97316]/90 shadow-[#F97316]/25'
              }`}
            >
              {addedFeedback ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Added to Quote Cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Cart</span>
                </>
              )}
            </button>

            {cartItem && !addedFeedback && (
              <Link
                href="/cart"
                className="text-xs font-semibold text-[#526174] hover:text-[#F97316] underline ml-2 cursor-pointer transition-colors"
                title="View Dedicated Quote Cart"
              >
                In quote cart: {cartItem.quantity} (View Cart)
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. Similar Products Section */}
      {relatedProducts.length > 0 && (
        <section
          className="mt-10 sm:mt-12 pt-8 border-t border-[#E2EBE3]"
          aria-labelledby="similar-products-heading"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="similar-products-heading"
              className="text-lg sm:text-xl font-bold text-[#111827]"
            >
              Similar Procurement Products
            </h2>
            <Link
              href={categoryHref}
              className="text-xs font-semibold text-[#F97316] hover:underline"
            >
              View More in {product.categoryName} →
            </Link>
          </div>

          <div className="relative w-full">
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
              {relatedProducts.map((rel) => (
                <div key={rel.id} className="w-48 sm:w-52 shrink-0">
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
