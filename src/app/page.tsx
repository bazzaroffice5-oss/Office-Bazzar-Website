import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import OurBrandsSection from '@/components/home/OurBrandsSection';
import ProcessTimelineSection from '@/components/home/ProcessTimelineSection';
import ProcurementBenefitsSection from '@/components/home/ProcurementBenefitsSection';
import AboutSummarySection from '@/components/home/AboutSummarySection';
import HomeBlogSection from '@/components/home/HomeBlogSection';
import HomeFaqSection from '@/components/home/HomeFaqSection';

import { constructMetadata } from '@/lib/seo/config';

export const metadata = constructMetadata({
  title: 'Corporate Procurement Partner for Office Supplies, Stationery & Housekeeping',
  description:
    'Officebazzar E-Store Private Limited: Chennai’s corporate procurement partner for office stationery, Diversey Taski chemicals, mobile dustbins, and computer consumables with 100% GST input credit.',
  path: '/',
  keywords: [
    'Office Supplies Chennai',
    'Corporate Procurement Partner',
    'Corporate Stationery Suppliers',
    'Diversey Taski Chemicals',
    'Hi-Clean Chemical Suppliers',
    'Industrial Dustbin Wholesale',
    'Office Supplies Royapettah',
    'OfficeBazzar',
  ],
});

import { getCategories } from '@/lib/db/store';

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <main className="min-h-screen bg-white">
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

