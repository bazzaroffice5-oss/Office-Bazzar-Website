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
      className={`group relative flex flex-col justify-between bg-white border border-[#DCEBF8] hover:border-[#2563EB]/40 rounded-[24px] transition-all duration-300 ease-out shadow-[0_4px_20px_-2px_rgba(22,58,95,0.08),0_2px_6px_-1px_rgba(22,58,95,0.04)] hover:shadow-[0_16px_36px_-4px_rgba(22,58,95,0.14),0_6px_14px_-2px_rgba(22,58,95,0.08)] hover:-translate-y-1.5 h-full select-none cursor-pointer overflow-hidden ${className}`}
    >
      {/* 1. Presentation Stage Area (Strict Reference Replication: Light Blue Decorative Arches, Foliage & 3D Cylindrical Podium) */}
      <div className="relative w-full h-52 sm:h-56 md:h-60 bg-gradient-to-b from-[#D2EBFE] via-[#E2F1FE] to-[#F2F8FE] flex items-center justify-center overflow-hidden border-b border-[#E0EDFA]">
        {/* Layered Decorative Sky-Blue Arches */}
        {/* Left Decorative Arch */}
        <div className="absolute left-3 top-3 w-[56%] h-44 rounded-t-[84px] bg-gradient-to-b from-[#B8DCFD] via-[#CCE7FE] to-transparent/30 border-t border-x border-white/70 shadow-2xs pointer-events-none" />
        {/* Right Decorative Arch */}
        <div className="absolute right-3 top-7 w-[52%] h-40 rounded-t-[76px] bg-gradient-to-b from-[#C4E3FD] via-[#D8ECFE] to-transparent/25 border-t border-x border-white/80 pointer-events-none" />
        
        {/* Subtle Botanical Palm Leaf Silhouette on Left (Matching Reference) */}
        <svg
          className="absolute left-1 top-8 w-6 sm:w-7 h-28 text-emerald-600/80 pointer-events-none z-1 drop-shadow-xs"
          viewBox="0 0 28 112"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M4 110C6 85 10 55 22 15" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 25C18 20 25 18 26 22C27 26 21 30 14 30" fill="#22C55E" opacity="0.85" />
          <path d="M10 40C16 35 24 34 25 38C26 42 19 46 11 45" fill="#16A34A" opacity="0.8" />
          <path d="M8 58C14 53 22 53 23 57C24 61 17 64 9 63" fill="#22C55E" opacity="0.85" />
          <path d="M7 76C12 72 20 72 21 76C22 80 15 82 8 81" fill="#15803D" opacity="0.75" />
          <path d="M6 94C11 90 18 90 19 94C20 98 13 100 7 99" fill="#16A34A" opacity="0.7" />
        </svg>

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

        {/* 3D Cylindrical Podium Stage (Direct Visual Replication of Reference) */}
        <div className="absolute bottom-2.5 w-[84%] max-w-[215px] h-12 flex flex-col items-center pointer-events-none">
          {/* Ambient Contact Shadow Underneath Pedestal */}
          <div className="absolute -bottom-1.5 w-[94%] h-5 bg-[#0F2942]/16 blur-[5px] rounded-[50%]" />
          {/* Cylinder Base Rim (Depth) */}
          <div className="absolute bottom-0 w-[90%] h-4 bg-gradient-to-b from-white via-[#EFF5FA] to-[#CFDDEB] rounded-b-[50%] border-x border-b border-[#B8CAD8] shadow-2xs" />
          {/* Top Disc Surface */}
          <div className="absolute top-0.5 w-[90%] h-7 bg-gradient-to-b from-white via-[#FAFCFE] to-[#E6F0F8] rounded-[50%] border border-[#CFDFEC] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_4px_rgba(22,58,95,0.06)]" />
        </div>

        {/* Product Image on Podium (Centered, Proportional Scale, Resting on Disc) */}
        <Link
          href={productUrl}
          className="relative z-10 w-[78%] h-[72%] max-h-[155px] sm:max-h-[170px] flex items-center justify-center mb-4.5 focus:outline-none"
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
              className="object-contain mix-blend-multiply filter drop-shadow-[0_6px_10px_rgba(15,37,68,0.12)]"
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
          className="w-full text-xs sm:text-sm font-bold text-[#0F2942] group-hover:text-[#2563EB] line-clamp-2 leading-snug transition-colors hover:underline min-h-[38px] flex items-center justify-center text-center"
          title={product.name}
        >
          <h3 className="line-clamp-2">{product.name}</h3>
        </Link>

        {/* Small Blue Decorative Underline Below Product Name (Matching Reference) */}
        <div className="w-9 sm:w-11 h-1 bg-[#3B82F6] rounded-full mx-auto mt-2.5 transition-all duration-300 group-hover:w-14 group-hover:bg-[#2563EB]" />

        {/* Metadata Footer: Brand & Pack Size */}
        <div className="w-full mt-2.5 pt-2 border-t border-[#F1F6FB] flex items-center justify-between text-[11px] text-[#526174]">
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
