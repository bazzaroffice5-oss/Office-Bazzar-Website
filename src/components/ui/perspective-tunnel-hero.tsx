'use client';

import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  MotionValue,
} from 'framer-motion';
import {
  ChevronRight,
  Truck,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

/**
 * Tunnel Product Item Interface
 */
export interface TunnelProductItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  priceNote: string;
  src: string;
  href: string;
}

/**
 * Spatial Tunnel Card Data with geometric positions
 */
export interface TunnelCardData {
  item: TunnelProductItem;
  angleDeg: number;
  angleCos: number;
  angleSin: number;
  radiusFactorX: number;
  radiusFactorY: number;
  rotationZ: number;
  index: number;
}

/**
 * Stage Dimensions Interface
 */
export interface StageDimensions {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
}

/**
 * 9 Verified Office Bazzar Corporate Procurement Products
 * High-resolution local image assets with verified aspect ratios
 */
const OFFICE_PRODUCTS: TunnelProductItem[] = [
  {
    id: 'jk-copier',
    title: 'JK Copier Paper A4',
    subtitle: '75 GSM • 500 Sheets Ream • 98% Brightness',
    category: 'Paper Supplies',
    badge: 'WHOLESALE BULK',
    badgeBg: 'bg-red-50 border-red-200',
    badgeText: 'text-[#d9232d]',
    priceNote: 'Direct Mill ARC Rates',
    src: '/images/banners/jk-copier.jpg',
    href: '/category/office-stationery-suppliers-in-chennai',
  },
  {
    id: 'taski-chemicals',
    title: 'Diversey Taski Chemicals',
    subtitle: 'Commercial R1–R9 Cleaning System 5L',
    category: 'Facility Care',
    badge: 'COMMERCIAL HYGIENE',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    priceNote: '100% Genuine OEM Concentrate',
    src: '/images/banners/taski-diversey.jpg',
    href: '/category/cleaning-chemical-suppliers-in-chennai',
  },
  {
    id: 'kangaro-stationery',
    title: 'Kangaro Punchers & Files',
    subtitle: 'Heavy Duty 3025 Box Files & 2-Hole Drills',
    category: 'Office Supplies',
    badge: 'CORE STATIONERY',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    priceNote: 'Contract Pack Options',
    src: '/images/banners/kangaro-stationery.jpg',
    href: '/category/office-stationery-suppliers-in-chennai',
  },
  {
    id: 'laser-toners',
    title: 'Laser Toner Cartridges',
    subtitle: 'HP, Canon & High-Yield 12A / 88A',
    category: 'IT Consumables',
    badge: 'IT PROCUREMENT',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-700',
    priceNote: 'Guaranteed Page Yield',
    src: '/images/banners/hp-canon-toners.jpg',
    href: '/category/printer-cartridges-suppliers-in-chennai',
  },
  {
    id: 'housekeeping-facility',
    title: 'Janitorial & Waste Care',
    subtitle: 'Commercial Microfiber Mops & Heavy Bins',
    category: 'Housekeeping',
    badge: 'FACILITY CARE',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800',
    priceNote: 'Heavy Duty Industrial Grade',
    src: '/images/banners/housekeeping-facility-care.jpg',
    href: '/category/housekeeping-items-and-equipment',
  },
  {
    id: 'packaging-materials',
    title: 'Packaging Adhesive & Rolls',
    subtitle: 'BOPP Brown Cello Tape & Bubble Wrap',
    category: 'Packaging',
    badge: 'DISPATCH PACKS',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-orange-700',
    priceNote: 'Bulk Pallet Pricing',
    src: '/images/banners/packaging-materials.jpg',
    href: '/category/packaging-adhesive-material-in-chennai',
  },
  {
    id: 'display-boards',
    title: 'Magnetic Whiteboards',
    subtitle: 'Non-Magnetic & Ceramic Stands with Castors',
    category: 'Presentation',
    badge: 'CONFERENCE GEAR',
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-700',
    priceNote: 'Corporate Boardroom Grade',
    src: '/images/banners/boards-displays.jpg',
    href: '/category/display-and-notice-board-dealers-in-chennai',
  },
  {
    id: 'office-machines',
    title: 'Paper Shredding Machines',
    subtitle: 'Cross-Cut High Security DIN P-4 Shredders',
    category: 'Office Machines',
    badge: 'DATA SECURITY',
    badgeBg: 'bg-slate-100 border-slate-300',
    badgeText: 'text-slate-800',
    priceNote: 'On-site Warranty Support',
    src: '/images/banners/office-machines-tools.jpg',
    href: '/category/best-paper-shredders-and-currency-counting-machine-in-chennai',
  },
  {
    id: 'workspace-essentials',
    title: 'Executive Desk Organizers',
    subtitle: 'Document Trays, Pen Caddies & File Binders',
    category: 'Workspace',
    badge: 'ANNUAL RATE CONTRACT',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-700',
    priceNote: 'Pre-Approved Enterprise ARCs',
    src: '/images/banners/stationery-files-workspace.jpg',
    href: '/category/office-stationery-suppliers-in-chennai',
  },
];

