'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClipboardCheck,
  ShoppingBasket,
  FileCheck,
  Truck,
  Check,
} from 'lucide-react';

interface TimelineStep {
  number: string;
  title: string;
  stage: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    number: '01',
    title: 'Requirement Discussion',
    stage: 'Stage 01 • Consultation',
    description:
      'Understand your corporate stationery, housekeeping chemicals, and facility supplies requirements.',
    icon: ClipboardCheck,
  },
  {
    number: '02',
    title: 'Product Selection',
    stage: 'Stage 02 • SKU Matching',
    description:
      'Identify suitable products, confirm exact brand specifications, pack sizes, and custom bulk quantities.',
    icon: ShoppingBasket,
  },
  {
    number: '03',
    title: 'Quote & Confirmation',
    stage: 'Stage 03 • Wholesale Pricing',
    description:
      'Prepare competitive quotations with full 100% GST input tax credit and confirm order details.',
    icon: FileCheck,
  },
  {
    number: '04',
    title: 'Order Fulfilment',
    stage: 'Stage 04 • Fleet Delivery',
    description:
      'Coordinate prompt warehouse dispatch, dedicated fleet transport across Chennai, and live tracking updates.',
    icon: Truck,
  },
];

// Continuous animation constants
const TOTAL_CYCLE_MS = 14000; // 14-second loop duration
const STAGE_DURATION_MS = TOTAL_CYCLE_MS / 4; // 3500ms per stage

