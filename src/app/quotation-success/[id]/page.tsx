'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  Clock,
  Building2,
  MapPin,
  Phone,
  Mail,
  Printer,
  ArrowRight,
  PackageCheck,
} from 'lucide-react';
import { Quotation } from '@/types';

export default function QuotationSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quotationRef = resolvedParams.id;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuote() {
      try {
        const res = await fetch(`/api/quotations/${encodeURIComponent(quotationRef)}`);
        const data = await res.json();
        if (res.ok && data.quotation) {
          setQuotation(data.quotation);
        } else {
          setError(data.error || 'Quotation reference not found');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading quotation details');
      } finally {
        setLoading(false);
      }
    }
    loadQuote();
  }, [quotationRef]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Success Banner */}
        <div className="bg-white rounded-md p-6 sm:p-8 border border-slate-200 shadow-xs mb-6 text-center print:border-none print:shadow-none print:p-0">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <span className="px-2.5 py-0.5 bg-red-50 text-[#d9232d] border border-red-200 text-xs font-semibold rounded-sm">
            Quotation Request Received
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            Thank You! Your RFQ Has Been Transmitted
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto font-normal">
            Our corporate sales desk has received your quotation request. We are reviewing inventory availability, applying enterprise volume discounts, and preparing your official quotation document.
          </p>

          {/* Quotation Reference Badge */}
          <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-md max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[11px] font-semibold text-slate-500">
                Official RFQ Reference Number
              </span>
              <div className="text-lg font-bold text-[#d9232d] font-mono">
                {quotation?.quotationNumber || decodeURIComponent(quotationRef)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer print:hidden"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Summary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Quotation Overview */}
        {loading ? (
          <div className="bg-white rounded-md p-8 border border-slate-200 text-center">
            <div className="w-5 h-5 border-2 border-[#d9232d] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading quotation line items...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-md p-6 border border-slate-200 text-center text-xs text-slate-500">
            <p>Summary for quotation reference: <strong>{decodeURIComponent(quotationRef)}</strong></p>
            <p className="mt-2 text-slate-400">A confirmation email has been dispatched with full line item details.</p>
          </div>
        ) : quotation ? (
          <div className="space-y-5">
            
            {/* Business & Logistics Overview */}
            <div className="bg-white rounded-md p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3.5">
                <Building2 className="w-4 h-4 text-[#d9232d]" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Enterprise Contact &amp; Delivery Destination
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Company Name</span>
                  <span className="font-bold text-slate-900 text-sm">{quotation.companyName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Person</span>
                  <span className="font-bold text-slate-900">{quotation.customerName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Channels</span>
                  <div className="space-y-0.5 mt-0.5 text-slate-700">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{quotation.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{quotation.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Delivery Location</span>
                  <div className="flex items-start space-x-1 mt-0.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span>{quotation.deliveryLocation} (PIN: <strong>{quotation.pincode}</strong>)</span>
                  </div>
                </div>

                {quotation.gstin && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Corporate GSTIN</span>
                    <span className="font-mono font-bold text-slate-900">{quotation.gstin}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block text-[11px]">Quotation Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mt-1 uppercase">
                    {quotation.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Requested Products Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-4">
                <PackageCheck className="w-4 h-4 text-red-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Requested Items ({quotation.items.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5">Product Description</th>
                      <th className="py-2.5 text-center">SKU</th>
                      <th className="py-2.5 text-center">Pack Size</th>
                      <th className="py-2.5 text-center">Quantity</th>
                      <th className="py-2.5 text-right">Indicative Unit</th>
                      <th className="py-2.5 text-right">Indicative Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotation.items.map((it) => (
                      <tr key={it.id || it.sku} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-900 max-w-xs pr-4">
                          {it.productName}
                        </td>
                        <td className="py-3 text-center font-mono text-slate-500">
                          {it.sku}
                        </td>
                        <td className="py-3 text-center text-slate-600">
                          {it.packSize || 'Standard'}
                        </td>
                        <td className="py-3 text-center font-bold text-slate-900">
                          {it.quantity}
                        </td>
                        <td className="py-3 text-right text-slate-600 font-medium">
                          ₹{it.indicativeUnitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          ₹{it.indicativeTotalPrice.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 text-slate-600">
                      <td colSpan={5} className="pt-4 text-right">Indicative Subtotal (Excl. Tax):</td>
                      <td className="pt-4 text-right font-bold text-slate-900">
                        ₹{quotation.indicativeSubtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="text-slate-600">
                      <td colSpan={5} className="py-1 text-right">Estimated GST (18%):</td>
                      <td className="py-1 text-right font-bold text-slate-900">
                        ₹{quotation.indicativeGstAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-200 text-sm">
                      <td colSpan={5} className="pt-3 text-right font-semibold text-slate-900">
                        Indicative Quotation Total:
                      </td>
                      <td className="pt-3 text-right font-bold text-[#d9232d] text-base">
                        ₹{quotation.indicativeTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {quotation.additionalRequirements && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
                  <span className="font-bold block text-[11px] text-slate-500 uppercase">
                    Customer Specific Notes:
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap">{quotation.additionalRequirements}</p>
                </div>
              )}
            </div>

            {/* Next Steps Workflow Tracker */}
            <div className="bg-slate-900 text-white rounded-md p-5 sm:p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-5 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Next Steps in Your Quotation Process</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 relative">
                {[
                  {
                    step: '1',
                    title: 'RFQ Transmitted',
                    desc: 'Saved in OfficeBazzar database & notifications sent to Admin and Sales Manager.',
                    active: true,
                  },
                  {
                    step: '2',
                    title: 'Sales Review',
                    desc: 'Sales representative verifies inventory, hub logistics, and volume tier pricing.',
                    active: true,
                  },
                  {
                    step: '3',
                    title: 'Official Tax Quote',
                    desc: 'Formal GST quotation document sent to your email with payment terms.',
                    active: false,
                  },
                  {
                    step: '4',
                    title: 'Dispatch & Delivery',
                    desc: 'Upon purchase order approval, products are dispatched from Chennai/Bangalore hubs.',
                    active: false,
                  },
                ].map((s) => (
                  <div key={s.step} className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          s.active ? 'bg-[#d9232d] text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.step}
                      </div>
                      <span className="text-xs font-bold text-slate-200">{s.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 print:hidden">
              <Link
                href="/account/quotations"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>View My Quotations</span>
              </Link>

              <Link
                href="/products"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#d9232d] hover:bg-[#b81822] text-white text-xs font-bold rounded-md flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue Browsing Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