/**
 * Geometric distribution around the tunnel periphery
 * Leaving central corridor open for copy and brand messaging
 */
const TUNNEL_CARDS: TunnelCardData[] = OFFICE_PRODUCTS.map((item, i) => {
  // Elliptical distribution around perimeter
  const angles = [18, 62, 105, 150, 198, 242, 285, 328, 356];
  const angleDeg = angles[i % angles.length];
  const rad = angleDeg * (Math.PI / 180);

  // Radial factor keeps center open for typography
  const radiusFactorX = 0.34 + (i % 3) * 0.05;
  const radiusFactorY = 0.28 + (i % 2) * 0.06;

  // Gentle subtle rotation for natural tactile appearance
  const rotationZ = (i % 2 === 0 ? 1 : -1) * (2.5 + (i % 4) * 1.5);

  return {
    item,
    angleDeg,
    angleCos: Math.cos(rad),
    angleSin: Math.sin(rad),
    radiusFactorX,
    radiusFactorY,
    rotationZ,
    index: i,
  };
});

/**
 * Spring configuration for camera parallax
 */
const PARALLAX_SPRING = { stiffness: 50, damping: 22, mass: 0.5 };

/**
 * Camera Parallax hook that tracks pointer over target without causing React re-renders
 */
function useCameraParallax(containerRef: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, PARALLAX_SPRING);
  const y = useSpring(rawY, PARALLAX_SPRING);

  useEffect(() => {
    if (!enabled) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Normalized coordinates (-1 to 1) relative to container center
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      rawX.set(Math.max(-1, Math.min(1, normX)));
      rawY.set(Math.max(-1, Math.min(1, normY)));
    };

    const onPointerLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave, { passive: true });

    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [containerRef, enabled, rawX, rawY]);

  return { x, y };
}

/**
 * TunnelCard Component with proper depth mapping, dynamic z-index, and non-clipping Z range
 */
interface TunnelCardProps {
  card: TunnelCardData;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  total: number;
  stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
  // Stagger window along progression
  const staggerSpan = 0.52;
  const start = (card.index / total) * (1 - staggerSpan);
  const end = start + staggerSpan;

  // Local progression for this specific card [0, 1]
  const localProgress = useTransform(progress, [start, end], [0, 1]);

  // Safe depth range: starts far in distance, advances to focal foreground, stops BEFORE camera clipping
  const farZ = stage.isMobile ? -950 : -1400;
  const nearZ = stage.isMobile ? 30 : 100;
  const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

  // Dynamic Opacity: Smooth fade-in, crisp visibility in mid-zone, smooth fade-out near exit
  const opacity = useTransform(
    localProgress,
    [0, 0.12, 0.82, 0.96, 1.0],
    [0, 1, 1, 0.45, 0]
  );

  // Dynamic Scale: Expands subtly as it nears the viewer
  const scale = useTransform(localProgress, [0, 0.15, 0.85, 1], [0.65, 0.95, 1.03, 1.08]);

  // Depth-aware z-index: cards nearer to the camera receive higher stacking order
  const zIndex = useTransform(localProgress, (lp) => {
    return Math.max(1, Math.min(99, Math.round(card.index + lp * 40)));
  });

  // Responsive card dimensions
  const cardWidth = stage.isMobile
    ? Math.max(136, Math.min(170, stage.width * 0.42))
    : stage.isTablet
    ? Math.max(170, Math.min(210, stage.width * 0.22))
    : Math.max(200, Math.min(260, stage.width * 0.18));

  // Compute spatial offset
  const baseX = card.angleCos * (stage.width * card.radiusFactorX);
  const baseY = card.angleSin * (stage.height * card.radiusFactorY);
  const panStrength = stage.isMobile ? 18 : 36;

  // Composite 3D transform combining translation, depth, pointer parallax, scale and rotation
  const transform = useTransform(
    [z, scale, pointer.x, pointer.y],
    ([currZ, currScale, px, py]: number[]) => {
      const offsetX = baseX - px * panStrength;
      const offsetY = baseY - py * panStrength;
      return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) scale(${currScale}) rotateZ(${card.rotationZ}deg)`;
    }
  );

  return (
    <motion.div
      style={{
        width: cardWidth,
        transform,
        opacity,
        zIndex,
      }}
      className="pointer-events-auto absolute left-1/2 top-1/2 will-change-transform select-none"
    >
      <Link
        href={card.item.href}
        className="group block relative w-full overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md p-2.5 sm:p-3 shadow-[0_12px_32px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_45px_rgba(249,87,33,0.22)] border border-slate-200/90 hover:border-[#f95721] transition-all duration-300 hover:scale-[1.03] cursor-pointer"
        title={`${card.item.title} - ${card.item.priceNote}`}
      >
        {/* Category Pill Badge */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <span
            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${card.item.badgeBg} ${card.item.badgeText}`}
          >
            {card.item.badge}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
            #{card.index + 1}
          </span>
        </div>

