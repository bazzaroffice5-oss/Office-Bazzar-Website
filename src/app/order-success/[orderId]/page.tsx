import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CheckCircle2, PackageCheck, Truck, FileText } from 'lucide-react';
import { getOrderById } from '@/lib/db/store';
import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Order Confirmation | Office Bazzar',
  description: 'Order confirmation and receipt details.',
  path: '/cart',
  noIndex: true,
});

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold text-emerald-700">
            Order Confirmed &amp; Invoiced
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Your corporate order has been securely logged at OfficeBazzar Tower, Royapettah, Chennai. We have dispatched a confirmation receipt to <strong>{order.customerEmail}</strong>.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block max-w-sm w-full text-left">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Order Reference:</span>
            <span className="font-mono font-bold text-blue-950 text-sm">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-slate-500">Payment Status:</span>
            <span
              className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded ${
                order.paymentStatus === 'paid'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-amber-700 bg-amber-50'
              }`}
            >
              {order.paymentStatus === 'paid' ? 'Paid / Verified' : 'Pending Verification'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-slate-500">Estimated Dispatch:</span>
            <span className="font-bold text-slate-900">Same Day / Next Day</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Track Order Status</span>
          </Link>
          <Link
            href="/products"
            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Itemized Order Details & Invoice Preview */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Order Details &amp; Tax Breakdown</h2>
            <p className="text-xs text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          {order.gstin && (
            <div className="text-right text-xs">
              <span className="text-slate-400">GSTIN:</span>{' '}
              <span className="font-mono font-bold text-blue-950">{order.gstin}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                  <Image src={item.productImage} alt={item.productName} fill quality={85} className="object-contain p-1" sizes="48px" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                  <div className="text-[11px] text-slate-400">
                    SKU: {item.sku} • Qty: {item.quantity} ({item.packSize})
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-slate-950">₹{item.totalPrice.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-slate-400">₹{item.unitPrice.toLocaleString('en-IN')} / unit</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="pt-4 border-t border-slate-200 space-y-1.5 text-xs max-w-xs ml-auto">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-bold text-slate-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Coupon Discount:</span>
              <span>-₹{order.discountAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>18% GST Amount:</span>
            <span className="font-bold text-slate-900">₹{order.gstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Shipping:</span>
            <span className="font-bold">
              {order.shippingCharge === 0 ? <span className="text-emerald-600">FREE</span> : `₹${order.shippingCharge}`}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-blue-950">
            <span>Total Paid:</span>
            <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Shipping Address Recap */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-500" />
              <span>Shipping Destination</span>
            </div>
            <div className="text-slate-600 space-y-0.5">
              <div>{order.shippingAddress.fullName}</div>
              <div>{order.shippingAddress.addressLine1}</div>
              {order.shippingAddress.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
              <div>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</div>
              <div>Phone: {order.shippingAddress.phone}</div>
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-900" />
              <span>Billing &amp; Tax Entity</span>
            </div>
            <div className="text-slate-600 space-y-0.5">
              <div>{order.companyName || order.customerName}</div>
              {order.gstin && <div>GSTIN: {order.gstin}</div>}
              <div>Email: {order.customerEmail}</div>
              <div>Payment: {order.paymentMethod}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
