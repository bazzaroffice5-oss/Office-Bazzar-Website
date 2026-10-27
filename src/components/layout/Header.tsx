'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

const ALL_CATEGORIES_ROUTE = '/categories';

const PRODUCT_CATEGORIES = [
  { name: 'Office Stationery', href: ALL_CATEGORIES_ROUTE },
  { name: 'Housekeeping & Hygiene', href: ALL_CATEGORIES_ROUTE },
  { name: 'Printers & Technology', href: ALL_CATEGORIES_ROUTE },
  { name: 'Packaging Supplies', href: ALL_CATEGORIES_ROUTE },
];

export default function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);

  const productsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (productsRef.current && !productsRef.current.contains(event.target as Node)) {
        setIsProductsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProductsOpen(false);
    setIsMobileProductsOpen(false);
  }, [pathname]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsProductsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsProductsOpen(false);
    }, 150);
  };

  const isProductsActive =
    pathname.startsWith('/products') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/category');

  const navLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Blogs', href: '/blogs' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Careers', href: '/careers' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs h-[68px] transition-all">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Left: Official OfficeBazzar Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-95 shrink-0"
            title="OfficeBazzar – Corporate Procurement"
          >
            <Image
              src="/images/officebazzar-logo-transparent.png"
              alt="OfficeBazzar – The Biggest Choice of Office Needs"
              width={280}
              height={90}
              priority
              className="w-[102px] sm:w-[112px] md:w-[124px] h-auto object-contain"
            />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links in a clean horizontal row */}
        <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2.5 text-[14px] xl:text-[15px] font-medium text-slate-700 whitespace-nowrap">
          {/* Products Dropdown */}
          <div
            ref={productsRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors cursor-pointer select-none whitespace-nowrap ${
                isProductsOpen || isProductsActive
                  ? 'text-[#004b87] font-semibold bg-slate-50'
                  : 'hover:text-[#004b87] hover:bg-slate-50'
              }`}
              aria-expanded={isProductsOpen}
              aria-haspopup="true"
            >
              <span>Products</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isProductsOpen ? 'rotate-180 text-[#004b87]' : ''
                }`}
              />
            </button>

            {/* Simple Clean 4-Category Dropdown */}
            {isProductsOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setIsProductsOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:text-[#004b87] hover:bg-slate-50 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Other Navigation Links */}
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[#004b87] font-semibold bg-slate-50'
                    : 'hover:text-[#004b87] hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Cart, Get a Quote Button */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Cart Icon - Visible only when cart contains products */}
          {itemCount > 0 && (
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 text-slate-700 hover:text-[#004b87] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label={`View Quote Cart with ${itemCount} items`}
              title="View Quote Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 bg-[#0066cc] text-white rounded-full min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center shadow-xs pointer-events-none animate-in zoom-in-50 duration-150">
                {itemCount}
              </span>
            </Link>
          )}

          {/* "Get a Quote" Button */}
          <Link
            href="/request-quote"
            className="hidden sm:inline-flex items-center justify-center bg-[#057a3b] hover:bg-[#046330] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold px-5 py-2 sm:px-6 sm:py-2.5 rounded-full transition-all shadow-xs cursor-pointer whitespace-nowrap leading-none"
          >
            Get a Quote
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center w-9 h-9 p-1.5 text-slate-700 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[68px] bg-slate-950/40 backdrop-blur-xs z-50">
          <div className="bg-white w-full max-h-[calc(100vh-68px)] overflow-y-auto border-b border-slate-200 shadow-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Nav Links */}
            <div className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
              {/* Products Accordion showing exactly the 4 categories */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                  className="flex items-center justify-between w-full py-1 text-slate-800 font-semibold cursor-pointer"
                >
                  <span className={isProductsActive ? 'text-[#004b87]' : ''}>Products</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      isMobileProductsOpen ? 'rotate-180 text-[#004b87]' : ''
                    }`}
                  />
                </button>
                {isMobileProductsOpen && (
                  <div className="grid grid-cols-1 gap-1 pt-2 pl-3">
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="py-1.5 text-sm text-slate-700 hover:text-[#004b87] transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <div key={link.name} className="py-2">
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block py-1 transition-colors ${
                        isActive ? 'text-[#004b87] font-bold' : 'hover:text-[#004b87]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Mobile Quote Button */}
            <div className="pt-2">
              <Link
                href="/request-quote"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center bg-[#057a3b] hover:bg-[#046330] active:scale-[0.98] text-white font-semibold py-2.5 rounded-full text-sm transition-colors shadow-xs"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