        {/* Verified Image Container */}
        <div className="relative w-full aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden mb-2 border border-slate-100 flex items-center justify-center p-2">
          <Image
            src={card.item.src}
            alt={card.item.title}
            fill
            className="object-contain p-1.5 transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 260px"
          />
        </div>

        {/* Card Copy */}
        <div className="text-left px-0.5">
          <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#f95721] transition-colors truncate">
            {card.item.title}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {card.item.subtitle}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-[#f95721]">
            <span>{card.item.priceNote}</span>
            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * PerspectiveTunnelHero Component
 * Fully responsive, scroll-safe 3D spatial tunnel corridor for Office Bazzar
 */
export default function PerspectiveTunnelHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const patternId = useId();

  // Responsive stage dimensions management
  const [stage, setStage] = useState<StageDimensions>({
    width: 1440,
    height: 800,
    isMobile: false,
    isTablet: false,
  });

  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setStage({
        width: w,
        height: Math.max(680, Math.min(920, h)),
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Motion value for 3D corridor progression (0.0 to 1.0)
  const rawProgress = useMotionValue(0);

  // Tuned spring physics: smooth, controlled motion without jitter or bouncing
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 85,
    damping: 26,
    mass: 0.6,
    restDelta: 0.0001,
  });

  // Track active card index based on progress for pagination display
  useEffect(() => {
    return smoothProgress.on('change', (latest) => {
      const idx = Math.min(
        TUNNEL_CARDS.length - 1,
        Math.max(0, Math.floor(latest * TUNNEL_CARDS.length))
      );
      setActiveCardIndex(idx);
    });
  }, [smoothProgress]);

  /**
   * Safe Mouse Wheel Handling:
   * NEVER permanently traps page scroll!
   * - Scrolling UP at progress 0 allows normal page scroll UP.
   * - Scrolling DOWN at progress 1 allows normal page scroll DOWN to the rest of the website.
   * - Inside the tunnel (0 < progress < 1), advances or rewinds the spatial tunnel.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const current = rawProgress.get();
      const delta = e.deltaY;

      // Allow natural scroll UP when already at the beginning of the 3D tunnel
      if (delta < 0 && current <= 0.01) {
        return;
      }

      // Allow natural scroll DOWN when already at the end of the 3D tunnel
      if (delta > 0 && current >= 0.99) {
        return;
      }

      // Inside the 3D corridor: advance tunnel traversal
      e.preventDefault();
      const sensitivity = 0.00075;
      const next = Math.max(0, Math.min(1, current + delta * sensitivity));
      rawProgress.set(next);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [rawProgress]);

  // Touch gesture handling for natural mobile scrubbing without trapping touch scrolling
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const deltaY = touchStartYRef.current - e.touches[0].clientY;
    const deltaX = touchStartXRef.current - e.touches[0].clientX;

    // If mainly horizontal swipe on mobile, scrub the tunnel!
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      const current = rawProgress.get();
      const next = Math.max(0, Math.min(1, current + deltaX * 0.003));
      rawProgress.set(next);
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  // Camera parallax hook
  const pointer = useCameraParallax(containerRef, !shouldReduceMotion);

  // Dynamic typography scale and opacity based on tunnel traversal
  const titleScale = useTransform(smoothProgress, [0, 0.45, 1], [0.92, 1, 1.08]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0.95, 1, 1, 0.85]);

  // Jump to specific card index
  const jumpToCard = useCallback(
    (index: number) => {
      const target = index / (TUNNEL_CARDS.length - 1);
      rawProgress.set(target);
    },
    [rawProgress]
  );

  const stepNext = useCallback(() => {
    const current = rawProgress.get();
    const step = 1 / (TUNNEL_CARDS.length - 1);
    rawProgress.set(Math.min(1, current + step));
  }, [rawProgress]);

  const stepPrev = useCallback(() => {
    const current = rawProgress.get();
    const step = 1 / (TUNNEL_CARDS.length - 1);
    rawProgress.set(Math.max(0, current - step));
  }, [rawProgress]);

  const resetTunnel = useCallback(() => {
    rawProgress.set(0);
  }, [rawProgress]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="relative w-full h-[680px] sm:h-[720px] lg:h-[780px] xl:h-[820px] overflow-hidden bg-gradient-to-b from-[#fbfbfe] via-white to-slate-50/80 text-slate-900 select-none flex items-center justify-center border-b border-slate-100"
      style={{
        perspective: stage.isMobile ? '850px' : '1150px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Decorative Dotted Matrix Mesh Background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.38]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id={`tunnel-dots-${patternId}`}
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.1" fill="#94a3b8" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#tunnel-dots-${patternId})`} />
        </svg>
      </div>

      {/* Ambient Radial Brand Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -left-12 w-96 h-96 rounded-full bg-[#fff7ed] blur-3xl opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 w-[450px] h-[450px] rounded-full bg-[#f0f9ff] blur-3xl opacity-75"
      />

      {/* Architectural Spatial Depth Rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        {/* Core Focal Ring */}
        <div className="absolute h-[38vmin] w-[38vmin] rounded-full border border-orange-500/15" />
        {/* Mid Spatial Ring (Dashed) */}
        <div className="absolute h-[64vmin] w-[64vmin] rounded-full border border-dashed border-slate-300/60" />
        {/* Outer Horizon Ring */}
        <div className="absolute h-[94vmin] w-[94vmin] rounded-full border border-blue-500/10" />

