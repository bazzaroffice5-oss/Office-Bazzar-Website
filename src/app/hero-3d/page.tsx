import React from 'react';
import Link from 'next/link';
import PerspectiveTunnelHero from '@/components/ui/perspective-tunnel-hero';
import TrendingCategoriesSection from '@/components/home/TrendingCategoriesSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import { ArrowLeft, ShieldCheck, Truck, Building2 } from 'lucide-react';

export const metadata = {
  title: '3D Spatial Perspective Hero | OfficeBazzar Corporate Procurement',
  description:
    'Experience OfficeBazzar in immersive 3D spatial perspective. Explore pre-approved enterprise stationery, Diversey Taski hygiene chemicals, Kangaro files, and IT consumables.',
};

export default function Hero3DPage() {

  return (
    <main className="min-h-screen bg-white">
      {/* Top Banner Notice */}
      <div className="w-full bg-slate-900 text-white text-xs py-2 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f95721] animate-ping" />
            <span className="font-semibold text-slate-200">
              Interactive 3D Spatial Perspective Corridor Mode Active
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#f95721] hover:text-white font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Standard Homepage</span>
          </Link>
        </div>
      </div>

      {/* 3D Perspective Tunnel Hero Component */}
      <PerspectiveTunnelHero />

      {/* Proof that normal page scroll is NOT trapped: Below sections flow naturally */}
      <section className="py-8 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center gap-3">
              <Truck className="w-6 h-6 text-[#f95721]" />
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Pan-India Metro Dispatch</div>
                <div className="text-xs text-slate-500">24-HR turnaround from Royapettah Hub</div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center gap-3">
              <Building2 className="w-6 h-6 text-[#004b87]" />
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">10,000+ Enterprise SKUs</div>
                <div className="text-xs text-slate-500">From 120+ pre-approved OEM brands</div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">100% ITC GST Compliant</div>
                <div className="text-xs text-slate-500">Automated corporate input credit invoices</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Categories Section */}
      <TrendingCategoriesSection />

      {/* Categories Section */}
      <CategoriesSection />
    </main>
  );
}
