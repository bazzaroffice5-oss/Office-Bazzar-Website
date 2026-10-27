'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    itemCount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-slate-900">
                Your Quotation Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* RFQ Notice Banner */}
          {items.length > 0 && (
            <div className="px-4 sm:px-5 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs font-semibold text-blue-950">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>GST Tax Invoicing &bull; Wholesale Tier Pricing</span>
              </span>
              <span className="text-[10px] font-bold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                Official RFQ
              </span>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Your quotation cart is empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Explore our wholesale office stationery, housekeeping supplies, or printer consumables.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
                >
                  Start Browsing
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="py-3.5 first:pt-0 last:pb-0 flex space-x-3">
                  <div className="relative w-16 h-16 rounded-md bg-white border border-slate-200 overflow-hidden shrink-0">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <Link
                        href={`/product/${item.product.slug}`}
                        onClick={() => setIsCartOpen(false)}
                        className="text-xs font-bold text-slate-900 hover:text-blue-900 line-clamp-2 leading-tight"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-2 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1">
                      Pack: <span className="font-semibold text-slate-700">{item.selectedPackSize || item.product.packSize}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-300 rounded-md bg-slate-50 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Status & SKU */}
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          RFQ Item
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          SKU: {item.product.sku}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer: Quotation Summary (No monetary amounts) */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 space-y-3">
              {/* RFQ Quotation Summary */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Quotation Scope</span>
                  <span className="font-bold text-slate-900">{itemCount} {itemCount === 1 ? 'Product' : 'Products'} selected</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Pricing Model</span>
                  <span className="font-semibold text-blue-900">Direct Wholesale / Volume Tier</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Tax Invoicing</span>
                  <span className="font-semibold text-emerald-700">18% GST Input Credit Eligible</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Dispatch Network</span>
                  <span className="text-emerald-600 font-bold">Chennai &amp; Regional Hubs</span>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-md p-2.5 text-[11px] text-amber-900 leading-snug">
                  Official GST tax invoice quote with institutional volume discounts will be generated for your business upon submission.
                </div>
              </div>

              {/* Quotation Action Button */}
              <div className="pt-2">
                <Link
                  href="/quotation"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 bg-[#d9232d] hover:bg-[#b81822] text-white font-semibold text-sm rounded-md flex items-center justify-center space-x-2 transition-all shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Request Official Quote (RFQ)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="flex items-center justify-center text-[10px] text-slate-500 space-x-1.5 pt-1 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero Payment Required &bull; Official Tax Quotation via Sales Team</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
