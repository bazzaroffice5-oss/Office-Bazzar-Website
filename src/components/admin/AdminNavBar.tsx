'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Plus, ExternalLink, ShieldCheck } from 'lucide-react';
import AdminLogoutButton from './AdminLogoutButton';

interface AdminNavBarProps {
  adminEmail?: string;
}

export default function AdminNavBar({ adminEmail }: AdminNavBarProps) {
  const pathname = usePathname();

  const navLinks = [
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
      active: pathname === '/office-control/products' || pathname.startsWith('/office-control/products/'),
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Navigation */}
          <div className="flex items-center gap-8">
            <Link
              href="/office-control/dashboard"
              className="flex items-center gap-2.5 font-bold text-white tracking-tight text-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1.5">
                <span>OfficeBazzar</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Control
                </span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      item.active
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions & User */}
          <div className="flex items-center gap-3">
            <Link
              href="/office-control/products/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Add Product</span>
            </Link>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="Open public website in a new tab"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Store</span>
            </a>

            {adminEmail && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300 max-w-[140px] truncate" title={adminEmail}>
                  {adminEmail}
                </span>
              </div>
            )}

            <AdminLogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
