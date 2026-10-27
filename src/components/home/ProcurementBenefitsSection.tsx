'use client';

import React from 'react';
import {
  FileCheck2,
  Receipt,
  Truck,
  Users2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function ProcurementBenefitsSection() {
  const benefits = [
    {
      icon: Receipt,
      title: '100% GST Input Tax Credit',
      desc: 'Get authentic tax invoices with valid HSN/SAC codes and corporate GSTIN for seamless tax compliance.',
    },
    {
      icon: FileCheck2,
      title: 'Annual Rate Contracts (ARC)',
      desc: 'Lock in predictable wholesale rates for 12 months with customized periodic delivery schedules and price stability.',
    },
    {
      icon: Truck,
      title: 'Prompt 2–3 Day Fleet Delivery',
      desc: 'Free door delivery in Chennai, Bangalore, and Kolkata with our dedicated fleet of 5 delivery vans and 8 vehicles.',
    },
    {
      icon: Users2,
      title: 'Dedicated Account Manager',
      desc: 'Single point of contact for custom sourcing requests, order consolidation, and consolidated monthly billing.',
    },
    {
      icon: ShieldCheck,
      title: 'In-House & OEM Sourcing',
      desc: 'Direct manufacturers of Hi-Clean formulations, alongside authorized distribution of top corporate brands.',
    },
    {
      icon: Zap,
      title: '30-Day Corporate Credit',
      desc: 'Institutional credit facilities available for corporate offices, hospitals, schools, and government bodies.',
    },
  ];


  return (
    <section className="w-full py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#004b87] text-xs font-medium mb-2">
            Why OfficeBazzar
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Built for Modern Enterprise Procurement
          </h2>
          <p className="text-sm text-slate-600 mt-2 font-normal">
            Eliminate fragmented vendors, irregular pricing, and billing headaches with an institutional procurement partner.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#004b87] mb-4 shadow-2xs">
                  <Icon className="w-5 h-5 text-[#004b87]" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">{b.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
