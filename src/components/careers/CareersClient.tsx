'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function CareersClient() {
  const handleScrollToOpportunities = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('opportunities');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="w-full bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-950 overflow-x-hidden">
      {/* 1. HERO SECTION (Clean white background, balanced typography & centered CTA) */}
      <section className="relative w-full flex flex-col items-center justify-center pt-14 pb-8 sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12 px-4 sm:px-6 text-center overflow-hidden">
        <div className="relative max-w-2xl mx-auto space-y-3 sm:space-y-3.5">
          {/* Main Heading with Subtle Animated Ambient Glow */}
          <div className="relative inline-block w-full">
            {/* Dedicated animated background layer behind heading */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[400px] md:w-[500px] h-[90px] sm:h-[120px] md:h-[150px] -z-10 overflow-visible"
            >
              <div className="careers-glow-layer-1" />
              <div className="careers-glow-layer-2" />
            </div>

            {/* Main Heading - Refined, professional, bold without being oversized */}
            <h1 className="relative z-10 text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.2]">
              Join the <span className="text-[#004b87]">Transformation</span>
            </h1>
          </div>

          {/* Supporting Text - Reduced font size and controlled maximum width */}
          <p className="mt-2.5 max-w-lg mx-auto text-xs sm:text-sm md:text-base text-slate-600 leading-normal sm:leading-relaxed font-normal">
            Help shape the future of workplace supplies and business procurement with Office Bazzar.
          </p>

          {/* Centered Explore Opportunities CTA - Compact and well-proportioned */}
          <div className="pt-2 sm:pt-2.5">
            <a
              href="/careers#opportunities"
              onClick={handleScrollToOpportunities}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-[#004b87] hover:bg-[#0a355c] active:bg-[#082b4a] active:scale-[0.98] text-white text-xs sm:text-sm md:text-base font-semibold shadow-xs hover:shadow-sm transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004b87] focus-visible:ring-offset-2 cursor-pointer"
            >
              <span className="text-white">Explore Opportunities</span>
              <ArrowRight className="w-4 h-4 text-white transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. CAREERS MESSAGE PANEL (Clean, compact container, warm cream, navy heading & green email link) */}
      <section id="opportunities" className="w-full pb-10 sm:pb-12 px-4 sm:px-6 flex justify-center">
        <div className="relative w-full max-w-[820px] mx-auto overflow-hidden rounded-[18px] bg-[#fafaf9] border border-orange-100/90 py-6 sm:py-7 px-5 sm:px-8 text-center shadow-xs">
          {/* Subtle light orange edge accents */}
          <div className="absolute -left-3 -top-3 h-14 w-14 rounded-full bg-orange-200/25 pointer-events-none" />
          <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-orange-200/20 pointer-events-none" />
          <div className="absolute right-5 top-5 h-7 w-7 rounded-full bg-orange-300/15 pointer-events-none" />

          {/* Centered Content */}
          <div className="relative z-10 space-y-2 max-w-[680px] mx-auto">
            {/* Section Heading in Navy Blue */}
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-[25px] font-bold text-[#004b87] tracking-tight leading-snug">
              Interested in Joining Office Bazzar?
            </h2>

            {/* Supporting Text with Green Email Link */}
            <p className="text-xs sm:text-sm md:text-[15px] text-slate-700 leading-relaxed font-normal">
              We are continually expanding our enterprise procurement network across Chennai, Bengaluru, Mumbai, and Hyderabad. While current openings may be filled, we invite talented professionals to share their credentials at{' '}
              <a
                href="mailto:admin@officebazzar.com?subject=Resume%20Submission%20%E2%80%93%20Office%20Bazzar%20Careers"
                className="text-[#15803d] hover:text-[#166534] font-semibold underline underline-offset-4 decoration-[#15803d]/50 hover:decoration-[#166534] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 rounded-xs"
              >
                admin@officebazzar.com
              </a>
              . Our recruitment team reviews submissions on a rolling basis.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CORE FUNCTIONAL DIVISIONS & WORK CULTURE */}
      <section className="w-full pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Life and Careers at Office Bazzar
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              We empower our teams to build long-term relationships with Fortune 500 enterprises, educational institutions, and healthcare systems across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
              <h4 className="text-sm font-bold text-slate-900">Enterprise Accounts &amp; B2B Sales</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Partner with corporate procurement heads, manage recurring rate contracts, and provide strategic cost optimization for office stationery, tech consumables, and pantry supplies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
              <h4 className="text-sm font-bold text-slate-900">Logistics &amp; Fulfillment Operations</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coordinate warehouse logistics from our central Royapettah fulfillment hub, manage dispatch workflows, optimize delivery routes, and ensure zero-delay gate delivery.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
              <h4 className="text-sm font-bold text-slate-900">E-Commerce &amp; Digital Solutions</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drive product catalog intelligence, Zoho CRM integration, digital quotation consoles, and automated invoice delivery systems powering seamless B2B transactions.
              </p>
            </div>
          </div>

          {/* 4. WHY BUILD YOUR CAREER AT OFFICE BAZZAR */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              Why Build Your Career at Office Bazzar?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-3xl">
              As one of South India&apos;s fastest growing workplace procurement partners, Officebazzar E-Store Private Limited offers high-ownership roles, cross-functional mentorship, and direct exposure to corporate supply chain dynamics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                <span className="font-bold text-slate-900 block">Merit-Based Growth</span>
                <span className="text-slate-600">Transparent quarterly performance reviews and fast-track progression for top performers.</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                <span className="font-bold text-slate-900 block">Comprehensive Health Cover</span>
                <span className="text-slate-600">Medical insurance coverage and safety protocols across warehouse and corporate facilities.</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                <span className="font-bold text-slate-900 block">Continuous Learning</span>
                <span className="text-slate-600">Hands-on exposure to enterprise CRM tools, supply chain optimization, and corporate accounting.</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                <span className="font-bold text-slate-900 block">Inclusive Culture</span>
                <span className="text-slate-600">Collaborative, respectful workplace focused on customer excellence and team camaraderie.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