export default function ProcessTimelineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bottomScrubberRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Cycle tracking refs to avoid unnecessary re-renders while animating smoothly
  const animFrameIdRef = useRef<number | null>(null);
  const cycleStartTimeRef = useRef<number>(0);
  const activeStepRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // IntersectionObserver: Pause when out of viewport, resume when visible
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
        isPausedRef.current = !entry.isIntersecting;
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tab visibility change: Pause when tab is hidden, resume seamlessly on return
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
      } else if (isVisible) {
        isPausedRef.current = false;
        cycleStartTimeRef.current = performance.now() - (activeStepRef.current * STAGE_DURATION_MS);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVisible]);

  // Jump to specific step on user click (seamless interactive scrubbing)
  const jumpToStep = useCallback((stepIdx: number) => {
    activeStepRef.current = stepIdx;
    setActiveStep(stepIdx);
    cycleStartTimeRef.current = performance.now() - (stepIdx * STAGE_DURATION_MS);
  }, []);

  // Continuous animation loop using requestAnimationFrame (driving bottom progress bar)
  useEffect(() => {
    if (prefersReducedMotion) {
      setActiveStep(0);
      if (bottomScrubberRef.current) bottomScrubberRef.current.style.width = '100%';
      return;
    }

    cycleStartTimeRef.current = performance.now();

    const updateLoop = (now: number) => {
      if (!isPausedRef.current) {
        const elapsedSinceStart = now - cycleStartTimeRef.current;
        const currentElapsed = elapsedSinceStart % TOTAL_CYCLE_MS;

        // Determine which milestone is active (0, 1, 2, or 3)
        const rawStep = Math.floor(currentElapsed / STAGE_DURATION_MS);
        const computedStep = Math.min(3, Math.max(0, rawStep));
        if (computedStep !== activeStepRef.current) {
          activeStepRef.current = computedStep;
          setActiveStep(computedStep);
        }

        // Update the bottom progress scrubber bar smoothly from 0% to 100%
        if (bottomScrubberRef.current) {
          const totalProgress = (currentElapsed / TOTAL_CYCLE_MS) * 100;
          bottomScrubberRef.current.style.width = `${totalProgress}%`;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="process-timeline"
      aria-label="Process Oriented Timeline"
      className="w-full py-5 sm:py-6 lg:py-7 bg-[#FAF7F2] border-y border-[#EDE6DC] relative overflow-hidden"
    >
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/4 w-48 h-48 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-100/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header - Compact and Proportional */}
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight">
            Process Oriented Timeline
          </h2>

          <p className="text-[11px] sm:text-[12px] text-slate-600 mt-0.5 font-medium">
            Experience rapid results, not endless waits.
          </p>

          <div className="w-7 h-0.5 bg-[#ea580c] mx-auto mt-1.5 rounded-full" />
        </div>

        {/* ============================================================ */}
        {/* 1. DESKTOP & TABLET HORIZONTAL TIMELINE (Hidden on Small Screens) */}
        {/* ============================================================ */}
        <div className="hidden md:block mt-5 lg:mt-6">
          {/* 4 Step Milestone Cards (Upper Connecting Line Removed) */}
          <div className="grid grid-cols-4 gap-2.5 lg:gap-3.5 relative z-10">
            {TIMELINE_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              const isCompleted = activeStep > idx;
              const isLastStep = idx === TIMELINE_STEPS.length - 1;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.number}
                  onClick={() => jumpToStep(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      jumpToStep(idx);
                    }
                  }}
                  aria-label={`${step.title} - ${step.stage}`}
                  className={`group relative flex flex-col items-center text-center cursor-pointer p-2 sm:p-2.5 rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] ${
                    isActive
                      ? 'bg-white shadow-sm border border-orange-200/90 -translate-y-1'
                      : isCompleted
                      ? 'bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300'
                      : 'bg-transparent hover:bg-white/50 border border-transparent hover:border-slate-200/50'
                  }`}
                >
                  {/* Step Icon Badge */}
                  <div className="relative mb-2">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
                        isActive
                          ? isLastStep
                            ? 'bg-gradient-to-br from-[#004b87] to-[#0284c7] text-white shadow-sm ring-3 ring-[#004b87]/20 scale-105'
                            : 'bg-gradient-to-br from-[#ea580c] to-[#f97316] text-white shadow-sm ring-3 ring-orange-500/20 scale-105'
                          : isCompleted
                          ? 'bg-white border-2 border-[#004b87] text-[#004b87] shadow-xs group-hover:border-[#ea580c]'
                          : 'bg-white/90 border-2 border-[#D1C7B7] text-slate-400 group-hover:border-slate-400'
                      }`}
                    >
                      <StepIcon
                        className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-300 ${
                          isActive ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                      />

                      {/* Completed Checkmark Indicator */}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#16a34a] text-white flex items-center justify-center shadow-xs border border-white">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Step Number Badge */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[8.5px] sm:text-[9px] font-bold flex items-center justify-center border border-[#FAF7F2] transition-all duration-300 shadow-2xs ${
                        isActive
                          ? 'bg-slate-900 text-white scale-105'
                          : isCompleted
                          ? 'bg-[#004b87] text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  </div>

                  {/* Step Title */}
                  <h3
                    className={`text-[11.5px] sm:text-[12px] lg:text-[12.5px] font-semibold leading-snug transition-colors duration-300 ${
                      isActive
                        ? 'text-slate-900 font-bold'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </h3>

                  {/* Stage Subtitle Pill */}
                  <div className="mt-1">
                    <span
                      className={`inline-block text-[8.5px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                        isActive
                          ? isLastStep
                            ? 'bg-blue-100 text-[#004b87] border border-blue-200 shadow-2xs'
                            : 'bg-orange-100 text-[#ea580c] border border-orange-200 shadow-2xs'
                          : isCompleted
                          ? 'bg-blue-50 text-[#004b87] border border-blue-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                      }`}
                    >
                      {step.stage}
                    </span>
                  </div>

                  {/* Step Description */}
                  <p
                    className={`text-[10px] sm:text-[10.5px] mt-1 max-w-[170px] leading-snug transition-colors duration-300 ${
                      isActive ? 'text-slate-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Interactive Bottom Progress Scrubber Bar */}
          <div className="mt-4 sm:mt-5 max-w-lg lg:max-w-xl mx-auto px-2">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse" />
                <span>Continuous Cycle</span>
              </span>
              <span className="text-slate-500">
                Active: <span className="text-[#004b87] font-bold">{TIMELINE_STEPS[activeStep]?.stage || TIMELINE_STEPS[0].stage}</span>
              </span>
            </div>

            {/* Bottom Scrubber Track */}
            <div className="w-full h-1 bg-[#E4DCcf] rounded-full overflow-hidden relative">
              <div
                ref={bottomScrubberRef}
                className="h-full rounded-full bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#004b87] will-change-[width]"
                style={{ width: '0%' }}
              />
            </div>

            {/* Quick-Jump Milestone Markers */}
            <div className="flex justify-between mt-1.5">
              {TIMELINE_STEPS.map((s, idx) => (
                <button
                  key={s.number}
                  onClick={() => jumpToStep(idx)}
                  className={`text-[9px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    activeStep === idx
                      ? 'text-[#ea580c] bg-orange-100/70'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s.number}. {s.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. MOBILE VERTICAL TIMELINE (< md Screen Sizes) */}
        {/* ============================================================ */}
        <div className="block md:hidden mt-4">
          <div className="relative pl-5 sm:pl-6 space-y-2.5">
            {/* Subtle clean vertical baseline */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#E4DCcf] rounded-full" />

            {TIMELINE_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              const isCompleted = activeStep > idx;
              const isLastStep = idx === TIMELINE_STEPS.length - 1;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.number}
                  onClick={() => jumpToStep(idx)}
                  role="button"
                  tabIndex={0}
                  className="relative flex items-start gap-2.5 cursor-pointer group"
                >
                  {/* Node Milestone Icon */}
                  <div
                    className={`absolute -left-5 top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                      isActive
                        ? isLastStep
                          ? 'bg-[#004b87] text-white shadow-xs ring-2 ring-[#004b87]/30 scale-105'
                          : 'bg-[#ea580c] text-white shadow-xs ring-2 ring-orange-500/30 scale-105'
                        : isCompleted
                        ? 'bg-[#004b87] text-white shadow-xs'
                        : 'bg-white border-2 border-[#D1C7B7] text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : (
                      <StepIcon className="w-2.5 h-2.5" />
                    )}
                  </div>

                  {/* Step Card Body */}
                  <div
                    className={`flex-1 p-2 sm:p-2.5 rounded-lg border transition-all duration-300 ${
                      isActive
                        ? 'bg-white border-orange-300 shadow-xs ring-1 ring-orange-200/50'
                        : isCompleted
                        ? 'bg-white/90 border-slate-200'
                        : 'bg-white/60 border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-[8.5px] font-semibold uppercase tracking-normal px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-orange-100 text-[#ea580c]'
                            : isCompleted
                            ? 'bg-blue-50 text-[#004b87]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {step.stage}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-[12px] font-semibold text-slate-900 leading-tight">
                      {step.title}
                    </h3>

                    <p className="text-[10.5px] text-slate-600 mt-0.5 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Bottom Scrubber Bar */}
          <div className="mt-4 px-1">
            <div className="w-full h-1 bg-[#E4DCcf] rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#004b87] transition-all duration-500"
                style={{ width: `${((activeStep + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
