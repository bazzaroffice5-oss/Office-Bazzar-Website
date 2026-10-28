'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ExternalLink,
  Shield,
  LogOut,
  X,
  Loader2,
} from 'lucide-react';

interface AdminSidebarProps {
  adminEmail?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({
  adminEmail,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/office-control/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/office-control/dashboard',
    },
    {
      name: 'Products',
      href: '/office-control/products',
      icon: Package,
      active: pathname === '/office-control/products' || (pathname.startsWith('/office-control/products/') && !pathname.endsWith('/new')),
    },
    {
      name: 'Add Product',
      href: '/office-control/products/new',
      icon: PlusCircle,
      active: pathname === '/office-control/products/new',
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/office-control/auth/logout', { method: 'POST' });
    } catch {
      // Proceed even on network error
    } finally {
      window.location.replace('/office-control/login');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* 1. Brand Logo & Title */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
        <Link
          href="/office-control/dashboard"
          className="flex items-center gap-2.5 font-extrabold text-slate-900 tracking-tight text-base"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ea580c] to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight">Office Bazzar</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#ea580c]">
              Admin Control
            </span>
          </div>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation Rail */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                item.active
                  ? 'bg-orange-50 text-[#ea580c] shadow-2xs font-bold border border-orange-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  item.active ? 'text-[#ea580c]' : 'text-slate-400'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Website
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
          <span>View Public Store</span>
        </a>
      </div>

      {/* 3. Footer: Authenticated User & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Signed in as
            </span>
            <span
              className="text-xs font-semibold text-slate-800 truncate"
              title={adminEmail}
            >
              {adminEmail || 'admin@officebazzar.com'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
          ) : (
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
