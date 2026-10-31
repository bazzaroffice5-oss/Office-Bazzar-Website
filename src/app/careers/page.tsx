import React from 'react';
import { Metadata } from 'next';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';
import CareersClient from '@/components/careers/CareersClient';

export const metadata: Metadata = constructMetadata({
  title: 'Careers in Corporate Procurement & Supply Chain',
  description:
    'Explore career opportunities at Office Bazzar across B2B sales, enterprise account management, warehouse operations, and supply chain fulfillment in India.',
  path: '/careers',
  keywords: [
    'Careers OfficeBazzar',
    'OfficeBazzar Recruitment',
    'Jobs in Royapettah Chennai',
    'Corporate Procurement Careers',
    'Royapettah Chennai Careers',
    'Officebazzar E-Store Careers',
  ],
});

export default function CareersPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Careers', path: '/careers' },
  ]);

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-careers" />
      <CareersClient />
    </main>
  );
}
