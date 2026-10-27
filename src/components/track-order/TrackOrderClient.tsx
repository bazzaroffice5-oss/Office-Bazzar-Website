'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  MapPin,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { getOrderByNumber } from '@/lib/db/store';
import { Order } from '@/types';

export default function TrackOrderClient() {
  const searchParams = useSearchParams();
  const initialOrderNum = searchParams.get('orderNumber') || '';

  const [orderQuery, setOrderQuery] = useState(initialOrderNum);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (numToSearch: string) => {
    if (!numToSearch.trim()) return;
    setIsLoading(true);
    setHasSearched(true);

    const order = await getOrderByNumber(numToSearch.trim());
    setSearchedOrder(order);
    setIsLoading(false);
  };

  useEffect(() => {
    if (initialOrderNum) {
      handleSearch(initialOrderNum);
    }
  }, [initialOrderNum]);

  const steps = [
    { title: 'Order Placed', desc: 'Order received & GST invoice generated', status: 'done' },
    { title: 'Warehouse Processing', desc: 'Picked & packed at OfficeBazzar Tower, Royapettah', status: 'done' },
    {
      title: 'Dispatched with Courier',
      desc: searchedOrder?.courierName ? `Handed to ${searchedOrder.courierName}` : 'In transit to delivery hub',
      status: searchedOrder?.orderStatus === 'shipped' || searchedOrder?.orderStatus === 'delivered' ? 'done' : 'pending',
    },
    {
      title: 'Delivered',
      desc: 'Delivered to corporate premises with gate entry pass',
      status: searchedOrder?.orderStatus === 'delivered' ? 'done' : 'pending',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
        <div className="inline-flex p-3 bg-blue-50 text-blue-900 rounded-2xl mx-auto">
          <PackageCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Track Your Order
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Enter your OfficeBazzar Order Reference Number (e.g., <strong>OB-2026-1001</strong>) to view live warehouse dispatch and shipment progress.
        </p>

        {/* Search Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(orderQuery);
          }}
          className="flex items-center max-w-md mx-auto pt-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value.toUpperCase())}
              placeholder="e.g. OB-2026-1001"
              className="w-full pl-4 pr-10 py-3 text-sm font-mono font-medium text-slate-900 bg-white border-2 border-blue-900 rounded-l-2xl uppercase focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-r-2xl transition-colors shrink-0"
          >
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {/* Result Section */}
      {hasSearched && (
        <div className="animate-in fade-in duration-300">
          {searchedOrder ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
              {/* Top Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Order Number</div>
                  <div className="text-xl font-mono font-bold text-blue-950">{searchedOrder.orderNumber}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Placed on: {new Date(searchedOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end">
                  <div className="text-xs text-slate-400 font-medium">Current Status</div>
                  <span className="inline-flex px-3 py-1 bg-amber-100 text-amber-950 font-semibold text-xs capitalize rounded-lg mt-0.5">
                    {searchedOrder.orderStatus}
                  </span>
                  {searchedOrder.trackingNumber && (
                    <div className="text-xs text-slate-600 mt-1">
                      AWB / Waybill: <strong className="font-mono text-blue-900">{searchedOrder.trackingNumber}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Courier & Logistics Details */}
              {searchedOrder.courierName && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="text-slate-500">Logistics Partner:</span>{' '}
                      <strong className="text-slate-900">{searchedOrder.courierName}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Dispatch Location:</span>{' '}
                    <strong className="text-slate-900">Royapettah Hub, Chennai</strong>
                  </div>
                </div>
              )}

              {/* Progress Stepper */}
              <div className="py-4">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6">
                  Shipment Milestones
                </div>
                <div className="relative border-l-2 border-blue-900 ml-4 space-y-8 pl-6">
                  {steps.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.status === 'done'
                            ? 'bg-blue-900 text-white'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                      >
                        {step.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : idx + 1}
                      </div>
                      <div className="font-bold text-xs text-slate-900">{step.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{step.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address & Items Summary */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Destination Address</span>
                  </div>
                  <div className="text-slate-600 space-y-0.5">
                    <div>{searchedOrder.shippingAddress.fullName}</div>
                    <div>{searchedOrder.shippingAddress.addressLine1}</div>
                    <div>{searchedOrder.shippingAddress.city}, {searchedOrder.shippingAddress.state} - {searchedOrder.shippingAddress.pincode}</div>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-900" />
                    <span>Order Items ({searchedOrder.items.length})</span>
                  </div>
                  <div className="space-y-1">
                    {searchedOrder.items.map((i) => (
                      <div key={i.id} className="flex justify-between text-slate-700">
                        <span className="truncate pr-2">{i.productName} (x{i.quantity})</span>
                        <span className="font-bold shrink-0">₹{i.totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Order Not Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                We could not locate an order matching &quot;{orderQuery}&quot;. Please verify the order number on your confirmation email or invoice and try again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
