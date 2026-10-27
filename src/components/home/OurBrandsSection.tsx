'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  category: string;
  logo: string;
  width: number;
  height: number;
  inHouse?: boolean;
  alt: string;
}

// 8 Verified authentic brand logos in exact requested sequence
const VERIFIED_BRANDS: Brand[] = [
  {
    id: 'reckitt-benckiser',
    name: 'Reckitt Benckiser',
    category: 'Hygiene & Disinfection Formulations',
    logo: '/assets/brands/reckitt-benckiser.png',
    width: 1280,
    height: 562,
    alt: 'Reckitt Benckiser Hygiene Products',
  },
  {
    id: 'hindustan-unilever',
    name: 'Hindustan Unilever Limited',
    category: 'Institutional Cleaning & Consumer Products',
    logo: '/assets/brands/hindustan-unilever.png',
    width: 800,
    height: 267,
    alt: 'Hindustan Unilever Limited Products',
  },
  {
    id: 'rorito',
    name: 'Rorito',
    category: 'Writing Instruments & Pens',
    logo: '/assets/brands/rorito.png',
    width: 935,
    height: 354,
    alt: 'Rorito Writing Instruments',
  },
  {
    id: 'roots',
    name: 'Roots',
    category: 'Industrial Facility Cleaning Machines',
    logo: '/assets/brands/roots.png',
    width: 3014,
    height: 1924,
    alt: 'Roots Multiclean Industrial Machines',
  },
  {
    id: 'greenlime',
    name: 'Greenlime',
    category: 'Washroom Solutions & Fragrance Systems',
    logo: '/assets/brands/greenlime.png',
    width: 1408,
    height: 390,
    alt: 'Greenlime Hygiene Products',
  },
  {
    id: 'best-print',
    name: 'Best Print',
    category: 'Cost-Effective Laser Toners & Cartridges',
    logo: '/assets/brands/best-print.png',
    width: 330,
    height: 162,
    alt: 'Best Print Compatible Cartridges',
  },
  {
    id: 'hi-clean',
    name: 'Hi-Clean',
    category: 'Commercial Cleaning & Sanitizing Formulations',
    logo: '/assets/brands/hi-clean.png',
    width: 321,
    height: 157,
    inHouse: true,
    alt: 'Hi-Clean — Office Bazzar In-House Brand',
  },
  {
    id: 'nataraj',
    name: 'Nataraj',
    category: 'Stationery & Writing Supplies',
    logo: '/assets/brands/nataraj.png',
    width: 2267,
    height: 417,
    alt: 'Nataraj Stationery Products',
  },
];

export default function OurBrandsSection() {
  return (
    <section
      id="brands"
      className="w-full py-12 sm:py-16 bg-white border-b border-slate-100 overflow-hidden"
      aria-label="Our Brands"
    >
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-700 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Authorized Enterprise Partners &amp; In-House Manufacturing</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Our Brands
          </h2>

          <div className="w-12 h-1 bg-gradient-to-r from-[#004b87] to-[#16a34a] rounded-full mx-auto mt-3 mb-3" />

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Direct enterprise procurement partnerships with India&apos;s leading workplace brands, alongside our
            in-house certified <strong className="text-slate-800 font-semibold">Hi-Clean™</strong> professional hygiene formulations.
          </p>
        </div>
      </div>

      {/* Infinite Seamless Scrolling Logo Track */}
      <div className="relative w-full overflow-hidden py-3 sm:py-5">
        {/* Subtle gradient edge masks to fade logos cleanly into the white background */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 z-10 bg-gradient-to-r from-white via-white/80 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 z-10 bg-gradient-to-l from-white via-white/80 to-transparent"
          aria-hidden="true"
        />

        {/* Marquee Track: Seamless flex row scrolling continuously at linear speed */}
        <div className="flex w-max animate-marquee-infinite">
          {/* First loop of verified brands */}
          <div className="flex items-center shrink-0">
            {VERIFIED_BRANDS.map((brand) => (
              <BrandLogoItem key={`set1-${brand.id}`} brand={brand} />
            ))}
          </div>

          {/* Second identical loop for seamless -50% translateX loop */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {VERIFIED_BRANDS.map((brand) => (
              <BrandLogoItem key={`set2-${brand.id}`} brand={brand} />
            ))}
          </div>
        </div>
      </div>

      {/* Section Footer: Authentic Trademark Notice + RFQ Link */}
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All logos represent genuine registered trademarks of their respective brand owners.</span>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 font-semibold text-[#004b87] hover:text-[#16a34a] transition-colors"
        >
          <span>Explore Brand Catalogs &amp; Direct ARC Pricing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

function BrandLogoItem({ brand }: { brand: Brand }) {
  const ratio = brand.width / brand.height;
  const isExtraWide = ratio > 4.0;
  const isWide = ratio > 2.4 && !isExtraWide;
  const isCompact = ratio < 1.8;

  return (
    <div
      className="flex items-center justify-center shrink-0 px-6 sm:px-8 md:px-10 lg:px-12 py-2 group cursor-default transition-transform duration-300 hover:scale-105"
      title={`${brand.name} — ${brand.category}`}
    >
      <div className="relative flex items-center justify-center h-11 sm:h-13 md:h-15">
        <Image
          src={brand.logo}
          alt={brand.alt}
          width={brand.width}
          height={brand.height}
          className={`w-auto object-contain transition-opacity duration-300 opacity-100 ${
            brand.id === 'reckitt-benckiser'
              ? 'h-9 sm:h-11 md:h-12.5 max-w-[155px] sm:max-w-[190px] md:max-w-[215px]'
              : isExtraWide
              ? 'h-6.5 sm:h-8 md:h-9 max-w-[175px] sm:max-w-[215px] md:max-w-[245px]'
              : isWide
              ? 'h-8 sm:h-9.5 md:h-11 max-w-[145px] sm:max-w-[180px] md:max-w-[205px]'
              : isCompact
              ? 'h-9.5 sm:h-11.5 md:h-13 max-w-[90px] sm:max-w-[110px] md:max-w-[130px]'
              : 'h-8.5 sm:h-10 md:h-11.5 max-w-[125px] sm:max-w-[150px] md:max-w-[175px]'
          }`}
          priority
        />
      </div>
    </div>
  );
}
