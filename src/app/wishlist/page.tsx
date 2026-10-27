'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
          <Heart className="w-6 h-6 fill-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Wishlist ({wishlist.length})
          </h1>
          <p className="text-xs text-slate-500">
            Saved corporate supplies ready for ordering or approval.
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Your wishlist is empty</h2>
          <p className="text-xs text-slate-500">
            Browse our catalog and click the heart icon on any product to save it for quick reordering.
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-3 hover:shadow-lg transition-all"
            >
              <div>
                <div className="relative pt-[85%] bg-slate-50 rounded-xl overflow-hidden mb-3">
                  <Image src={product.images[0]} alt={product.name} fill quality={85} className="object-contain p-2" sizes="250px" />
                </div>
                <div className="text-xs font-semibold text-blue-900">
                  {product.brandName}
                </div>
                <Link
                  href={`/product/${product.slug}`}
                  className="block text-xs font-semibold text-slate-900 hover:text-blue-900 line-clamp-2 mt-1 leading-snug"
                >
                  {product.name}
                </Link>
                <div className="text-base font-bold text-slate-900 mt-2">
                  {product.price && product.price > 0
                    ? `₹${product.price.toLocaleString('en-IN')}`
                    : 'Price on Request (RFQ)'}
                </div>
                {product.price && product.price > 0 ? (
                  <div className="text-[10px] text-slate-400">Excl. {product.gstPercent || 18}% GST</div>
                ) : (
                  <div className="text-[10px] text-emerald-600 font-medium">B2B Wholesale Quote</div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product, 1);
                    removeFromWishlist(product.id);
                  }}
                  className="flex-1 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeFromWishlist(product.id)}
                  className="p-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
