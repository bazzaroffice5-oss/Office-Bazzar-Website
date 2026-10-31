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
    <>
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-track-order" />
      <React.Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
            Loading order tracking console...
          </div>
        }
      >
        <TrackOrderClient />
      </React.Suspense>
    </>
  );
}
