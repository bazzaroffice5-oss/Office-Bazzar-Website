'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react';
import {
  Building2,
  Warehouse,
  Users,
  Store,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// 21 Years of Growth Milestones (2005 - 2026)
// ---------------------------------------------------------------------------

interface Milestone {
  id: string;
  year: number;
  badge: string;
  badgeColor: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Normalized position along curve: 0 to 1 */
  fraction: number;
  cardPos: {
    left: number; // percentage from left of stage
    top: number;  // percentage from top of stage
  };
  nodePos: {
    cx: number;   // SVG coordinate (viewBox 0 0 1000 340)
    cy: number;
  };
  logos?: Array<{ name: string; url: string }>;
}

const MILESTONES: Milestone[] = [
  {
    id: 'launch-2005',
    year: 2005,
    badge: 'Foundation',
    badgeColor: 'text-[#004b87] bg-blue-50 border-blue-100',
    title: '2005: Chennai Launch',
    tagline: 'Doorstep B2B Delivery',
    description:
      'Started core B2B office supply distribution in Chennai with dedicated local fulfillment and verified GST billing.',
    icon: Building2,
    fraction: 0.0,
    cardPos: { left: 4, top: 48 },
    nodePos: { cx: 160, cy: 289 },
  },
  {
    id: 'expansion-2012',
    year: 2012,
    badge: 'Expansion',
    badgeColor: 'text-[#004b87] bg-blue-50 border-blue-100',
    title: '2012: Bulk Supply Expansion',
    tagline: 'Multi-Category Warehousing',
    description:
      'Scaled central warehouse capacity to cover institutional housekeeping chemicals, pantry essentials, and industrial supplies.',
    icon: Warehouse,
    fraction: 0.333,
    cardPos: { left: 27, top: 34 },
    nodePos: { cx: 400, cy: 268 },
  },
  {
    id: 'clients-2018',
    year: 2018,
    badge: 'Enterprise',
    badgeColor: 'text-[#F97316] bg-orange-50 border-orange-200',
    title: '2018: 18+ Enterprise Clients',
    tagline: 'Trusted Corporate Supply Partner',
    description:
      'Earned long-term procurement trust from India’s top enterprise leaders with multi-location contract fulfillment.',
    icon: Users,
    fraction: 0.619,
    cardPos: { left: 49, top: 16 },
    nodePos: { cx: 641, cy: 209 },
    logos: [
      {
        name: 'Royal Enfield',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500953/office-bazzar-clients/royal-enfield.webp',
      },
      {
        name: 'TCS',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500958/office-bazzar-clients/tcs.webp',
      },
      {
        name: 'L&T',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500952/office-bazzar-clients/lt.webp',
      },
      {
        name: 'Samsung',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500955/office-bazzar-clients/samsung.webp',
      },
      {
        name: 'IndianOil',
        url: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500951/office-bazzar-clients/indianoil.webp',
      },
    ],
  },
  {
    id: 'digital-2026',
    year: 2026,
    badge: 'Digital Era',
    badgeColor: 'text-[#16a34a] bg-emerald-50 border-emerald-200',
    title: '2026: 1,946+ SKUs Storefront',
    tagline: 'Automated B2B Catalog',
    description:
      'Unified 1,946+ curated workplace products into a fast, automated digital catalog with instant quotation and real-time inventory.',
    icon: Store,
    fraction: 1.0,
    cardPos: { left: 69, top: 3 },
    nodePos: { cx: 920, cy: 55 },
  },
];

const TICK_YEARS = [2005, 2010, 2015, 2020, 2026];

// Exact Cubic Bezier function mapping parameter t (0..1) to (x, y) coordinates
function getBezierPoint(t: number): { x: number; y: number } {
  const p0 = { x: 90, y: 290 };
  const p1 = { x: 380, y: 290 };
  const p2 = { x: 700, y: 240 };
  const p3 = { x: 920, y: 55 };

  const cx = 3 * (p1.x - p0.x);
  const bx = 3 * (p2.x - p1.x) - cx;
  const ax = p3.x - p0.x - cx - bx;

  const cy = 3 * (p1.y - p0.y);
  const by = 3 * (p2.y - p1.y) - cy;
  const ay = p3.y - p0.y - cy - by;

  const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
  const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

  return { x, y };
}

export default function LegacyGrowthSection() {
  const shouldReduceMotion = useReducedMotion();
  const [autoProgress, setAutoProgress] = useState<number>(1.0);
  const [manualYear, setManualYear] = useState<number | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const pauseUntilRef = useRef<number>(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // Continuous auto-play loop constants
  const CYCLE_DURATION = 9200; // 9.2s full cycle
  const SWEEP_DURATION = 7200; // 7.2s smooth sweep from 2005 to 2026
  // Remaining 2.0s pauses at 2026 summit before restarting from 2005

  useEffect(() => {
    if (shouldReduceMotion) {
      setAutoProgress(1.0);
      return;
    }

    let rafId: number;
    let cycleStart: number | null = null;

    const tick = (now: number) => {
      // If user interacted, pause the auto loop temporarily
      if (Date.now() < pauseUntilRef.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (manualYear !== null) {
        setManualYear(null);
      }

      if (cycleStart === null) {
        cycleStart = now;
      }

      const elapsed = (now - cycleStart) % CYCLE_DURATION;

      if (elapsed < SWEEP_DURATION) {
        // Smooth progression from 0 to 1
        setAutoProgress(elapsed / SWEEP_DURATION);
      } else {
        // Pause at summit (2026)
        setAutoProgress(1.0);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [shouldReduceMotion, manualYear]);

  // Derived timeline progress & current year
  const activeProgress = useMemo(() => {
    if (manualYear !== null) {
      return Math.max(0, Math.min(1, (manualYear - 2005) / 21));
    }
    return autoProgress;
  }, [autoProgress, manualYear]);

  const currentYear = useMemo(() => {
    if (manualYear !== null) return manualYear;
    return Math.min(2026, Math.max(2005, Math.round(2005 + activeProgress * 21)));
  }, [activeProgress, manualYear]);

  // Active milestone based on current year or hovered card
  const activeMilestone = useMemo(() => {
    if (hoveredCardId) {
      const found = MILESTONES.find((m) => m.id === hoveredCardId);
      if (found) return found;
    }
    let current = MILESTONES[0];
    for (const m of MILESTONES) {
      if (currentYear >= m.year) {
        current = m;
      }
    }
    return current;
  }, [currentYear, hoveredCardId]);

  // Calculate live beacon position at current progress along the curve
  const beaconPoint = useMemo(() => {
    return getBezierPoint(Math.max(0, Math.min(1, activeProgress)));
  }, [activeProgress]);

  // Temporary pause on interaction
  const handleMilestoneClick = (year: number) => {
    setManualYear(year);
    pauseUntilRef.current = Date.now() + 3800; // Pause auto-play for 3.8s on selection
  };

  const handleCardHover = (id: string | null, year?: number) => {
    setHoveredCardId(id);
    if (id && year) {
      pauseUntilRef.current = Date.now() + 3500;
    }
  };

  // 3D perspective tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 140, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [2, -2]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [-2.5, 2.5]);

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

  // SVG Curve definition (viewBox 0 0 1000 340)
  const curvePath = 'M 90,290 C 380,290 700,240 920,55';

  return (
    <section
      id="our-legacy"
      className="relative w-full py-12 md:py-16 bg-white overflow-hidden border-b border-slate-100"
      aria-label="21 Years of Office Bazzar"
    >
      {/* Subtle Background Architectural Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 75, 135, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 75, 135, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <div className="b2b-container relative z-10">
        {/* ================================================================= */}
        {/* 1. Header & Intro (Clean B2B Typography, No AI Sparkles/Serifs)    */}
        {/* ================================================================= */}
        <div className="max-w-3xl mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#004b87]/8 text-[#004b87] text-xs font-semibold uppercase tracking-wider mb-3 border border-[#004b87]/15">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004b87]" />
            OUR 21-YEAR JOURNEY (2005 — 2026)
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
            21 Years of Powering Indian Workplaces
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
            From a local Chennai supply operation to a pan-India digital procurement hub, we&apos;ve spent over two decades scale-proofing B2B procurement for corporate enterprises.
          </p>
        </div>

        {/* ================================================================= */}
        {/* 2. Interactive 3D Growth Curve Stage (Compact 300px–340px)        */}
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
            className="relative w-full rounded-xl bg-white border border-slate-200/80 shadow-[0_12px_32px_-10px_rgba(0,75,135,0.06)] p-3 sm:p-6 lg:p-7 transition-shadow duration-300"
          >
            {/* Stage Inner Coordinates Container */}
            <div className="relative w-full h-[290px] sm:h-[320px] md:h-[340px]">
              {/* Subtle Stage Grid Background */}
              <div
                className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: '5% 12.5%',
                }}
                aria-hidden="true"
              />

              {/* Responsive SVG Graphic Layer */}
              <svg
                viewBox="0 0 1000 340"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              >
                <defs>
                  {/* Linear gradient for the royal blue curve stroke */}
                  <linearGradient id="compactCurveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#004b87" />
                    <stop offset="65%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>

                  {/* Soft ambient blur filter for glowing under-curve */}
                  <filter id="compactCurveGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Dot glow filter */}
                  <filter id="energyDotGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Faint Dashed Baseline Guide */}
                <line
                  x1="90"
                  y1="290"
                  x2="920"
                  y2="290"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Dashed Vertical Stem Lines Connecting Nodes to Cards */}
                {MILESTONES.map((m) => {
                  const isActive = m.year <= currentYear;
                  return (
                    <g key={`stem-${m.id}`}>
                      <line
                        x1={m.nodePos.cx}
                        y1={m.nodePos.cy}
                        x2={m.nodePos.cx}
                        y2={m.id === 'digital-2026' ? m.nodePos.cy - 10 : m.nodePos.cy - 35}
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
                  strokeWidth="14"
                  strokeLinecap="round"
                  opacity="0.22"
                  filter="url(#compactCurveGlow)"
                  style={{ pathLength: activeProgress }}
                />

                {/* Base Faded Full Curve Path (Guides the eye) */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Active Royal Blue Growth Curve (dynamically syncs with automatic loop) */}
                <motion.path
                  d={curvePath}
                  fill="none"
                  stroke="url(#compactCurveGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  style={{ pathLength: activeProgress }}
                />

                {/* Vibrant Accent Orange Spine Stroke on top of the blue curve */}
                <motion.path
                  d={curvePath}
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ pathLength: activeProgress }}
                />

                {/* Continuous Traveling Beacon Light Dot (Synced smoothly with active curve) */}
                {!shouldReduceMotion && (
                  <g className="transition-all duration-75">
                    {/* Glowing outer halo */}
                    <circle
                      cx={beaconPoint.x}
                      cy={beaconPoint.y}
                      r="8"
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                    />
                    {/* Core energy dot */}
                    <circle
                      cx={beaconPoint.x}
                      cy={beaconPoint.y}
                      r="4.5"
                      fill="#F97316"
                      filter="url(#energyDotGlow)"
                    />
                  </g>
                )}

                {/* Milestone Nodes Along the Curve with Continuous Breathing Rings */}
                {MILESTONES.map((m) => {
                  const isReached = m.year <= currentYear;
                  const isCurrent = activeMilestone.id === m.id;

                  if (m.id === 'digital-2026') {
                    // Summit / 2026 Node
                    return (
                      <g key={m.id} onClick={() => handleMilestoneClick(m.year)} className="cursor-pointer pointer-events-auto">
                        {/* Outer pulsating aura */}
                        <circle
                          cx={m.nodePos.cx}
                          cy={m.nodePos.cy}
                          r="16"
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
                          r="11"
                          fill="#ffffff"
                          stroke="#004b87"
                          strokeWidth="3.5"
                          className="transition-all duration-300"
                        />
                        {/* Orange core dot */}
                        <circle
                          cx={m.nodePos.cx}
                          cy={m.nodePos.cy}
                          r="5.5"
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

                      {/* Continuous breathing pulse ring on active milestones */}
                      {isReached && !shouldReduceMotion && (
                        <circle
                          cx={m.nodePos.cx}
                          cy={m.nodePos.cy}
                          r="13"
                          fill="none"
                          stroke={isCurrent ? '#F97316' : '#0284c7'}
                          strokeWidth="1.5"
                          opacity="0.35"
                          className="animate-pulse"
                        />
                      )}

                      {/* White border circle with blue ring */}
                      <circle
                        cx={m.nodePos.cx}
                        cy={m.nodePos.cy}
                        r="8"
                        fill="#ffffff"
                        stroke={isReached ? '#004b87' : '#cbd5e1'}
                        strokeWidth="3"
                        className="transition-all duration-300"
                      />

                      {/* Center dot */}
                      <circle
                        cx={m.nodePos.cx}
                        cy={m.nodePos.cy}
                        r="3.5"
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
                const isPast = m.year <= currentYear;
                const isHovered = hoveredCardId === m.id;

                return (
                  <motion.div
                    key={m.id}
                    onClick={() => handleMilestoneClick(m.year)}
                    onMouseEnter={() => handleCardHover(m.id, m.year)}
                    onMouseLeave={() => handleCardHover(null)}
                    style={{
                      left: `${m.cardPos.left}%`,
                      top: `${m.cardPos.top}%`,
                      transformStyle: 'preserve-3d',
                    }}
                    animate={{
                      scale: isSelected ? 1.03 : isHovered ? 1.01 : 1,
                      y: isSelected ? -5 : 0,
                      zIndex: isSelected ? 40 : 20,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 24,
                    }}
                    className={`absolute hidden md:block cursor-pointer select-none transition-all duration-200 ${
                      m.id === 'digital-2026'
                        ? 'w-[200px] sm:w-[220px]'
                        : m.id === 'clients-2018'
                        ? 'w-[230px] sm:w-[250px]'
                        : 'w-[170px] sm:w-[195px]'
                    }`}
                  >
                    <div
                      className={`relative rounded-xl p-2.5 sm:p-3 bg-white transition-all duration-200 ${
                        isSelected
                          ? 'border-2 border-[#004b87] shadow-[0_12px_28px_-8px_rgba(0,75,135,0.18)] ring-2 ring-[#004b87]/10'
                          : isPast
                          ? 'border border-slate-200 shadow-[0_6px_18px_-6px_rgba(0,75,135,0.08)] hover:border-slate-300'
                          : 'border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Top Row: Year/Category Pill + Minimal Icon */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${m.badgeColor}`}>
                          {m.badge}
                        </span>
                        <div
                          className={`p-1 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#004b87] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Content: Clean B2B sans typography */}
                      <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                          {m.title}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">
                          {m.tagline}
                        </p>
                      </div>

                      {/* Card 3 (2018): Real Client Logos Row */}
                      {m.logos && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between gap-1 px-0.5">
                            {m.logos.map((logo) => (
                              <div
                                key={logo.name}
                                title={logo.name}
                                className="h-4 flex items-center justify-center grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all"
                              >
                                <img
                                  src={logo.url}
                                  alt={logo.name}
                                  className="max-h-3.5 max-w-[36px] object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ============================================================= */}
            {/* 3. Automatic Progress Bar Track & Clamped Floating Pill       */}
            {/* ============================================================= */}
            <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-100">
              <div className="flex flex-col gap-2.5">
                {/* Clean Status Row (Zero manual drag/scrub instructions) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                      Growth Timeline (2005 — 2026)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="text-slate-400">Cycle:</span>
                    <span className="font-semibold text-[#004b87]">21 Years of Continuous Evolution</span>
                  </div>
                </div>

                {/* Progress Bar Container with Clamped Floating Pill */}
                <div className="relative w-full py-3">
                  {/* Track Background */}
                  <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    {/* Active Progress Fill */}
                    <div
                      className="h-full bg-gradient-to-r from-[#004b87] via-[#0284c7] to-[#004b87] transition-all duration-75 ease-out"
                      style={{ width: `${activeProgress * 100}%` }}
                    />
                  </div>

                  {/* Dynamic Floating Pill (Mathematically Clamped: ZERO Overflow/Clipping) */}
                  <div
                    className="absolute top-1/2 pointer-events-none z-20 transition-all duration-75 ease-out"
                    style={{
                      left: `${activeProgress * 100}%`,
                      transform: `translate(-${activeProgress * 100}%, -50%)`,
                    }}
                  >
                    <div className="flex items-center shadow-md rounded-full bg-[#004b87] text-white border-2 border-white pl-2 pr-2.5 py-0.5 gap-1.5 whitespace-nowrap">
                      <div className="w-2 h-2 rounded-full bg-[#F97316] ring-2 ring-white/80 animate-pulse" />
                      <span className="text-xs font-bold font-mono text-white">
                        {currentYear}
                      </span>
                      <span className="text-[10px] font-medium text-slate-200">
                        {currentYear === 2005
                          ? 'Foundation'
                          : `${currentYear - 2005} Yrs Growth`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Year Tick Marks along the bottom */}
                <div className="relative w-full flex justify-between px-1 text-[11px] font-semibold text-slate-500 select-none">
                  {TICK_YEARS.map((year) => {
                    const isPassed = year <= currentYear;
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => handleMilestoneClick(year)}
                        className={`transition-colors text-center cursor-pointer hover:text-[#004b87] ${
                          isPassed ? 'text-[#004b87] font-bold' : 'text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-1 h-1.5 mx-auto mb-1 rounded-full ${
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
        {/* Mobile Milestone Cards (Clean, Compact Fallback for Phones)       */}
        {/* ================================================================= */}
        <div className="mt-6 md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MILESTONES.map((m) => {
            const IconComponent = m.icon;
            const isSelected = activeMilestone.id === m.id;
            return (
              <button
                key={`mobile-${m.id}`}
                type="button"
                onClick={() => handleMilestoneClick(m.year)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-white border-[#004b87] ring-2 ring-[#004b87]/15 shadow-sm'
                    : 'bg-white/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-[#004b87] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {m.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
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
