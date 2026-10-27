'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Smoothly redirect to Quotation page
    const timer = setTimeout(() => {
      router.replace('/quotation');
    }, 1200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-md p-8 border border-slate-200 shadow-xs text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 text-[#d9232d] mx-auto flex items-center justify-center">
          <FileText className="w-7 h-7 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Cart-to-Quotation System</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          OfficeBazzar operates on an enterprise quotation model. Online payment checkout is disabled in favor of formal business quotations with customized volume pricing.
        </p>
        <p className="text-xs font-semibold text-[#d9232d]">
          Redirecting you to Request for Quotation (RFQ)...
        </p>
        <div className="pt-2">
          <Link
            href="/quotation"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#d9232d] hover:bg-[#b81822] text-white font-bold text-xs rounded-md shadow-xs transition-colors"
          >
            <span>Proceed to Quotation Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero payment required &bull; Official GST invoices</span>
        </div>
      </div>
    </div>
  );
}
