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
      className={`group relative flex flex-col justify-between bg-white border-2 border-white hover:border-[#3B82F6]/40 rounded-[24px] transition-all duration-300 ease-out shadow-[0_8px_24px_-4px_rgba(22,58,95,0.08),0_2px_8px_-2px_rgba(22,58,95,0.04)] hover:shadow-[0_16px_36px_-4px_rgba(22,58,95,0.14),0_6px_14px_-2px_rgba(22,58,95,0.08)] hover:-translate-y-1.5 h-full select-none cursor-pointer overflow-hidden ${className}`}
    >
      {/* 1. Presentation Stage Area (Strict Reference Replication: Filled Sky-Blue Arches, Foliage & 3D Podium) */}
      <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-[#A6D3F8] via-[#C4E2FB] to-[#E8F3FD] flex items-center justify-center overflow-hidden border-b border-[#D5E8F8]">
        {/* Layered Filled Sky-Blue Architectural Arches (Matching Reference Design Image 2) */}
        {/* Left Solid Filled Arch */}
        <div className="absolute left-2.5 top-3 w-[62%] h-[78%] rounded-t-[100px] bg-gradient-to-b from-[#7FB4F1] via-[#92C4F5] to-[#A4D0F8] shadow-2xs pointer-events-none" />
        {/* Right Solid Filled Arch */}
        <div className="absolute right-2.5 top-7 w-[58%] h-[72%] rounded-t-[90px] bg-gradient-to-b from-[#94C5F6] via-[#A8D3F9] to-[#BCDDFB] pointer-events-none" />

        {/* Botanical Palm Foliage on Left Side of Stage (Exact Match with Image 2) */}
        <div className="absolute left-1 bottom-10 sm:bottom-12 w-12 sm:w-14 h-32 sm:h-36 pointer-events-none z-1 drop-shadow-sm">
          <Image
            src="/assets/decorations/stage_palm_foliage.webp"
            alt=""
            fill
            className="object-contain object-left-bottom"
            unoptimized
          />
        </div>

        {/* Floating Add-to-Cart Action (Preserves Full Cart Functionality) */}
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
              : 'bg-white/95 backdrop-blur-xs border-[#CFDFEC] text-[#163A5F] hover:text-white hover:bg-[#2563EB] hover:border-[#2563EB] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer active:scale-95'
          }`}
        >
          {showAddedConfirmation ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </button>

        {/* Large 3D Circular White Podium Stage (Spans ~88% of Card Width Matching Image 2) */}
        <div className="absolute bottom-3 w-[88%] max-w-[235px] h-14 sm:h-16 flex flex-col items-center pointer-events-none">
          {/* Ambient Contact Shadow Underneath Pedestal */}
          <div className="absolute -bottom-2 w-[96%] h-6 bg-[#0B2545]/22 blur-[6px] rounded-[50%]" />
          {/* Cylinder Base Rim (Depth & Curvature) */}
          <div className="absolute bottom-0 w-[92%] h-6 bg-gradient-to-b from-white via-[#EFF4F9] to-[#C9D7E4] rounded-b-[50%] border-x border-b border-[#B2C5D6] shadow-xs" />
          {/* Top Disc Surface (Bright Elliptical Platform) */}
          <div className="absolute top-0 w-[92%] h-8 bg-gradient-to-b from-white via-[#FCFDFE] to-[#DFECF6] rounded-[50%] border border-[#C5D7E6] shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.98),0_2px_5px_rgba(11,37,69,0.08)]" />
        </div>

        {/* Product Image on Podium (Prominent, Centered, Resting on Disc) */}
        <Link
          href={productUrl}
          className="relative z-10 w-full h-full flex items-center justify-center focus:outline-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="relative w-full h-full transition-transform duration-300 ease-out group-hover:scale-105">
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              onError={() => setImgSrc(getVersionedImageUrl('/assets/placeholder-product.svg'))}
            />
          </div>
        </Link>
      </div>

      {/* 2. Premium White Product Information Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between items-center text-center bg-white">
        {/* Navy-Blue Product Title */}
        <Link
          href={productUrl}
          className="w-full text-xs sm:text-sm font-bold text-[#0B2545] group-hover:text-[#2563EB] line-clamp-2 leading-snug transition-colors hover:underline min-h-[38px] flex items-center justify-center text-center"
          title={product.name}
        >
          <h3 className="line-clamp-2">{product.name}</h3>
        </Link>

        {/* Sky-Blue Decorative Underline Below Product Name (Exact Reference Width & Style) */}
        <div className="w-11 sm:w-12 h-1 bg-[#4A9DF8] rounded-full mx-auto mt-2.5 transition-all duration-300 group-hover:w-16 group-hover:bg-[#2563EB]" />

        {/* Metadata Footer: Brand & Pack Size */}
        <div className="w-full mt-3 pt-2.5 border-t border-[#F1F6FB] flex items-center justify-between text-[11px] text-[#526174]">
          <span className="font-semibold text-[#163A5F] truncate max-w-[110px]" title={brandDisplayName}>
            {brandDisplayName}
          </span>
          <span className="text-slate-400 font-medium truncate max-w-[100px]" title={product.packSize || 'Standard Pack'}>
            {product.packSize || 'Standard Pack'}
          </span>
        </div>
      </div>
    </div>
  );
}
