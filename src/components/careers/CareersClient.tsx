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
        {/* Scoped CSS for Continuous Heading Glow Animation */}
        <style>{`
          .careers-glow-layer-1 {
            position: absolute;
            inset: -12%;
            border-radius: 9999px;
            background: radial-gradient(ellipse 70% 60% at 35% 45%, rgba(254, 215, 170, 0.5) 0%, rgba(254, 243, 199, 0.35) 45%, transparent 75%);
            filter: blur(40px);
            animation: careersGlowPulse1 10s ease-in-out infinite alternate;
            will-change: transform, opacity;
          }

          .careers-glow-layer-2 {
            position: absolute;
            inset: -12%;
            border-radius: 9999px;
            background: radial-gradient(ellipse 70% 60% at 65% 55%, rgba(224, 242, 254, 0.55) 0%, rgba(254, 243, 199, 0.3) 45%, transparent 75%);
            filter: blur(40px);
            animation: careersGlowPulse2 10s ease-in-out infinite alternate;
            will-change: transform, opacity;
          }

          @keyframes careersGlowPulse1 {
            0% {
              transform: translate(-5%, -6%) scale(0.94);
              opacity: 0.6;
            }
            50% {
              transform: translate(6%, 5%) scale(1.08);
              opacity: 0.8;
            }
            100% {
              transform: translate(-3%, 7%) scale(0.98);
              opacity: 0.65;
            }
          }

          @keyframes careersGlowPulse2 {
            0% {
              transform: translate(6%, 6%) scale(1.06);
              opacity: 0.7;
            }
            50% {
              transform: translate(-6%, -5%) scale(0.94);
              opacity: 0.55;
            }
            100% {
              transform: translate(4%, -7%) scale(1.02);
              opacity: 0.75;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .careers-glow-layer-1,
            .careers-glow-layer-2 {
              animation: none !important;
              transform: none !important;
              opacity: 0.6 !important;
            }
          }
        `}</style>

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
      <section id="opportunities" className="w-full pb-14 sm:pb-16 lg:pb-20 px-4 sm:px-6 flex justify-center">
        <div className="relative w-full max-w-[820px] mx-auto overflow-hidden rounded-[18px] bg-[#fafaf9] border border-orange-100/90 py-6 sm:py-7 px-5 sm:px-8 text-center shadow-xs">
          {/* Subtle light orange edge accents */}
          <div className="absolute -left-3 -top-3 h-14 w-14 rounded-full bg-orange-200/25 pointer-events-none" />
          <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full bg-orange-200/20 pointer-events-none" />
          <div className="absolute right-5 top-5 h-7 w-7 rounded-full bg-orange-300/15 pointer-events-none" />

          {/* Centered Content */}
          <div className="relative z-10 space-y-2 max-w-[680px] mx-auto">
            {/* Section Heading in Navy Blue (Proportionate ~18-25px) */}
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-[25px] font-bold text-[#004b87] tracking-tight leading-snug">
              Interested in Joining Office Bazzar?
            </h2>

            {/* Supporting Text with Green Email Link */}
            <p className="text-xs sm:text-sm md:text-[15px] text-slate-700 leading-relaxed font-normal">
              We don’t have any open positions right now. Share your resume at{' '}
              <a
                href="mailto:admin@officebazzar.com?subject=Resume%20Submission%20%E2%80%93%20Office%20Bazzar%20Careers"
                className="text-[#15803d] hover:text-[#166534] font-semibold underline underline-offset-4 decoration-[#15803d]/50 hover:decoration-[#166534] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 rounded-xs"
              >
                admin@officebazzar.com
              </a>
              , and we’ll contact you when a suitable opportunity becomes available.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
