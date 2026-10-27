import React from 'react';
import { Metadata } from 'next';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';
import CareersClient from '@/components/careers/CareersClient';

export const metadata: Metadata = constructMetadata({
  title: 'Careers | Officebazzar E-Store Private Limited, Royapettah, Chennai',
  description:
    'Join the transformation at Officebazzar E-Store Private Limited. Help shape the future of workplace supplies and business procurement with Office Bazzar in Royapettah, Chennai.',
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
