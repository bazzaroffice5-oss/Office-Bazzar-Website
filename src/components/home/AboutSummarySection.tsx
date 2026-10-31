'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, Factory, Truck, CreditCard } from 'lucide-react';

export default function AboutSummarySection() {
  return (
    <section className="w-full py-16 sm:py-20 bg-slate-50/70 border-b border-slate-100">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#16a34a] text-xs font-medium">
              <Building2 className="w-3.5 h-3.5" />
              About OfficeBazzar
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              Your Trusted Partner for Office Supplies and Business Solutions
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Co-founded in 2005, <strong>Officebazzar E-Store Private Limited</strong> is a leading Indian provider of complete office supplies, housekeeping materials, printer cartridges, and packaging supplies. Headquartered at Officebazzar Tower in Royapettah, Chennai, we manufacture our own in-house <strong>Hi-Clean</strong> cleaning products and supply top corporate institutions, hospitals, banks, and schools across South India.
            </p>

            {/* 3 Value Pillars from Official Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Factory className="w-3.5 h-3.5 text-[#004b87]" />
                  <span>In-House Brands</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 leading-snug font-normal">
                  Manufacturers of Hi-Clean professional chemicals
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Truck className="w-3.5 h-3.5 text-[#16a34a]" />
                  <span>Dedicated Fleet</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 leading-snug font-normal">
                  Free door delivery in Chennai, Bangalore &amp; Kolkata
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <CreditCard className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>30-Day Credit</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 leading-snug font-normal">
                  Available for corporate, hospital &amp; institution clients
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#004b87] hover:text-[#16a34a] transition-colors"
              >
                <span>Read Our Full Story &amp; Facility Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Image Column: Real OfficeBazzar Headquarters Building */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-[500px] aspect-[4/5] sm:aspect-[5/6] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-100">
              <Image
                src="/images/officebazzar-building.jpg"
                alt="Office Bazzar building featuring glass-front entrance and brick exterior"
                fill
                quality={95}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 500px, 500px"
                className="object-cover object-[center_45%]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

