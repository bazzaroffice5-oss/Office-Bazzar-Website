import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import OurBrandsSection from '@/components/home/OurBrandsSection';
import ProcessTimelineSection from '@/components/home/ProcessTimelineSection';
import ProcurementBenefitsSection from '@/components/home/ProcurementBenefitsSection';
import AboutSummarySection from '@/components/home/AboutSummarySection';
import HomeBlogSection from '@/components/home/HomeBlogSection';
import HomeFaqSection from '@/components/home/HomeFaqSection';
import { constructMetadata, SITE_CONFIG } from '@/lib/seo/config';
import { getCategories } from '@/lib/db/store';

export const metadata = constructMetadata({
  title: 'Office Bazzar | Office Supplies & Corporate Procurement India',
  description:
    'Office Bazzar provides office stationery, housekeeping and hygiene products, printer consumables and packaging supplies for businesses across India. Explore corporate and bulk procurement solutions.',
  path: '/',
  keywords: SITE_CONFIG.primaryKeywords,
});

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
