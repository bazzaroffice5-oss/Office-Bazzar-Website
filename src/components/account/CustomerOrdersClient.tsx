'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PackageCheck, Truck, FileText, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';

interface CustomerOrdersClientProps {
  initialOrders: Order[];
}

export default function CustomerOrdersClient({ initialOrders }: CustomerOrdersClientProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Sign in to view your orders</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Customer order histories and GST tax invoices are protected. Please sign in with your corporate account to view your past procurements.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Sign In to Your Account
        </Link>
      </div>
    );
  }

  // Filter orders strictly belonging to the active user
  const userOrders = initialOrders.filter((o) => {
    const emailMatch = o.customerEmail?.toLowerCase() === user.email?.toLowerCase();
    const phoneMatch = user.phone && o.customerPhone === user.phone;
    return emailMatch || phoneMatch;
  });

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-amber-900">
            You are logged in as an Administrator. You are viewing your personal orders below.
          </span>
          <Link
            href="/admin"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
          >
            Open Admin Console (All Orders)
          </Link>
        </div>
      )}

      {userOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <PackageCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">No previous orders found for {user.email}</h2>
          <p className="text-xs text-slate-500">
            Orders placed on your corporate account will appear here with instant tracking numbers.
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-2.5 bg-blue-900 text-white text-xs font-bold rounded-xl"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {userOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Order Header Bar */}
              <div className="p-5 sm:px-6 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px]">ORDER PLACED</span>
                  <span className="font-bold text-slate-800">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-[10px]">TOTAL AMOUNT</span>
                  <span className="font-bold text-blue-950">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">(incl. 18% GST)</span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-[10px]">ORDER NUMBER</span>
                  <span className="font-mono font-semibold text-slate-800">{order.orderNumber}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-semibold uppercase rounded-full">
                    {order.orderStatus}
                  </span>
                  <Link
                    href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                    className="p-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center space-x-1"
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-900" />
                    <span>Track</span>
                  </Link>
                </div>
              </div>

              {/* Items List */}
              <div className="p-5 sm:p-6 divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-100">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        quality={85}
                        className="object-contain p-1.5"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1">
                        {item.productName}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-0.5 space-x-2">
                        <span>SKU: {item.sku}</span>
                        <span>•</span>
                        <span>Pack: {item.packSize || '1 Unit'}</span>
                        <span>•</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        ₹{item.totalPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ₹{item.unitPrice.toLocaleString('en-IN')} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & Invoicing Details */}
              <div className="p-4 px-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="text-slate-500 flex items-center space-x-4">
                  {order.gstin && (
                    <span>
                      GSTIN: <strong className="text-slate-800">{order.gstin}</strong>
                    </span>
                  )}
                  <span>Payment: <strong className="text-slate-800 uppercase">{order.paymentMethod.replace('_', ' ')}</strong></span>
                </div>

                <Link
                  href={`/order-success/${order.id}`}
                  className="inline-flex items-center space-x-1.5 text-blue-900 font-bold hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Printable Tax Invoice</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
