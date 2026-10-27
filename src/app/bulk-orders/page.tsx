import React from 'react';
import type { Metadata } from 'next';
import BulkOrdersClient from '@/components/bulk-orders/BulkOrdersClient';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Corporate Bulk Orders & B2B RFQ | Wholesale Institutional Supply',
  description:
    'Submit wholesale RFQ and corporate bulk supply inquiries to Office Bazzar. Tiered enterprise pricing, GST tax compliance, and scheduled deliveries across India.',
  path: '/bulk-orders',
  keywords: [
    'corporate bulk orders',
    'B2B RFQ',
    'wholesale office supplies',
    'institutional procurement Chennai',
    'GST invoice office supplies',
  ],
});

export default function BulkOrdersPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Bulk Orders & RFQ', path: '/bulk-orders' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-bulk-orders" />
      <BulkOrdersClient />
    </>
  );
}
