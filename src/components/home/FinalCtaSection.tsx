'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, PhoneCall } from 'lucide-react';

export default function FinalCtaSection() {
  return (
    <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-[#004b87] via-[#0a355c] to-[#0f172a] text-white relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-medium backdrop-blur-xs">
            Start Sourcing Smarter
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            Ready to Streamline Your Workplace Procurement?
          </h2>

          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
            Consolidate all your office supplies, housekeeping chemicals, and printing consumables under one pre-approved corporate contract with guaranteed 24-hour metro delivery.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/request-quote"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.98] text-white text-sm sm:text-base font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Request a Custom Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white border border-white/20 text-sm sm:text-base font-semibold rounded-xl transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Contact Institutional Desk</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
