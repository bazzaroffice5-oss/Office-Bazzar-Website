'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface WindowPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  windowSize?: number;
}

/**
 * Window-based pagination component.
 * Displays a maximum of `windowSize` (default: 6) page numbers at any time.
 * Navigating Next/Previous moves between groups of 6 pages.
 */
export default function WindowPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  windowSize = 6,
}: WindowPaginationProps) {
  if (totalPages <= 1) return null;

  const totalGroups = Math.ceil(totalPages / windowSize);
  const currentGroup = Math.floor((currentPage - 1) / windowSize);

  const startPage = currentGroup * windowSize + 1;
  const endPage = Math.min(totalPages, startPage + windowSize - 1);

  const visiblePages: number[] = [];
  for (let p = startPage; p <= endPage; p++) {
    visiblePages.push(p);
  }

  const hasPreviousGroup = currentGroup > 0;
  const hasNextGroup = currentGroup < totalGroups - 1;

  const handlePrevious = () => {
    if (!hasPreviousGroup) return;
    const prevGroupStart = (currentGroup - 1) * windowSize + 1;
    onPageChange(prevGroupStart);
  };

  const handleNext = () => {
    if (!hasNextGroup) return;
    const nextGroupStart = (currentGroup + 1) * windowSize + 1;
    onPageChange(nextGroupStart);
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`mx-auto flex w-full justify-center items-center gap-1 sm:gap-2 flex-wrap ${className}`}
    >
      {/* Previous Page Group Button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={!hasPreviousGroup}
        aria-label="Go to previous page group"
        className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Previous</span>
      </button>

      {/* Numbered Page Buttons in Current Window (Max 6) */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {visiblePages.map((page) => {
          const isSelected = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isSelected ? 'page' : undefined}
              aria-label={`Page ${page}`}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#004b87] text-white shadow-xs scale-105'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Page Group Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!hasNextGroup}
        aria-label="Go to next page group"
        className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
      >
        <span>Next</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </nav>
  );
}

