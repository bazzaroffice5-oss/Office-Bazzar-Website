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
      className={`group relative flex flex-col justify-between bg-white border border-[#E2EBE3] hover:border-[#163A5F]/35 rounded-[22px] transition-all duration-300 ease-out shadow-[0_4px_20px_-2px_rgba(22,58,95,0.06),0_2px_6px_-1px_rgba(22,58,95,0.04)] hover:shadow-[0_16px_36px_-4px_rgba(22,58,95,0.12),0_6px_14px_-2px_rgba(22,58,95,0.06)] hover:-translate-y-1.5 h-full select-none cursor-pointer overflow-hidden ${className}`}
    >
      {/* 1. Presentation Stage Area (Matching Reference 3D Podium & Arched Backdrop) */}
      <div className="relative w-full h-48 sm:h-52 md:h-56 bg-gradient-to-b from-[#FAFDFB] via-[#F4F8F5] to-white flex items-center justify-center overflow-hidden border-b border-[#EFF5F0]">
        {/* Soft Layered Arched Backdrop */}
        <div className="absolute top-3 w-[84%] h-44 rounded-t-[100px] bg-gradient-to-b from-white/90 via-[#EDF5EF]/60 to-transparent border-t border-x border-[#E2EBE3]/60 pointer-events-none" />
        <div className="absolute top-6 w-[68%] h-36 rounded-t-[80px] bg-white/70 pointer-events-none" />

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
              : 'bg-white/90 backdrop-blur-xs border-[#E2EBE3] text-[#526174] hover:text-white hover:bg-[#F97316] hover:border-[#F97316] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer active:scale-95'
          }`}
        >
          {showAddedConfirmation ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </button>

        {/* 3D Cylindrical Podium Stage (Direct Visual Replication of Reference) */}
        <div className="absolute bottom-2.5 w-[80%] max-w-[200px] h-11 flex flex-col items-center pointer-events-none">
          {/* Ambient Contact Shadow Underneath Pedestal */}
          <div className="absolute -bottom-1 w-[92%] h-4 bg-slate-900/[0.08] blur-[4px] rounded-[50%]" />
          {/* Cylinder Base Rim */}
          <div className="absolute bottom-0.5 w-[88%] h-4 bg-gradient-to-b from-white via-[#F2F6F3] to-[#DCE6DE] rounded-b-[50%] border-x border-b border-[#CBD8CE] shadow-2xs" />
          {/* Top Disc Surface */}
          <div className="absolute top-1 w-[88%] h-6 bg-gradient-to-b from-white to-[#F5FAF6] rounded-[50%] border border-[#DCE6DE] shadow-inner" />
        </div>

        {/* Product Image on Podium (Smaller, Centered, Proportional Scale) */}
        <Link
          href={productUrl}
          className="relative z-10 w-[72%] h-[68%] max-h-[140px] sm:max-h-[155px] flex items-center justify-center mb-2.5 focus:outline-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="relative w-full h-full transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-1">
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.08)]"
              onError={() => setImgSrc(getVersionedImageUrl('/assets/placeholder-product.svg'))}
            />
          </div>
        </Link>
      </div>

      {/* 2. Card Content Area (Centered Typography & Distinctive Reference Accent Bar) */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between items-center text-center bg-white">
        {/* Centered Product Title */}
        <Link
          href={productUrl}
          className="w-full text-xs sm:text-sm font-bold text-[#111827] group-hover:text-[#163A5F] line-clamp-2 leading-snug transition-colors hover:underline min-h-[38px] flex items-center justify-center"
          title={product.name}
        >
          <h3 className="line-clamp-2">{product.name}</h3>
        </Link>

        {/* Distinctive Reference Pill Accent Bar */}
        <div className="w-8 sm:w-10 h-1 bg-[#163A5F] rounded-full mx-auto mt-2.5 transition-all duration-300 group-hover:w-14 group-hover:bg-[#F97316]" />

        {/* Metadata: Brand & Pack Size */}
        <div className="w-full mt-2.5 pt-2 border-t border-[#F1F6F2] flex items-center justify-between text-[11px] text-[#526174]">
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
