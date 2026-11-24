'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from 'motion/react';
import {
  Building2,
  Warehouse,
  Users,
  Store,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// 21 Years of Growth Milestones (2005 - 2026)
// ---------------------------------------------------------------------------

interface Milestone {
  id: string;
  year: number;
  label: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  ribbonColor: 'blue' | 'orange';
  /** Approximate relative position along the curve (percentage: 0 - 100) */
  curvePercent: number;
  /** Responsive coordinate positions for the milestone card (percentages) */
  cardPos: {
    left: number; // percentage from left of stage
    top: number;  // percentage from top of stage
  };
  nodePos: {
    cx: number;   // SVG coordinate (viewBox 0 0 1000 480)
    cy: number;
  };
  logos?: Array<{ name: string; url: string; fallbackDomain: string }>;
}

const MILESTONES: Milestone[] = [
  {
    id: 'launch-2005',
    year: 2005,
    label: 'Foundation Year',
    title: '2005: Chennai Launch',
    tagline: 'Doorstep B2B Delivery',
    description:
      'Started core B2B office supply distribution in Chennai with dedicated local fulfillment and verified GST billing.',
    icon: Building2,
    ribbonColor: 'blue',
    curvePercent: 0,
    cardPos: { left: 4, top: 58 },
    nodePos: { cx: 165, cy: 394 },
  },
  {
    id: 'expansion-2012',
    year: 2012,
    label: '7 Years of Growth',
    title: '2012: Bulk Supply Expansion',
    tagline: 'Multi-Category Warehousing',
    description:
      'Scaled central warehouse capacity to cover institutional housekeeping chemicals, pantry essentials, and industrial supplies.',
    icon: Warehouse,
    ribbonColor: 'blue',
    curvePercent: 33.3,
    cardPos: { left: 29, top: 43 },
    nodePos: { cx: 418, cy: 366 },
  },
  {
    id: 'clients-2018',
    year: 2018,
    label: '13 Years of Growth',
    title: '2018: 18+ Enterprise Clients',
    tagline: 'Trusted Corporate Supply Partner',
    description:
      'Earned long-term procurement trust from India’s top enterprise leaders with multi-location contract fulfillment.',
    icon: Users,
    ribbonColor: 'orange',
    curvePercent: 61.9,
    cardPos: { left: 52, top: 22 },
    nodePos: { cx: 642, cy: 296 },
    logos: [
      {
        name: 'Royal Enfield',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500953/office-bazzar-clients/royal-enfield.webp',
        fallbackDomain: 'royalenfield.com',
      },
      {
        name: 'TCS',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500958/office-bazzar-clients/tcs.webp',
        fallbackDomain: 'tcs.com',
      },
      {
        name: 'L&T',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500952/office-bazzar-clients/lt.webp',
        fallbackDomain: 'larsentoubro.com',
      },
      {
        name: 'Samsung',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500955/office-bazzar-clients/samsung.webp',
        fallbackDomain: 'samsung.com',
      },
      {
        name: 'IndianOil',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500951/office-bazzar-clients/indianoil.webp',
        fallbackDomain: 'iocl.com',
      },
    ],
  },
  {
    id: 'digital-2026',
    year: 2026,
    label: '21 Years of Growth',
    title: '2026: 1,946+ SKUs Digital Storefront',
    tagline: 'Automated B2B Procurement',
    description:
      'Unified 1,946+ curated workplace products into a fast, automated digital catalog with instant quotation and real-time inventory.',
    icon: Store,
    ribbonColor: 'orange',
    curvePercent: 100,
    cardPos: { left: 66, top: 3 },
    nodePos: { cx: 920, cy: 80 },
  },
];

const TICK_YEARS = [2005, 2010, 2015, 2020, 2026];

export default function LegacyGrowthSection() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Mouse 3D perspective tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 140, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [2.5, -2.5]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [-3.5, 3.5]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY, shouldReduceMotion]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Current progress fraction (0 to 1) from 2005 to 2026
  const progressFraction = useMemo(() => {
    return Math.max(0, Math.min(1, (selectedYear - 2005) / (2026 - 2005)));
  }, [selectedYear]);

  // Determine active milestone based on selectedYear
  const activeMilestone = useMemo(() => {
    let closest = MILESTONES[0];
    let minDiff = Infinity;
    for (const m of MILESTONES) {
      const diff = Math.abs(m.year - selectedYear);
      if (diff < minDiff) {
        minDiff = diff;
        closest = m;
      }
    }
    return closest;
  }, [selectedYear]);

  // Milestone click handler
  const handleMilestoneClick = (year: number) => {
    setSelectedYear(year);
  };

  // Slider change handler
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(parseInt(e.target.value, 10));
  };

  // SVG Curve Path definition: starts at (90, 395) and accelerates up to (920, 80)
  const curvePath = 'M 90,395 C 380,395 720,340 920,80';

  return (
    <section
      id="our-legacy"
      className="relative w-full py-16 sm:py-24 bg-gradient-to-b from-white via-[#f8fafc] to-white overflow-hidden border-b border-slate-100"
      aria-label="21 Years of Office Bazzar"
    >
      {/* Background Architectural Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 75, 135, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 75, 135, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      {/* Ambient Top Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[#004b87]/5 via-[#0284c7]/5 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="b2b-container relative z-10">
        {/* ================================================================= */}
        {/* 1. Header & Intro Badge                                           */}
        {/* ================================================================= */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004b87]/10 text-[#004b87] text-xs font-bold uppercase tracking-wider mb-4 border border-[#004b87]/15"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#004b87]" />
            OUR LEGACY
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-bold text-slate-900 tracking-tight leading-[1.18] sm:leading-[1.15] mb-5"
          >
            21 Years of Powering Indian Workplaces
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl"
          >
            From a local Chennai launch to a pan-India digital B2B hub, we’ve spent over two decades
            scale-proofing procurement for enterprises.
          </motion.p>
        </div>

        {/* ================================================================= */}
        {/* 2. Interactive 3D Growth Curve Stage                              */}
        {/* ================================================================= */}
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full [perspective:1200px]"
        >
          <motion.div
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }}
            className="relative w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-[0_20px_50px_-15px_rgba(0,75,135,0.08)] p-4 sm:p-8 lg:p-10 transition-shadow duration-300"
          >
            {/* Stage Inner Coordinates Container */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/8.5] min-h-[440px] sm:min-h-[480px] lg:min-h-[520px]">
              {/* Subtle Stage Grid Background */}
              <div
                className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden opacity-50"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(203, 213, 225, 0.5) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(203, 213, 225, 0.5) 1px, transparent 1px)
                  `,
                  backgroundSize: '5% 10%',
                }}
                aria-hidden="true"
              />

              {/* Responsive SVG Graphic Layer */}
              <svg
                viewBox="0 0 1000 480"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              >
                <defs>
                  {/* Linear gradient for the royal blue curve stroke */}
                  <linearGradient id="curveGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#004b87" />
                    <stop offset="70%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>

                  {/* Soft ambient blur filter for glowing under-curve */}
                  <filter id="curveGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Faint Dashed Baseline Guide (bottom-left across) */}
                <line
                  x1="90"
                  y1="395"
                  x2="920"
                  y2="395"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Dashed Vertical Stem Lines Connecting Nodes to Cards */}
                {MILESTONES.map((m) => {
                  const isActive = m.year <= selectedYear;
                  return (
                    <g key={`stem-${m.id}`}>
                      <line
                        x1={m.nodePos.cx}
                        y1={m.nodePos.cy}
                        x2={m.nodePos.cx}
                        y2={m.id === 'digital-2026' ? m.nodePos.cy - 10 : m.nodePos.cy - 50}
                        stroke={isActive ? '#0284c7' : '#cbd5e1'}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="transition-colors duration-300"
                      />
                    </g>
                  );
                })}

                {/* Ambient Soft Glow Underneath the Curve */}
                <motion.path
                  d={curvePath}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="16"
                  strokeLinecap="round"
                  opacity="0.25"
                  filter="url(#curveGlow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progressFraction }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
                />

                {/* Base Faded Full Curve Path (Guides the eye) */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Active Royal Blue Growth Curve (dynamically syncs with scrubber) */}
                <motion.path
                  d={curvePath}
                  fill="none"
                  stroke="url(#curveGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progressFraction }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' }}
                />

                {/* Vibrant Accent Orange Spine Stroke on top of the blue curve */}
                <motion.path
                  d={curvePath}
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progressFraction }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' }}
                />

                {/* Milestone Nodes Along the Curve */}
                {MILESTONES.map((m) => {
                  const isReached = m.year <= selectedYear;
                  const isCurrent = activeMilestone.id === m.id;

                  if (m.id === 'digital-2026') {
                    // Summit / 2026 Node with glowing aura
                    return (
                      <g key={m.id} className="cursor-pointer pointer-events-auto">
                        {/* Outer pulsating aura */}
                        <circle
                          cx={m.nodePos.cx}
                          cy={m.nodePos.cy}
                          r="18"
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2"
                          opacity={isReached ? 0.35 : 0.1}
                          className={isReached ? 'animate-ping' : ''}
                        />
                        {/* Main blue ring */}
                        <circle
                          cx={m.nodePos.cx}
                          cy={m.nodePos.cy}
                          r="12"
                          fill="#ffffff"
                          stroke="#004b87"
                          strokeWidth="4"
                          className="transition-all duration-300"
                        />
                        {/* Orange core dot */}
                        <circle
                          cx={m.nodePos.cx}
                          cy={m.nodePos.cy}
                          r="6"
                          fill={isReached ? '#F97316' : '#94a3b8'}
                          className="transition-colors duration-300"
                        />
                      </g>
                    );
                  }

                  return (
                    <g
                      key={m.id}
                      onClick={() => handleMilestoneClick(m.year)}
                      className="cursor-pointer pointer-events-auto"
                    >
                      {/* Interactive hit area */}
                      <circle cx={m.nodePos.cx} cy={m.nodePos.cy} r="16" fill="transparent" />

                      {/* White border circle with blue ring */}
                      <circle
                        cx={m.nodePos.cx}
                        cy={m.nodePos.cy}
                        r="9"
                        fill="#ffffff"
                        stroke={isReached ? '#004b87' : '#cbd5e1'}
                        strokeWidth="3.5"
                        className="transition-all duration-300"
                      />

                      {/* Center dot */}
                      <circle
                        cx={m.nodePos.cx}
                        cy={m.nodePos.cy}
                        r="4"
                        fill={
                          isCurrent
                            ? '#F97316'
                            : isReached
                            ? '#004b87'
                            : '#cbd5e1'
                        }
                        className="transition-colors duration-300"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* ============================================================= */}
              {/* Floating Milestone Cards (HTML overlay with 3D Z-Depth)       */}
              {/* ============================================================= */}
              {MILESTONES.map((m) => {
                const IconComponent = m.icon;
                const isSelected = activeMilestone.id === m.id;
                const isPast = m.year <= selectedYear;
                const isHovered = hoveredCardId === m.id;

                return (
                  <motion.div
                    key={m.id}
                    onClick={() => handleMilestoneClick(m.year)}
                    onMouseEnter={() => setHoveredCardId(m.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    style={{
                      left: `${m.cardPos.left}%`,
                      top: `${m.cardPos.top}%`,
                      transformStyle: 'preserve-3d',
                    }}
                    animate={{
                      scale: isSelected ? 1.04 : isHovered ? 1.02 : 1,
                      y: isSelected ? -8 : 0,
                      zIndex: isSelected ? 40 : 20,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 24,
                    }}
                    className={`absolute hidden md:block cursor-pointer select-none transition-all duration-200 ${
                      m.id === 'digital-2026'
                        ? 'w-[230px] sm:w-[260px]'
                        : m.id === 'clients-2018'
                        ? 'w-[250px] sm:w-[280px]'
                        : 'w-[190px] sm:w-[220px]'
                    }`}
                  >
                    <div
                      className={`relative rounded-xl p-3 sm:p-4 bg-white transition-all duration-200 ${
                        isSelected
                          ? 'border-2 border-[#004b87] shadow-[0_16px_36px_-10px_rgba(0,75,135,0.22)] ring-4 ring-[#004b87]/10'
                          : isPast
                          ? 'border border-slate-200/90 shadow-[0_10px_25px_-8px_rgba(0,75,135,0.1)] hover:border-slate-300'
                          : 'border border-slate-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Decorative Ribbon Bookmark on Top-Right */}
                      <div
                        className={`absolute top-0 right-3 w-3 h-5 ${
                          m.ribbonColor === 'orange' ? 'bg-[#F97316]' : 'bg-[#004b87]'
                        }`}
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)',
                        }}
                        aria-hidden="true"
                      />

                      {/* Header Row: Icon + Title */}
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-2 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#004b87] text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="pr-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {m.title}
                          </h3>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">
                            {m.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Card 3 (2018): Real Client Logos Row */}
                      {m.logos && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <div className="flex items-center justify-between gap-1.5 px-0.5">
                            {m.logos.map((logo) => (
                              <div
                                key={logo.name}
                                title={logo.name}
                                className="h-5 flex items-center justify-center grayscale hover:grayscale-0 opacity-75 hover:opacity-100 transition-all"
                              >
                                <img
                                  src={logo.url}
                                  alt={logo.name}
                                  className="max-h-4 max-w-[42px] object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Active Indicator Pulse */}
                      {isSelected && (
                        <motion.div
                          layoutId="activeCardGlow"
                          className="absolute -inset-0.5 rounded-xl border border-[#004b87]/40 pointer-events-none"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ============================================================= */}
            {/* 3. Interactive Year Scrubber Slider Track (2005 -> 2026)      */}
            {/* ============================================================= */}
            <div className="mt-6 sm:mt-10 pt-6 border-t border-slate-100">
              <div className="flex flex-col gap-3">
                {/* Scrubber Label + Selected Status Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Timeline Progress
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      • Drag slider or click years
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <span>Scrub 21 years of growth</span>
                    <span className="text-slate-400">↔</span>
                  </div>
                </div>

                {/* Scrubber Range Input & Custom Track Container */}
                <div className="relative w-full py-4">
                  {/* Track Background */}
                  <div className="relative w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    {/* Active Progress Fill */}
                    <div
                      className="h-full bg-gradient-to-r from-[#004b87] via-[#0284c7] to-[#004b87] transition-all duration-150"
                      style={{ width: `${progressFraction * 100}%` }}
                    />
                  </div>

                  {/* HTML Range Input for accessibility & smooth scrubbing */}
                  <input
                    type="range"
                    min="2005"
                    max="2026"
                    step="1"
                    value={selectedYear}
                    onChange={handleSliderChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    aria-label="Timeline Year Scrubber from 2005 to 2026"
                    aria-valuemin={2005}
                    aria-valuemax={2026}
                    aria-valuenow={selectedYear}
                  />

                  {/* Dynamic Floating Pill Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-20 transition-all duration-150"
                    style={{
                      left: `calc(${progressFraction * 100}% - ${progressFraction * 24}px)`,
                    }}
                  >
                    <div className="flex items-center shadow-lg rounded-full bg-[#004b87] text-white border-2 border-white pl-2 pr-3 py-1 gap-2 whitespace-nowrap -translate-x-1/2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F97316] ring-2 ring-white/80 animate-pulse" />
                      <span className="text-xs font-bold font-mono text-white">
                        {selectedYear}
                      </span>
                      <span className="text-[11px] font-medium text-slate-200">
                        {selectedYear === 2005
                          ? 'Foundation Year'
                          : `${selectedYear - 2005} Years of Growth`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Year Tick Marks along the bottom */}
                <div className="relative w-full flex justify-between px-1 text-[11px] sm:text-xs font-semibold text-slate-500 select-none">
                  {TICK_YEARS.map((year) => {
                    const isPassed = year <= selectedYear;
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => setSelectedYear(year)}
                        className={`transition-colors text-center cursor-pointer hover:text-[#004b87] ${
                          isPassed ? 'text-[#004b87] font-bold' : 'text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-1 h-2 mx-auto mb-1 rounded-full ${
                            isPassed ? 'bg-[#004b87]' : 'bg-slate-300'
                          }`}
                        />
                        {year}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ================================================================= */}
        {/* Mobile Milestone Cards Accordion / List (Smooth Fallback)         */}
        {/* Shown gracefully on very small mobile screens for perfect readability */}
        {/* ================================================================= */}
        <div className="mt-8 md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MILESTONES.map((m) => {
            const IconComponent = m.icon;
            const isSelected = activeMilestone.id === m.id;
            return (
              <button
                key={`mobile-${m.id}`}
                type="button"
                onClick={() => handleMilestoneClick(m.year)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-white border-[#004b87] ring-2 ring-[#004b87]/15 shadow-md'
                    : 'bg-white/70 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-[#004b87] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {m.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.tagline}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {m.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
