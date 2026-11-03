import React from 'react';
import type { Metadata } from 'next';
import TrackOrderClient from '@/components/track-order/TrackOrderClient';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Track Corporate Order & Shipment Status',
  description:
    'Track your Office Bazzar institutional orders and corporate consignments with your order number. Live dispatch status and pan-India B2B delivery tracking.',
  path: '/track-order',
  noIndex: true,
});

export default function TrackOrderPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Track Order', path: '/track-order' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-track-order" />

      {/* SSR Static Header with H1 */}
      <div className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Track Corporate Order &amp; Consignment Status
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Real-time fulfillment tracking for institutional purchases, B2B contracted deliveries, and office supplies dispatches from our central logistics hubs across India.
          </p>
        </div>
      </div>

      <React.Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
            Loading order tracking console...
          </div>
        }
      >
        <TrackOrderClient />
      </React.Suspense>

      {/* Helpful Logistics & Dispatch Information */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200 text-xs text-slate-600">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="font-semibold text-slate-900">Standard Delivery Timeline</div>
            <p>Metro hubs (Chennai, Bengaluru, Mumbai, NCR) receive same-day or next-day scheduled deliveries. Tier 2 and Tier 3 cities are serviced within 48 to 72 business hours.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="font-semibold text-slate-900">GST E-Way Bill &amp; Gate Passes</div>
            <p>Every business shipment includes official GST-compliant tax invoices, e-way bills, and physical delivery challans formatted for corporate security gate entry.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="font-semibold text-slate-900">Dedicated Support Desk</div>
            <p>Need urgent dispatch updates or delivery rescheduling? Contact our logistics coordination desk at <strong>sales4@officebazzar.com</strong> or call <strong>+91 72008 00040</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
