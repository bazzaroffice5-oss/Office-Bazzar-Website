'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Plus, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  adminEmail?: string;
  onOpenMobileMenu?: () => void;
}

export default function AdminHeader({
  adminEmail,
  onOpenMobileMenu,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
            Office Bazzar Admin
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Live Console</span>
          </span>
        </div>
      </div>

      {/* Right: Authenticated User Email & Add Product Action */}
      <div className="flex items-center gap-3">
        {adminEmail && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
            <span className="font-medium text-slate-700 max-w-[200px] truncate" title={adminEmail}>
              {adminEmail}
            </span>
          </div>
        )}

        <Link
          href="/office-control/products/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden xs:inline">Add Product</span>
        </Link>
      </div>
    </header>
  );
}
