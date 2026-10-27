'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Phone, ShieldCheck, Truck, Receipt, FileText, X } from 'lucide-react';
import { MegaMenuCategory } from '@/lib/data/megaMenuData';

interface MegaMenuProps {
  category: MegaMenuCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function MegaMenu({
  category,
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !category) {
    return null;
  }

  return (
    <>
      {/* Semi-transparent Backdrop for enhanced focus & dismiss on click */}
      <div
        className="fixed inset-0 bg-slate-900/25 z-10 backdrop-blur-[1px] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mega Menu Dropdown Panel */}
      <div
        ref={menuRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="absolute top-full left-0 right-0 w-full bg-white border-b border-slate-200 shadow-2xl z-30 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-thin"
        role="region"
        aria-label={`${category.name} navigation menu`}
      >
        <div className="b2b-container py-4 sm:py-5">
          {/* 1. Header Strip with Category Title & View All */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#d9232d] rounded-full inline-block" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {category.name}
                </h3>
                <span className="text-[11px] font-medium text-slate-500 hidden md:inline">
                  — {category.tagline}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {category.viewAllHref && !category.isInformationalOnly && (
                <Link
                  href={category.viewAllHref}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d9232d] hover:text-[#b31b24] bg-red-50/60 hover:bg-red-50 px-2.5 py-1 rounded transition-colors"
                >
                  <span>View All {category.shortName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 xl:hidden transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Multi-Column Subcategory Grid & Highlight Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
            {/* Subcategory Columns */}
            {category.columns.map((column, colIdx) => (
              <div
                key={column.title}
                className={`flex flex-col space-y-2.5 p-3 rounded-lg ${
                  colIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                } border border-slate-100/80 transition-colors`}
              >
                {/* Column Heading */}
                <div className="pb-1.5 border-b border-slate-200/80">
                  {column.href && !category.isInformationalOnly ? (
                    <Link
                      href={column.href}
                      onClick={onClose}
                      className="group/title inline-flex items-center justify-between w-full text-xs font-bold text-slate-900 hover:text-[#d9232d] transition-colors"
                    >
                      <span className="truncate">{column.title}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover/title:text-[#d9232d] transition-colors shrink-0 ml-1" />
                    </Link>
                  ) : (
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {column.title}
                    </h4>
                  )}
                </div>

                {/* Subcategory Links / Informational Product Items List */}
                <ul className="space-y-1.5">
                  {column.items.map((item) => (
                    <li key={item.name}>
                      {item.href && !category.isInformationalOnly ? (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="group/link flex items-center justify-between text-[11.5px] text-slate-600 hover:text-[#d9232d] hover:translate-x-0.5 py-0.5 transition-all"
                        >
                          <span className="line-clamp-1 group-hover/link:underline underline-offset-2">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span
                              className={`ml-1 px-1.5 py-0.2 text-[9px] font-bold tracking-tight rounded shrink-0 ${
                                item.badge === 'Bestseller' || item.badge === 'Top Seller'
                                  ? 'bg-amber-100 text-amber-800'
                                  : item.badge === 'OEM' || item.badge === 'Genuine'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.badge === 'Heavy Duty' || item.badge === 'P-4'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-50 text-[#d9232d]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between text-[11.5px] text-slate-700 py-0.5 cursor-default select-none">
                          <span className="line-clamp-1 font-medium text-slate-800">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span
                              className={`ml-1 px-1.5 py-0.2 text-[9px] font-bold tracking-tight rounded shrink-0 ${
                                item.badge === 'Bestseller' || item.badge === 'Top Seller'
                                  ? 'bg-amber-100 text-amber-800'
                                  : item.badge === 'OEM' || item.badge === 'Genuine'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.badge === 'Heavy Duty' || item.badge === 'P-4'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-50 text-[#d9232d]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* 5th Column: Corporate Highlight & RFQ Card */}
            {category.highlightCard && (
              <div className="flex flex-col justify-between p-4 rounded-lg bg-gradient-to-br from-slate-50 via-white to-red-50/40 border border-red-100 shadow-2xs space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold bg-red-600 text-white uppercase tracking-wider">
                      {category.highlightCard.badge || 'Corporate Procurement'}
                    </span>
                    <FileText className="w-4 h-4 text-red-500" />
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {category.highlightCard.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {category.highlightCard.description}
                  </p>

                  {/* Brand Badges if available */}
                  {category.highlightCard.brands && category.highlightCard.brands.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Top OEM Brands
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {category.highlightCard.brands.map((brand) => (
                          <span
                            key={brand}
                            className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {category.highlightCard.ctaText && category.highlightCard.ctaHref && !category.isInformationalOnly ? (
                  <div className="pt-2 border-t border-slate-100">
                    <Link
                      href={category.highlightCard.ctaHref}
                      onClick={onClose}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#d9232d] hover:bg-[#b31b24] text-white text-xs font-semibold rounded shadow-xs transition-colors"
                    >
                      <span>{category.highlightCard.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : category.highlightCard.dispatchInfo ? (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded border border-slate-200/80 text-center">
                      {category.highlightCard.dispatchInfo}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 3. Footer Trust & Procurement Desk Info */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Genuine Direct OEM Sourcing
              </span>
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                18% GST Input Tax Credit Invoices
              </span>
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                24-Hour Dispatch from Chennai Hub
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-700 font-medium self-end md:self-auto">
              <Phone className="w-3 h-3 text-[#d9232d]" />
              <span>Corporate Desk:</span>
              <a
                href="tel:+919176650050"
                className="text-[#d9232d] font-bold hover:underline"
              >
                +91 91766 50050
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
