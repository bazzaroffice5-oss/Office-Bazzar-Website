'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, ArrowRight, Navigation, ExternalLink } from 'lucide-react';

import { usePathname } from 'next/navigation';

const GOOGLE_MAPS_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=Officebazzar+Tower,+29/15+Subbedar+Hussain+Street,+Royapettah,+Chennai,+Tamil+Nadu+600014';
const GOOGLE_MAPS_VIEW_URL =
  'https://www.google.com/maps/search/?api=1&query=Officebazzar+Tower,+No.+29/15,+Subbedar+Hussain+Street,+Royapettah,+Chennai,+Tamil+Nadu+600014';
const GOOGLE_MAPS_EMBED_URL =
  'https://maps.google.com/maps?q=Officebazzar+Tower%2C+29%2F15+Subbedar+Hussain+Street%2C+Royapettah%2C+Chennai%2C+Tamil+Nadu+600014&t=&z=15&ie=UTF8&iwloc=&output=embed';

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61595314354926',
    hoverClass: 'hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white',
    svg: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/officebazzarofficial/',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-transparent hover:text-white',
    svg: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ajit-dhedhi/?isSelfProfile=true',
    hoverClass: 'hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:text-white',
    svg: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const pathname = usePathname();

  // Completely hide public footer on all hidden admin dashboard routes
  if (pathname?.startsWith('/office-control')) {
    return null;
  }

  return (
    <footer id="footer" className="w-full bg-[#0a192f] text-slate-300 pt-12 sm:pt-14 pb-8 sm:pb-10 border-t border-slate-800">
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid with Consistent Top Alignment */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-8 sm:pb-10 border-b border-slate-800 items-start">
          {/* Col 1: Brand & Office Details (lg: col-span-4) */}
          <div className="md:col-span-6 lg:col-span-4 space-y-3.5">
            {/* Top Anchor Header matching other columns */}
            <div className="h-7 flex items-center">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/officebazzar-logo-transparent.png"
                  alt="OfficeBazzar Logo"
                  width={150}
                  height={34}
                  className="h-7 w-auto object-contain brightness-0 invert opacity-95"
                />
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              OfficeBazzar E-Store Private Limited is a corporate procurement partner for stationery, housekeeping chemicals, waste management bins, and printer consumables.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-2 pt-0.5">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:ring-offset-1 focus:ring-offset-[#0a192f] shadow-2xs ${item.hoverClass}`}
                >
                  {item.svg}
                </a>
              ))}
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold">Central Logistics Hub:</span>
                <a
                  href={GOOGLE_MAPS_VIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#ea580c] hover:underline font-normal"
                >
                  <MapPin className="w-3 h-3 text-[#ea580c]" />
                  <span>View on Maps</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
              <p className="leading-relaxed text-slate-400">
                Officebazzar Tower, No. 29/15, Subbedar Hussain Street, Royapettah, Chennai, Tamil Nadu — 600014, India
              </p>
              <div className="text-[11px] text-slate-500 pt-0.5">
                CIN: U51909TN2021PTC142348 • 100% GST ITC Invoicing
              </div>

              {/* Branches Section */}
              <div className="pt-1.5 space-y-1">
                <div className="text-xs font-semibold text-white">
                  Branches
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                  <span>Chennai</span>
                  <span className="text-slate-600">•</span>
                  <span>Bangalore</span>
                  <span className="text-slate-600">•</span>
                  <span>Mumbai</span>
                  <span className="text-slate-600">•</span>
                  <span>Hyderabad</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation Links (lg: col-span-2) */}
          <div className="md:col-span-3 lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-semibold text-white h-7 flex items-center">
              Company
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-emerald-400 transition-colors">
                  Latest Insights
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-emerald-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Workplace Catalogue (lg: col-span-3) */}
          <div className="md:col-span-3 lg:col-span-3 space-y-3.5">
            <h3 className="text-xs font-semibold text-white h-7 flex items-center">
              Workplace Supplies
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/categories" className="hover:text-emerald-400 transition-colors">
                  All Categories
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/category/office-stationery" className="hover:text-emerald-400 transition-colors">
                  Office Stationery
                </Link>
              </li>
              <li>
                <Link href="/category/housekeeping-hygiene" className="hover:text-emerald-400 transition-colors">
                  Housekeeping &amp; Hygiene
                </Link>
              </li>
              <li>
                <Link href="/category/printers-technology" className="hover:text-emerald-400 transition-colors">
                  Printers &amp; Technology
                </Link>
              </li>
              <li>
                <Link href="/category/packaging-supplies" className="hover:text-emerald-400 transition-colors">
                  Packaging Supplies
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Direct Enquiries & Location Map (lg: col-span-3) */}
          <div className="md:col-span-12 lg:col-span-3 space-y-3.5">
            <h3 className="text-xs font-semibold text-white h-7 flex items-center">
              Direct Enquiries
            </h3>

            <div className="md:grid md:grid-cols-2 md:gap-6 lg:block lg:space-y-3.5">
              {/* Contact numbers & Request Quote */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href="tel:+917200800040" className="hover:text-emerald-400 transition-colors">
                    +91 72008 00040
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href="mailto:sales4@officebazzar.com" className="hover:text-emerald-400 transition-colors">
                    sales4@officebazzar.com
                  </a>
                </div>
                <div className="pt-0.5">
                  <Link
                    href="/request-quote"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    <span>Request a Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Visit Our Location Map Section */}
              <div className="mt-3.5 md:mt-0 lg:mt-3.5 pt-3.5 md:pt-0 lg:pt-3.5 border-t md:border-t-0 lg:border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                  <span>Visit Our Location</span>
                </h4>

                {/* Interactive Google Map Embed - Exact Width Matching */}
                <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-inner group">
                  <iframe
                    title="OfficeBazzar Central Logistics Hub Location Map"
                    src={GOOGLE_MAPS_EMBED_URL}
                    className="w-full h-full border-0 filter contrast-[1.05] opacity-90 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    aria-label="Google Map showing OfficeBazzar Tower in Royapettah Chennai"
                  />
                </div>

                {/* Get Directions Button - Edge-to-Edge Matching with Map */}
                <a
                  href={GOOGLE_MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-slate-800 hover:bg-[#ea580c] text-slate-200 hover:text-white border border-slate-700 hover:border-[#ea580c] rounded-lg text-xs font-semibold transition-all shadow-2xs group"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#ea580c] group-hover:text-white transition-colors" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal / Copyright Bar */}
        <div className="pt-6 sm:pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="text-center sm:text-left">
            © 2026 OfficeBazzar E-Store Private Limited. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1 text-[11px]">
            <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms &amp; Conditions
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/shipping-policy" className="hover:text-slate-300 transition-colors">
              Shipping &amp; Delivery
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/returns-refunds" className="hover:text-slate-300 transition-colors">
              Returns &amp; Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
