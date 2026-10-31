import React from 'react';
import type { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import OurBrandsSection from '@/components/home/OurBrandsSection';
import ProcessTimelineSection from '@/components/home/ProcessTimelineSection';
import ProcurementBenefitsSection from '@/components/home/ProcurementBenefitsSection';
import AboutSummarySection from '@/components/home/AboutSummarySection';
import HomeBlogSection from '@/components/home/HomeBlogSection';
import HomeFaqSection from '@/components/home/HomeFaqSection';
import { SITE_CONFIG, getLocalBusinessJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';
import { getCategories } from '@/lib/db/store';

const HOMEPAGE_TITLE = 'Office Bazzar | Office Supplies & Corporate Procurement India';
const HOMEPAGE_DESCRIPTION =
  'Office Bazzar provides office stationery, housekeeping and hygiene products, printer consumables and packaging supplies for businesses across India. Explore corporate and bulk procurement solutions.';
const HOMEPAGE_CANONICAL = 'https://officebazzar.com/';

export const metadata: Metadata = {
  title: {
    absolute: HOMEPAGE_TITLE,
  },
  description: HOMEPAGE_DESCRIPTION,
  alternates: {
    canonical: HOMEPAGE_CANONICAL,
  },
  openGraph: {
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    url: HOMEPAGE_CANONICAL,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`,
        width: 1200,
        height: 630,
        alt: HOMEPAGE_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    images: [`${SITE_CONFIG.url}${SITE_CONFIG.defaultOgImage}`],
  },
};

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={getLocalBusinessJsonLd()} id="local-business-schema-home" />
      {/* 1. Hero Section + Trust Highlights Bar */}
      <HeroSection />

      {/* 2. Workplace Procurement Categories (4 Categories with View Products) */}
      <CategoriesSection categories={categories} />

      {/* 3. Our Brands (Continuous Scrolling Enterprise & In-House Hi-Clean Marquee) */}
      <OurBrandsSection />

      {/* 4. Process Oriented Timeline (Animated Procurement Workflow) */}
      <ProcessTimelineSection />

      {/* 5. Enterprise Procurement Benefits */}
      <ProcurementBenefitsSection />

      {/* 6. About OfficeBazzar Summary & Logistics Facility */}
      <AboutSummarySection />

      {/* 7. Genuine Workplace Insights & Blog Articles */}
      <HomeBlogSection />

      {/* 8. Frequently Asked Questions (FAQ Accordion) */}
      <HomeFaqSection defaultOpen={false} />
    </main>
  );
}
