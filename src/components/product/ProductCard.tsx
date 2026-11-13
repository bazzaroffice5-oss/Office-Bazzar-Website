'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { getVersionedImageUrl } from '@/lib/utils/image';

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if the user clicked on or inside a button (e.g. cart button)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-cart-button]')) {
      return;
    }
    router.push(productUrl);
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

  // Safe image fallback with dynamic error recovery (strictly new supplier catalog only)
  const rawImage =
    (product.images && product.images[0]) ||
    ((product as unknown as { image?: string }).image);
  const isValidNewImage =
    typeof rawImage === 'string' &&
    (rawImage.startsWith('/assets/products/catalog_2026/') ||
      rawImage.startsWith('/assets/supplier-library/') ||
      rawImage.startsWith('/assets/product/'));
  const initialImage = isValidNewImage
    ? getVersionedImageUrl(rawImage)
    : getVersionedImageUrl('/assets/placeholder-product.svg');
  const [imgSrc, setImgSrc] = useState<string>(initialImage);

  const brandDisplayName = product.brandName || 'OfficeBazzar';

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-white border border-[#E2EBE3] hover:border-[#3B82F6]/50 rounded-[22px] transition-all duration-300 ease-out shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_6px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.1),0_4px_10px_-2px_rgba(0,0,0,0.05)] hover:-translate-y-1 h-full select-none cursor-pointer overflow-hidden ${className}`}
    >
      {/* 1. White Product Image Display Area (Strict IMAGE 2 Reference: Clean White Stage, Centered Product, Object-Fit Contain) */}
      <div className="relative w-full h-56 sm:h-64 bg-white flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {/* Floating Add-to-Cart Action (Preserves Full Cart Functionality, Elegant Hover) */}
        <button
          type="button"
          data-cart-button="true"
          onClick={handleAddToCart}
          disabled={isAdding}
          aria-label={showAddedConfirmation ? 'Added to Quote Cart' : 'Add to Quote Cart'}
          title="Add to Quote Cart"
          className={`absolute top-3 right-3 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs border ${
            showAddedConfirmation
              ? 'bg-emerald-600 border-emerald-600 text-white opacity-100 scale-105'
              : 'bg-white/95 backdrop-blur-xs border-[#E2EBE3] text-[#526174] hover:text-white hover:bg-[#2563EB] hover:border-[#2563EB] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer active:scale-95'
          }`}
        >
          {showAddedConfirmation ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </button>

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
              onError={() => setImgSrc(getVersionedImageUrl('/assets/placeholder-product.svg'))}
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

        {/* Brand Name on Left & Standard Pack on Right (Exact Match with IMAGE 2) */}
        <div className="w-full flex items-center justify-between mt-4 pt-2.5 border-t border-slate-100">
          <span
            className="text-[11px] sm:text-xs font-semibold text-[#0B2545] truncate max-w-[130px] text-left"
            title={brandDisplayName}
          >
            {brandDisplayName}
          </span>
          <span className="text-[10px] sm:text-[11px] font-normal text-slate-400 shrink-0 text-right">
            Standard Pack
          </span>
        </div>
      </div>
    </div>
  );
}
