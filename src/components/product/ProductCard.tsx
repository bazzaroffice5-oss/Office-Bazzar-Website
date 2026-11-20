'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { getVersionedImageUrl, resolveProductImageUrl, FALLBACK_PRODUCT_IMAGE } from '@/lib/utils/image';

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export default function ProductCard({
  product,
  className = '',
  priority = false,
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showAddedConfirmation, setShowAddedConfirmation] = useState(false);

  const productUrl = `/product/${product.slug || product.id}`;

  const handleMouseEnter = () => {
    // Proactively prefetch the product detail page on hover for instant navigation
    router.prefetch(productUrl);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if the user clicked on or inside a button (e.g. cart button)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-cart-button]')) {
      return;
    }

    // Preserve exact scroll position of current listing page before navigating to product detail
    if (typeof window !== 'undefined') {
      try {
        const scrollKey = `ob_scroll_${window.location.pathname}${window.location.search}`;
        sessionStorage.setItem(scrollKey, String(window.scrollY));
      } catch {}
    }

    if (!target.closest('a')) {
      router.push(productUrl);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding) return;
    setIsAdding(true);

    addToCart(product, 1, undefined, false);
    setShowAddedConfirmation(true);

    setTimeout(() => {
      setIsAdding(false);
      setShowAddedConfirmation(false);
    }, 1500);
  };

  // Resilient image resolution: accepts API routes, cloud storage, external URLs, and local assets
  const rawImage =
    (product.images && product.images[0]) ||
    ((product as unknown as { image?: string }).image);
  const initialImage = resolveProductImageUrl(rawImage);
  const [imgSrc, setImgSrc] = useState<string>(initialImage);

  // Synchronize state if product props update dynamically
  React.useEffect(() => {
    setImgSrc(resolveProductImageUrl(rawImage));
  }, [rawImage]);

  const brandDisplayName = product.brandName || 'OfficeBazzar';

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      className={`group relative flex flex-col justify-between bg-white border border-[#E2EBE3] hover:border-[#3B82F6]/50 rounded-[22px] transition-all duration-300 ease-out shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_6px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.1),0_4px_10px_-2px_rgba(0,0,0,0.05)] hover:-translate-y-1 h-full select-none cursor-pointer overflow-hidden ${className}`}
    >
      {/* 1. Product Image Display Area (Premium Muted Blue Stage #AFC5DC, Centered Product, Object-Fit Contain) */}
      <div className="relative w-full h-56 sm:h-64 bg-[#AFC5DC] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {/* Clean Centered Image Stage */}
        <Link
          href={productUrl}
          className="relative z-10 w-full h-full flex items-center justify-center focus:outline-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="relative w-full h-full transition-transform duration-300 ease-out group-hover:scale-105 flex items-center justify-center">
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain object-center"
              onError={() => {
                if (imgSrc !== getVersionedImageUrl(FALLBACK_PRODUCT_IMAGE)) {
                  setImgSrc(getVersionedImageUrl(FALLBACK_PRODUCT_IMAGE));
                }
              }}
            />
          </div>
        </Link>
      </div>

      {/* 2. Premium White Product Information Section (Strict IMAGE 2 Reference) */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between items-center text-center bg-white border-t border-slate-100/60">
        {/* Navy-Blue Product Title */}
        <Link
          href={productUrl}
          className="w-full text-xs sm:text-sm font-bold text-[#0B2545] group-hover:text-[#2563EB] line-clamp-2 leading-snug transition-colors hover:underline min-h-[38px] flex items-center justify-center text-center"
          title={product.name}
        >
          <h3 className="line-clamp-2">{product.name}</h3>
        </Link>

        {/* Sky-Blue Decorative Underline Below Product Name */}
        <div className="w-10 sm:w-12 h-1 bg-[#4A9DF8] rounded-full mx-auto mt-2 transition-all duration-300 group-hover:w-16 group-hover:bg-[#2563EB]" />

        {/* Brand Name & Cart Icon Button on Left, Standard Pack on Right */}
        <div className="w-full flex items-center justify-between gap-2 mt-4 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-[11px] sm:text-xs font-semibold text-[#0B2545] truncate max-w-[105px] sm:max-w-[125px] text-left"
              title={brandDisplayName}
            >
              {brandDisplayName}
            </span>
            <button
              type="button"
              data-cart-button="true"
              onClick={handleAddToCart}
              disabled={isAdding}
              aria-label={showAddedConfirmation ? 'Added to Quote Cart' : 'Add to Quote Cart'}
              title="Add to Quote Cart"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 border shrink-0 ${
                showAddedConfirmation
                  ? 'bg-emerald-600 border-emerald-600 text-white scale-105'
                  : 'bg-slate-50 hover:bg-[#2563EB] border-slate-200 hover:border-[#2563EB] text-[#526174] hover:text-white cursor-pointer active:scale-95 shadow-2xs'
              }`}
            >
              {showAddedConfirmation ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <span className="text-[10px] sm:text-[11px] font-normal text-slate-400 shrink-0 text-right">
            Standard Pack
          </span>
        </div>
      </div>
    </div>
  );
}