        {/* Spatial Axis Crosshairs */}
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/50 to-transparent" />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-slate-200/50 to-transparent" />
      </div>

      {/* Central Brand Content (Kept pristine, readable, and non-obscured) */}
      <motion.div
        style={{ scale: titleScale, opacity: titleOpacity }}
        className="pointer-events-auto z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-2xl"
      >
        {/* Eyebrow with Brand Accent Pulse */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-medium mb-3.5">
          <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse" />
          <span>Your Workspace, Our Priority</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0f172a] leading-[1.12] mb-3">
          <span>Office Supplies</span>{' '}
          <span className="text-[#ea580c] relative inline-block">
            Made Easy.
            <svg
              className="absolute -bottom-2 left-0 w-full h-2 text-[#ea580c]/30"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0,5 Q50,0 100,5" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
          </span>
        </h1>

        {/* Descriptive Subtitle */}
        <p className="max-w-[48ch] text-sm sm:text-base text-slate-600 leading-relaxed mb-6 font-normal">
          Everything you need for your office, from stationery to workspace essentials — all in one
          place with guaranteed 24-hr metro dispatch across India.
        </p>

        {/* Dual Conversion CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto mb-6">
          <Link
            href="/products"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#ea580c] hover:bg-[#c2410c] active:scale-[0.98] text-white text-sm font-semibold rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>Shop Catalog Now</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/request-quote"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-full border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#004b87]" />
            <span>Corporate RFQ Quote</span>
          </Link>
        </div>

        {/* Pan India Delivery Badge */}
        <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-200 shadow-xs">
          <div className="w-6 h-6 rounded-full bg-orange-100/70 text-[#ea580c] flex items-center justify-center">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800">
            Fast &amp; Reliable • Pan India Delivery
          </span>
        </div>
      </motion.div>

      {/* 3D Z-Space Corridor: Cards fly towards camera along perspective corridor */}
      {!shouldReduceMotion && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {TUNNEL_CARDS.map((card) => (
            <TunnelCard
              key={card.item.id}
              card={card}
              progress={smoothProgress}
              pointer={pointer}
              total={TUNNEL_CARDS.length}
              stage={stage}
            />
          ))}
        </div>
      )}

      {/* Bottom Interactive Navigation & Scrubber Timeline */}
      <div className="absolute bottom-4 left-0 right-0 z-20 px-4 pointer-events-auto flex flex-col items-center gap-2">
        {/* Timeline dots / pagination bar */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/90 shadow-sm flex items-center gap-2.5 sm:gap-3 text-xs">
          <button
            type="button"
            onClick={stepPrev}
            className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Previous product card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {TUNNEL_CARDS.map((c, i) => (
              <button
                key={c.item.id}
                type="button"
                onClick={() => jumpToCard(i)}
                className={`transition-all rounded-full cursor-pointer ${
                  activeCardIndex === i
                    ? 'w-5 h-2 bg-[#f95721]'
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Jump to ${c.item.title}`}
                aria-label={`Jump to item ${i + 1}: ${c.item.title}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={stepNext}
            className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Next product card"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-semibold text-slate-500 pl-1 border-l border-slate-200">
            {activeCardIndex + 1} / {TUNNEL_CARDS.length}
          </span>

          <button
            type="button"
            onClick={resetTunnel}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Reset to beginning"
            aria-label="Reset 3D tunnel to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scroll Helper Hint */}
        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
          <span>Scroll trackpad / wheel to travel tunnel</span>
          <span>•</span>
          <Link
            href="/products"
            className="text-[#f95721] hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>Explore all categories</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
