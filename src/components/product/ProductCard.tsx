'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

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

  // Safe image fallback
  const displayImage =
    product.images && product.images[0]
      ? product.images[0]
      : 'https://officebazzar.co.in/wp-content/uploads/2022/12/cardboard-tag-file-500x500-1.jpg';

  const brandDisplayName = product.brandName || 'OfficeBazzar';

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-white border border-gray-200/90 hover:border-gray-300 rounded-2xl p-4 sm:p-5 transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-1 h-full select-none cursor-pointer ${className}`}
    >
      {/* Top Action: Compact Cart Icon Button at top-right of product card matching Reference */}
      <div className="relative z-10 flex items-center justify-end w-full">
        <button
          type="button"
          data-cart-button="true"
          onClick={handleAddToCart}
          disabled={isAdding}
          aria-label={showAddedConfirmation ? 'Added Cart' : 'Add Cart'}
          title="Add Cart"
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs border ${
            showAddedConfirmation
              ? 'bg-emerald-600 border-emerald-600 text-white opacity-100 scale-105'
              : 'bg-white border-gray-200/90 text-slate-700 hover:text-white hover:bg-[#ea580c] hover:border-[#ea580c] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer active:scale-95'
          }`}
        >
          {showAddedConfirmation ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Product Image Area: Wrap in Link for native accessibility and SEO */}
      <Link
        href={productUrl}
        className="relative z-10 w-full aspect-square bg-white rounded-xl overflow-hidden my-2 flex items-center justify-center focus:outline-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={displayImage}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3.5 transition-transform duration-200 ease-out group-hover:scale-105"
        />
      </Link>

      {/* Product Name (Left) & Orange Brand Name (Lower-Right) */}
      <div className="relative z-10 mt-auto pt-2 flex items-end justify-between gap-2 min-h-[44px]">
        {/* Product Name clearly visible near bottom */}
        <Link
          href={productUrl}
          className="text-xs sm:text-sm font-medium text-slate-800 group-hover:text-[#004b87] line-clamp-2 leading-snug transition-colors flex-1 hover:underline"
          title={product.name}
        >
          <h3 className="line-clamp-2">{product.name}</h3>
        </Link>

        {/* Brand Name in orange near the lower-right portion, fading in on hover */}
        <span
          className="text-[11px] sm:text-xs font-semibold text-[#ea580c] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 shrink-0 text-right truncate max-w-[120px] pb-0.5"
          title={brandDisplayName}
        >
          {brandDisplayName}
        </span>
      </div>
    </div>
  );
}
