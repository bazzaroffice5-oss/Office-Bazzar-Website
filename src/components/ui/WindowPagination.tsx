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
 * Previous and Next buttons navigate one page at a time with group window scrolling.
 */
export default function WindowPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  windowSize = 6,
}: WindowPaginationProps) {
  if (totalPages <= 1) return null;

  // Safeguard currentPage within valid bounds
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const currentGroup = Math.floor((validCurrentPage - 1) / windowSize);
  const startPage = currentGroup * windowSize + 1;
  const endPage = Math.min(totalPages, startPage + windowSize - 1);

  const visiblePages: number[] = [];
  for (let p = startPage; p <= endPage; p++) {
    visiblePages.push(p);
  }

  const hasPrevious = validCurrentPage > 1;
  const hasNext = validCurrentPage < totalPages;

  const handlePrevious = () => {
    if (hasPrevious) {
      onPageChange(validCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onPageChange(validCurrentPage + 1);
    }
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`mx-auto flex w-full justify-center items-center gap-1 sm:gap-2 flex-wrap ${className}`}
    >
      {/* Previous Page Button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={!hasPrevious}
        aria-label="Go to previous page"
        className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-2 rounded-xl border border-[#E2EBE3] text-xs font-semibold text-[#526174] bg-white hover:bg-[#EDF5EF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Previous</span>
      </button>

      {/* First Page Shortcut (Desktop Only) when beyond first group */}
      {startPage > 1 && (
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            aria-label="Go to page 1"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold bg-white border border-[#E2EBE3] text-[#526174] hover:bg-[#EDF5EF] transition-colors cursor-pointer select-none"
          >
            1
          </button>
          {startPage > 2 && (
            <span className="px-1 text-xs font-bold text-[#526174]/60 select-none">...</span>
          )}
        </div>
      )}

      {/* Numbered Page Buttons in Current Window (Max 6) */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {visiblePages.map((page) => {
          const isSelected = page === validCurrentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isSelected ? 'page' : undefined}
              aria-label={`Page ${page}`}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#163A5F] text-white shadow-xs scale-105 border border-[#163A5F]'
                  : 'bg-white border border-[#E2EBE3] text-[#526174] hover:bg-[#EDF5EF] hover:border-[#163A5F]/40'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Last Page Shortcut (Desktop Only) when before final group */}
      {endPage < totalPages && (
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
          {endPage < totalPages - 1 && (
            <span className="px-1 text-xs font-bold text-[#526174]/60 select-none">...</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            aria-label={`Go to page ${totalPages}`}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold bg-white border border-[#E2EBE3] text-[#526174] hover:bg-[#EDF5EF] transition-colors cursor-pointer select-none"
          >
            {totalPages}
          </button>
        </div>
      )}

      {/* Next Page Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!hasNext}
        aria-label="Go to next page"
        className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-2 rounded-xl border border-[#E2EBE3] text-xs font-semibold text-[#526174] bg-white hover:bg-[#EDF5EF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
      >
        <span>Next</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </nav>
  );
}
