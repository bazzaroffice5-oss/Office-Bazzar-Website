'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  Building2,
  MapPin,
  Phone,
  Mail,
  Printer,
  ArrowRight,
  PackageCheck,
  Copy,
  Check,
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadQuote() {
      try {
        const res = await fetch(`/api/quotations/${encodeURIComponent(quotationRef)}?t=${Date.now()}`, {
          cache: 'no-store',
        });
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

  const handleCopyRef = () => {
    const ref = quotation?.quotationNumber || decodeURIComponent(quotationRef);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const displayRef = quotation?.quotationNumber || decodeURIComponent(quotationRef);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

        {/* 1. Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs text-center print:border-none print:shadow-none print:p-0">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3.5 border border-emerald-100">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full uppercase tracking-wider">
            Quotation Request Received
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Thank You! Your RFQ is Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto font-normal">
            Our commercial sales team has received your quotation request and assigned it for volume tier pricing review.
          </p>

          {/* Quotation Reference Badge */}
          <div className="mt-5 p-4 bg-slate-50/80 border border-slate-200 rounded-xl max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                Official RFQ Reference
              </span>
              <div className="text-lg font-bold text-[#004b87] font-mono">
                {displayRef}
              </div>
            </div>

            <div className="flex items-center space-x-2 print:hidden">
              <button
                type="button"
                onClick={handleCopyRef}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Copy reference number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Quotation Details */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <div className="w-6 h-6 border-2 border-[#004b87] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading quotation summary...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <p>Summary for quotation reference: <strong className="text-slate-900">{decodeURIComponent(quotationRef)}</strong></p>
            <p className="text-slate-400">A confirmation email has been dispatched with full line item details.</p>
          </div>
        ) : quotation ? (
          <div className="space-y-5">
            {/* Business Contact & Delivery Destination Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-4">
                <Building2 className="w-4 h-4 text-[#004b87]" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Customer &amp; Delivery Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Company / Organization</span>
                  <span className="font-bold text-slate-900 text-sm">{quotation.companyName || 'Individual Enterprise'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Person</span>
                  <span className="font-bold text-slate-900">{quotation.customerName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Channels</span>
                  <div className="space-y-0.5 mt-0.5 text-slate-700">
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{quotation.email}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{quotation.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Delivery Destination</span>
                  <div className="flex items-start space-x-1.5 mt-0.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-[#004b87] shrink-0 mt-0.5" />
                    <span>
                      {quotation.deliveryLocation ? `${quotation.deliveryLocation} - ` : ''}PIN: <strong>{quotation.pincode}</strong>
                    </span>
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
                    {(quotation.status || 'SUBMITTED').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Requested Items Table Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-4">
                <PackageCheck className="w-4 h-4 text-[#004b87]" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Requested Items ({quotation.items.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5">Product</th>
                      <th className="py-2.5 text-center">SKU</th>
                      <th className="py-2.5 text-center">Pack Size</th>
                      <th className="py-2.5 text-right sm:text-center">Quantity</th>
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
                        <td className="py-3 text-right sm:text-center font-bold text-slate-900">
                          {it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {quotation.additionalRequirements && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  <span className="font-bold block text-[11px] text-slate-500 uppercase tracking-wider">
                    Customer Specific Notes:
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap">{quotation.additionalRequirements}</p>
                </div>
              )}
            </div>

            {/* Turnaround Assurance */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Turnaround SLA Notice</span>
                <span className="text-[11px] text-slate-500">
                  A formal tax quotation with volume tier discounts will be emailed to <strong>{quotation.email}</strong> within 2 business hours.
                </span>
              </div>
              <div className="shrink-0 text-slate-700 text-xs">
                Need urgent assistance? <strong className="text-slate-900">+91 7200800040</strong>
              </div>
            </div>

            {/* Clean Core Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 print:hidden">
              <Link
                href="/account/quotations"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-slate-200"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>View My Quotations</span>
              </Link>

              <Link
                href="/products"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#d9232d] hover:bg-[#b81822] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
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
