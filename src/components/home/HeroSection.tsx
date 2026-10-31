'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FileText,
  Layers,
  Headphones,
  Box,
} from 'lucide-react';

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const collageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !collageRef.current) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 8;
    const y = ((e.clientY - top) / height - 0.5) * 8;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (collageRef.current) {
        collageRef.current.style.transform = `perspective(1000px) rotateY(${x * 0.3}deg) rotateX(${-y * 0.3}deg)`;
      }
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (collageRef.current) {
      collageRef.current.style.transform = shouldReduceMotion ? 'none' : 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full bg-gradient-to-b from-[#f8fafc]/60 via-white to-white pt-6 sm:pt-10 lg:pt-12 pb-10 sm:pb-14 lg:pb-16 overflow-hidden select-none border-b border-slate-100"
    >
      {/* Soft Ambient Radial Background Glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[550px] lg:w-[720px] h-[450px] lg:h-[600px] bg-gradient-to-bl from-sky-100/50 via-emerald-50/40 to-transparent blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-0 w-80 h-80 bg-emerald-50/40 blur-3xl pointer-events-none"
      />

      {/* Main Container */}
      <div className="relative w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-10 items-center">
          
          {/* ================= LEFT COLUMN: COPY, HEADLINE & CTAS ================= */}
          <div className="lg:col-span-6 flex flex-col items-start z-10 text-left">
            
            {/* Eyebrow: OFFICE SUPPLIES • HOUSEKEEPING • CORPORATE PROCUREMENT */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex items-center flex-wrap gap-2 sm:gap-2.5 text-xs sm:text-[13px] font-medium mb-4 sm:mb-5"
            >
              <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
              <span className="text-slate-700">Office Supplies</span>
              
              <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
              <span className="text-slate-700">Housekeeping</span>
              
              <span className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0" />
              <span className="text-slate-700">Corporate Procurement</span>
            </motion.div>

            {/* Main Headline (Phase 2 H1) */}
            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
              className="text-left font-bold tracking-tight text-[#0f172a] text-[26px] xs:text-[30px] sm:text-4xl lg:text-[38px] xl:text-[44px] leading-[1.2] sm:leading-[1.18] mb-4 sm:mb-5"
            >
              <span className="block font-bold">Complete Office Supplies &amp;</span>
              <span className="block font-bold">Corporate Procurement</span>
              <span className="block font-bold text-[#057a3b]">Solutions Across India</span>
            </motion.h1>

            {/* Subtitle / Supporting text */}
            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
              className="text-sm sm:text-base lg:text-[17px] text-slate-600 max-w-[520px] leading-relaxed mb-7 sm:mb-8 font-normal"
            >
              Discover office stationery, housekeeping and hygiene products, printer consumables, and packaging supplies for corporate and bulk procurement across India.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: 'easeOut' }}
              className="flex flex-wrap items-center gap-3.5 sm:gap-4.5"
            >
              {/* Primary Button: Explore Products -> */}
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 bg-[#057a3b] hover:bg-[#046330] active:scale-[0.98] text-white text-sm sm:text-base font-semibold rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Explore Products</span>
                <span className="text-lg leading-none transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>

              {/* Secondary Button: Request a Quote */}
              <Link
                href="/request-quote"
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-sm sm:text-base font-semibold rounded-full transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#057a3b]" />
                <span>Request a Quote</span>
              </Link>
            </motion.div>
          </div>

          {/* ================= RIGHT COLUMN: INDIVIDUAL ASSET PRODUCT COLLAGE ================= */}
          <div className="lg:col-span-6 relative flex items-center justify-center pt-6 lg:pt-0">
            
            {/* Collage Stage with Mouse Parallax */}
            <div
              ref={collageRef}
              style={{
                transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
                transition: 'transform 0.18s ease-out',
              }}
              className="relative w-full max-w-[620px] lg:max-w-[660px] aspect-[580/430] select-none"
            >
              {/* ---------------- BACKGROUND PASTEL ABSTRACT SHAPES (Matching Reference) ---------------- */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none overflow-hidden"
              >
                {/* Broad Sky-Blue Diagonal Pastel Stroke */}
                <div className="absolute top-[6%] right-[4%] w-[460px] h-[110px] -rotate-[28deg] bg-gradient-to-r from-sky-200/60 via-sky-100/40 to-transparent rounded-3xl blur-md" />
                
                {/* Broad Mint Diagonal Pastel Stroke */}
                <div className="absolute bottom-[10%] left-[6%] w-[480px] h-[95px] -rotate-[26deg] bg-gradient-to-r from-emerald-200/50 via-teal-100/40 to-transparent rounded-3xl blur-md" />
                
                {/* Secondary Sky Blue Soft Accent */}
                <div className="absolute top-0 right-1/4 w-52 h-52 bg-sky-100/60 rounded-full blur-3xl" />
              </div>

              {/* ---------------- 7 INDIVIDUAL HIGH-RESOLUTION PRODUCT CARDS ---------------- */}

              {/* CARD 1: TOP-LEFT — Mesh Pen Stand with Stationery & Scissors */}
              <motion.div
                initial={false}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: shouldReduceMotion ? 0 : [-3, 3, -3],
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  y: shouldReduceMotion ? { duration: 0 } : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ scale: 1.05, rotate: -2, zIndex: 30 }}
                className="absolute left-[1%] top-[12%] w-[27%] aspect-[1/1.2] -rotate-[5deg] z-10 cursor-pointer"
                title="Office Stationery & Desk Organizers"
              >
                <div className="w-full h-full bg-white rounded-2xl md:rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-[0_14px_30px_-6px_rgba(0,0,0,0.12),0_6px_14px_-4px_rgba(0,0,0,0.06)] border-[3px] border-white relative overflow-hidden transition-shadow hover:shadow-2xl">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/hero-collage/pen-stand.jpg"
                      alt="Desk Pen Stand with Scissors and Stationery"
                      fill
                      priority
                      className="object-contain"
                      sizes="(max-width: 640px) 130px, 180px"
                    />
                  </div>
                </div>
              </motion.div>

              {/* CARD 2: TOP-CENTER — Corrugated Shipping Box */}
              <motion.div
                initial={false}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: shouldReduceMotion ? 0 : [3, -3, 3],
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  y: shouldReduceMotion ? { duration: 0 } : { duration: 4.6, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
                className="absolute left-[26%] top-[2%] w-[28%] aspect-[1.25/1] -rotate-[2deg] z-5 cursor-pointer"
                title="Packaging & Corrugated Boxes"
              >
                <div className="w-full h-full bg-white rounded-2xl md:rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-[0_14px_30px_-6px_rgba(0,0,0,0.12),0_6px_14px_-4px_rgba(0,0,0,0.06)] border-[3px] border-white relative overflow-hidden transition-shadow hover:shadow-2xl">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/hero-collage/carton-box.jpg"
                      alt="Corrugated Packaging Shipping Box"
                      fill
                      priority
                      className="object-contain"
                      sizes="(max-width: 640px) 140px, 190px"
                    />
                  </div>
                </div>
              </motion.div>

              {/* CARD 3: TOP-RIGHT — Colored Pens Desktop Organizer Tray */}
              <motion.div
                initial={false}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: shouldReduceMotion ? 0 : [-3, 3, -3],
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  y: shouldReduceMotion ? { duration: 0 } : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ scale: 1.05, rotate: -1, zIndex: 30 }}
                className="absolute left-[53%] top-[0%] w-[28%] aspect-[1/1.08] -rotate-[3deg] z-5 cursor-pointer"
                title="Writing Instruments & Gel Pens"
              >
                <div className="w-full h-full bg-white rounded-2xl md:rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-[0_14px_30px_-6px_rgba(0,0,0,0.12),0_6px_14px_-4px_rgba(0,0,0,0.06)] border-[3px] border-white relative overflow-hidden transition-shadow hover:shadow-2xl">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/hero-collage/colored-pens.jpg"
                      alt="Writing Pens Display Organizer"
                      fill
                      priority
                      className="object-contain"
                      sizes="(max-width: 640px) 140px, 190px"
                    />
                  </div>
                </div>
              </motion.div>

              {/* CARD 4: CENTER MAIN FOCAL — Premium A4 Copy Paper Reams */}
              <motion.div
                initial={false}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: shouldReduceMotion ? 0 : [2, -2, 2],
                }}
                transition={{
                  opacity: { duration: 0.55 },
                  scale: { duration: 0.55 },
                  y: shouldReduceMotion ? { duration: 0 } : { duration: 5.0, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ scale: 1.04, rotate: -1.5, zIndex: 35 }}
                className="absolute left-[32%] top-[30%] w-[45%] aspect-[1.22/1] -rotate-[3.5deg] z-20 cursor-pointer"
                title="A4 Copier Paper Bulk Reams"
              >
                <div className="w-full h-full bg-white rounded-2xl md:rounded-3xl p-2.5 sm:p-3 md:p-3.5 shadow-[0_20px_40px_-6px_rgba(0,0,0,0.18),0_10px_22px_-6px_rgba(0,0,0,0.08)] border-[3.5px] border-white relative overflow-hidden transition-shadow hover:shadow-2xl">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/hero-collage/copy-paper.jpg"
                      alt="Premium A4 Office Copy Paper Reams"
                      fill
                      priority
                      className="object-contain"
                      sizes="(max-width: 640px) 230px, 300px"
                    />
                  </div>
                </div>
              </motion.div>

              {/* CARD 5: FAR-RIGHT — Dark Green Heavy-Duty Office Waste Bin */}
              <motion.div
                initial={false}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: shouldReduceMotion ? 0 : [-3, 3, -3],
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  y: shouldReduceMotion ? { duration: 0 } : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ scale: 1.05, rotate: 1, zIndex: 30 }}
                className="absolute right-[0%] top-[16%] w-[28%] aspect-[1/1.28] rotate-[3.5deg] z-10 cursor-pointer"
                title="Industrial & Commercial Waste Bins"
              >
                <div className="w-full h-full bg-white rounded-2xl md:rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-[0_14px_30px_-6px_rgba(0,0,0,0.12),0_6px_14px_-4px_rgba(0,0,0,0.06)] border-[3px] border-white relative overflow-hidden transition-shadow hover:shadow-2xl">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/hero-collage/green-bin.jpg"
                      alt="Dark Green Commercial Office Waste Bin"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 140px, 190px"
                    />
                  </div>
                </div>
              </motion.div>

              {/* CARD 6: BOTTOM-LEFT — Housekeeping Cleaning Supplies Set */}
              <motion.div
                initial={false}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: shouldReduceMotion ? 0 : [3, -3, 3],
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  y: shouldReduceMotion ? { duration: 0 } : { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ scale: 1.05, rotate: -1, zIndex: 30 }}
                className="absolute left-[14%] bottom-[1%] w-[38%] aspect-[1.32/1] -rotate-[3deg] z-10 cursor-pointer"
                title="Housekeeping Chemicals & Cleaning Supplies"
              >
                <div className="w-full h-full bg-white rounded-2xl md:rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-[0_14px_30px_-6px_rgba(0,0,0,0.12),0_6px_14px_-4px_rgba(0,0,0,0.06)] border-[3px] border-white relative overflow-hidden transition-shadow hover:shadow-2xl">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/hero-collage/cleaning-supplies.jpg"
                      alt="Office Housekeeping Cleaning Spray, Sponge, Cleaner and Wipes"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 180px, 240px"
                    />
                  </div>
                </div>
              </motion.div>

              {/* CARD 7: BOTTOM-RIGHT — Stacked Packaging Boxes & Detergent */}
              <motion.div
                initial={false}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: shouldReduceMotion ? 0 : [-2, 2, -2],
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  y: shouldReduceMotion ? { duration: 0 } : { duration: 4.1, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ scale: 1.05, rotate: 1, zIndex: 30 }}
                className="absolute right-[4%] bottom-[2%] w-[34%] aspect-[1.22/1] rotate-[4deg] z-15 cursor-pointer"
                title="Packaging Materials & Heavy Cleaners"
              >
                <div className="w-full h-full bg-white rounded-2xl md:rounded-3xl p-2 sm:p-2.5 md:p-3 shadow-[0_14px_30px_-6px_rgba(0,0,0,0.12),0_6px_14px_-4px_rgba(0,0,0,0.06)] border-[3px] border-white relative overflow-hidden transition-shadow hover:shadow-2xl">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/hero-collage/stacked-boxes.jpg"
                      alt="Stacked Packaging Boxes and Heavy-Duty Cleaning Chemical"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 160px, 220px"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ================= TRUST HIGHLIGHTS FEATURE ROW (Matching Reference) ================= */}
        <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            
            {/* 1. Wide Product Range */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-[#057a3b] shrink-0">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-[13.5px] font-semibold text-slate-900 leading-tight">
                  Wide Product Range
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5 font-normal">
                  Multiple categories
                </div>
              </div>
            </div>

            {/* 2. Trusted by Businesses */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-50 border border-blue-100/80 flex items-center justify-center text-[#2563eb] shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-[13.5px] font-semibold text-slate-900 leading-tight">
                  Trusted by Businesses
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5 font-normal">
                  Across India
                </div>
              </div>
            </div>

            {/* 3. Dedicated Support */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-[#057a3b] shrink-0">
                <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-[13.5px] font-semibold text-slate-900 leading-tight">
                  Dedicated Support
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5 font-normal">
                  For Business Enquiries
                </div>
              </div>
            </div>

            {/* 4. Easy Quotation Process */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-50 border border-blue-100/80 flex items-center justify-center text-[#2563eb] shrink-0">
                <Box className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-[13.5px] font-semibold text-slate-900 leading-tight">
                  Easy Quotation Process
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5 font-normal">
                  For Bulk Orders
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}