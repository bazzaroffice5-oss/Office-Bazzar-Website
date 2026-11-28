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
            Request an Institutional Quotation
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Get transparent wholesale pricing, tiered corporate volume discounts, and formal GST tax quotations directly from our central Royapettah fulfillment desk within 2 to 4 business hours.
          </p>
        </div>
      </div>

      <RequestQuoteClient />
    </div>
  );
}
