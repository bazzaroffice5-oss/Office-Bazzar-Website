'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

const FALLBACK_IMAGE =
  'https://officebazzar.co.in/wp-content/uploads/2022/12/cardboard-tag-file-500x500-1.jpg';

export default function QuoteCartPage() {
  const { items, updateQuantity, removeFromCart, itemCount, subtotal, total } = useCart();

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasPricedItems = items.some((item) => (item.product.price ?? 0) > 0);

  return (
    <main className="min-h-screen bg-slate-50/60 py-6 sm:py-8">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-1.5 text-xs text-slate-500 mb-5 font-normal"
        >
          <Link href="/" className="hover:text-[#004b87] transition-colors">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold">Quote Cart</span>
        </nav>

        {/* Centered Page Heading */}
        <div className="text-center max-w-md mx-auto mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your Quote Cart
          </h1>
          <div className="w-10 h-0.5 bg-[#ea580c] mx-auto mt-2 rounded-full" />
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {itemCount === 0
              ? 'No products currently selected for quotation'
              : `${itemCount} ${itemCount === 1 ? 'product' : 'products'} selected for quotation`}
          </p>
        </div>

        {/* Empty-Cart State */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-7 sm:p-10 text-center border border-slate-200/90 max-w-sm mx-auto space-y-4 shadow-xs my-6">
            <div className="w-14 h-14 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto shadow-2xs">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Your Quote Cart is empty
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Browse our corporate catalog to add stationery, cleaning supplies, and corporate equipment
                for wholesale quotation.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] active:scale-[0.98] text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Populated Cart: Centered, Compact Product Cards (20-25% smaller, centered grid) */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-5 mx-auto">
              {items.map((item) => {
                const product = item.product;
                const displayImage = product.images?.[0] || FALLBACK_IMAGE;
                const productUrl = `/product/${product.slug || product.id}`;
                const hasPrice = (product.price ?? 0) > 0;
                const itemSubtotal = hasPrice ? (product.price ?? 0) * item.quantity : null;

                return (
                  <div
                    key={item.id}
                    className="w-full sm:w-[220px] md:w-[230px] bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-300 hover:shadow-md transition-all duration-200 group shrink-0"
                  >
                    <div>
                      {/* Product Image — Compact & Centered */}
                      <Link
                        href={productUrl}
                        className="relative block h-36 sm:h-40 w-full bg-slate-50 rounded-lg overflow-hidden mb-2.5 group-hover:bg-slate-100/70 transition-colors"
                        title={product.name}
                      >
                        <Image
                          src={displayImage}
                          alt={product.name}
                          fill
                          className="object-contain p-2.5 transition-transform duration-200 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 230px"
                        />
                      </Link>

                      {/* Brand Name in Orange */}
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c] truncate">
                        {product.brandName || 'OfficeBazzar'}
                      </div>

                      {/* Product Name */}
                      <Link
                        href={productUrl}
                        className="block text-xs font-bold text-slate-900 hover:text-[#004b87] line-clamp-2 mt-0.5 leading-snug transition-colors min-h-[32px]"
                        title={product.name}
                      >
                        {product.name}
                      </Link>

                      {/* SKU & Pack size */}
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                        <span>SKU: {product.sku}</span>
                        <span>•</span>
                        <span className="text-slate-600 font-medium truncate max-w-[110px]">
                          {item.selectedPackSize || product.packSize || 'Standard Pack'}
                        </span>
                      </div>

                      {/* Price / Quote Info */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between gap-1">
                        <div>
                          {hasPrice ? (
                            <>
                              <span className="text-sm font-bold text-slate-900">
                                ₹{(product.price ?? 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[9px] text-slate-400 block leading-tight">
                                Excl. {product.gstPercent || 18}% GST
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block">
                              Quote on RFQ
                            </span>
                          )}
                        </div>
                        {itemSubtotal !== null && (
                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-slate-600 block">
                              Total: ₹{itemSubtotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stepper & Remove Action */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center border border-slate-200 rounded-md bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                          aria-label={`Decrease quantity of ${product.name}`}
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-[11px] font-bold text-slate-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                          aria-label={`Increase quantity of ${product.name}`}
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Remove from quote cart"
                        aria-label={`Remove ${product.name} from quote cart`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact Quotation Summary Section */}
            <section
              aria-labelledby="quote-summary-heading"
              className="mt-8 sm:mt-10 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs max-w-4xl mx-auto"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-5">
                <div className="space-y-1.5 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#ea580c]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Official Quotation Summary</span>
                  </div>
                  <h2
                    id="quote-summary-heading"
                    className="text-base sm:text-lg font-bold text-slate-900"
                  >
                    Ready to request your wholesale quotation?
                  </h2>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    Selected{' '}
                    <strong className="text-slate-800">
                      {itemCount} {itemCount === 1 ? 'product' : 'products'}
                    </strong>{' '}
                    ({totalUnits} units).
                    {hasPricedItems && (
                      <>
                        {' '}
                        Est. subtotal:{' '}
                        <strong className="text-slate-900">
                          ₹{subtotal.toLocaleString('en-IN')}
                        </strong>{' '}
                        (Total incl. GST: ₹{total.toLocaleString('en-IN')}).
                      </>
                    )}{' '}
                    Our procurement desk will issue formal GST pricing within 2 hours.
                  </p>

                  {/* Trust Signals */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-0.5 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      GST Input Credit
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Corporate ARC Tiers
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Metro Logistics
                    </span>
                  </div>
                </div>

                {/* Actions: Continue Shopping & Proceed to Request Quote */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto shrink-0">
                  <Link
                    href="/products"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs sm:text-sm transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Continue Shopping</span>
                  </Link>
                  <Link
                    href="/request-quote"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 sm:px-6 sm:py-2.5 bg-[#057a3b] hover:bg-[#046330] active:scale-[0.98] text-white font-bold rounded-lg text-xs sm:text-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <span>Request a Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
