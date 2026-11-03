import React from 'react';
import type { Metadata } from 'next';
import RequestQuoteClient from '@/components/quote/RequestQuoteClient';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Request Institutional Quote & Bulk B2B Pricing',
  description:
    'Request customized institutional quotations for office stationery, tech consumables, housekeeping chemicals, and packaging supplies with GST tax invoicing across India.',
  path: '/request-quote',
});

export default function RequestQuotePage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Request Quote', path: '/request-quote' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-request-quote" />

      {/* SSR Static Header with H1 */}
      <div className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Request an Institutional Quotation (RFQ)
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Get transparent wholesale pricing, tiered corporate volume discounts, and formal GST tax quotations directly from our central Royapettah fulfillment desk within 2 to 4 business hours.
          </p>
        </div>
      </div>

      <RequestQuoteClient />

      {/* Institutional Procurement Assurance Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200 text-xs text-slate-600">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="font-semibold text-slate-900">Dedicated Account Manager</div>
            <p>Every submitted RFQ is assigned to a corporate procurement specialist who reviews requirements, checks OEM warehouse stock, and structures the lowest wholesale price.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="font-semibold text-slate-900">Customized Billing &amp; Credit</div>
            <p>We accommodate customized institutional purchase orders (POs), multi-branch split dispatches, scheduled monthly supply drops, and 30-day corporate credit accounts.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="font-semibold text-slate-900">Direct OEM Authenticity</div>
            <p>All items quoted are 100% genuine products sourced directly from manufacturers like JK Paper, Diversey, Kimberly-Clark, Kangaro, and 3M with manufacturer warranties.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
