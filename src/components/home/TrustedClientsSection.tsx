'use client';

import React, { useState } from 'react';

// ---------------------------------------------------------------------------
// Client data — logo files live in public/images/clients/
// onError fallback: Google S2 favicon for the company domain
// ---------------------------------------------------------------------------

interface ClientEntry {
  id: string;
  name: string;
  sector: string;
  /** Path relative to /public (served at this URL in browser) */
  logo: string;
  /** Google S2 favicon fallback if logo fails to load */
  fallbackDomain: string;
}

const TRUSTED_CLIENTS: ClientEntry[] = [
  {
    id: 'royal-enfield',
    name: 'Royal Enfield',
    sector: 'Automotive',
    logo: '/images/clients/royal-enfield.svg',
    fallbackDomain: 'royalenfield.com',
  },
  {
    id: 'cat',
    name: 'CAT',
    sector: 'Heavy Equipment',
    logo: '/images/clients/cat.svg',
    fallbackDomain: 'cat.com',
  },
  {
    id: 'ashok-leyland',
    name: 'Ashok Leyland',
    sector: 'Commercial Vehicles',
    logo: '/images/clients/ashok-leyland.svg',
    fallbackDomain: 'ashokleyland.com',
  },
  {
    id: 'tcs',
    name: 'Tata Consultancy Services',
    sector: 'IT Services',
    logo: '/images/clients/tcs.svg',
    fallbackDomain: 'tcs.com',
  },
  {
    id: 'zoho',
    name: 'Zoho',
    sector: 'Technology',
    logo: '/images/clients/zoho.svg',
    fallbackDomain: 'zoho.com',
  },
  {
    id: 'lt',
    name: 'L&T',
    sector: 'Engineering & Construction',
    logo: '/images/clients/lt.svg',
    fallbackDomain: 'larsentoubro.com',
  },
  {
    id: 'srm',
    name: 'SRM IST',
    sector: 'Education',
    logo: '/images/clients/srm.svg',
    fallbackDomain: 'srmist.edu.in',
  },
  {
    id: 'hyundai-glovis',
    name: 'Hyundai Glovis',
    sector: 'Logistics',
    logo: '/images/clients/hyundai-glovis.svg',
    fallbackDomain: 'glovis.net',
  },
  {
    id: 'indianoil',
    name: 'IndianOil',
    sector: 'Oil & Gas',
    logo: '/images/clients/indianoil.svg',
    fallbackDomain: 'iocl.com',
  },
  {
    id: 'arun-excello',
    name: 'Arun Excello',
    sector: 'Real Estate',
    logo: '/images/clients/arun-excello.svg',
    fallbackDomain: 'arunexcello.com',
  },
  {
    id: 'samsung',
    name: 'Samsung',
    sector: 'Electronics',
    logo: '/images/clients/samsung.svg',
    fallbackDomain: 'samsung.com',
  },
  {
    id: 'sun-tv',
    name: 'Sun TV',
    sector: 'Media & Entertainment',
    logo: '/images/clients/sun-tv.svg',
    fallbackDomain: 'suntv.in',
  },
  {
    id: 'brakes-india',
    name: 'Brakes India',
    sector: 'Automotive Components',
    logo: '/images/clients/brakes-india.svg',
    fallbackDomain: 'brakesindia.com',
  },
  {
    id: 'avt',
    name: 'AVT Group',
    sector: 'Conglomerate',
    logo: '/images/clients/avt.svg',
    fallbackDomain: 'avtgroup.in',
  },
  {
    id: 'panimalar',
    name: 'Panimalar Medical College',
    sector: 'Healthcare & Education',
    logo: '/images/clients/panimalar.svg',
    fallbackDomain: 'pmchri.ac.in',
  },
  {
    id: 'taj',
    name: 'Taj Hotels',
    sector: 'Luxury Hospitality',
    logo: '/images/clients/taj.svg',
    fallbackDomain: 'tajhotels.com',
  },
  {
    id: 'hinduja-tech',
    name: 'Hinduja Tech',
    sector: 'Engineering Services',
    logo: '/images/clients/hinduja-tech.svg',
    fallbackDomain: 'hindujatech.com',
  },
  {
    id: 'bvg',
    name: 'BVG India',
    sector: 'Facility Management',
    logo: '/images/clients/bvg.svg',
    fallbackDomain: 'bvgindia.com',
  },
];

// ---------------------------------------------------------------------------
// Client Card
// ---------------------------------------------------------------------------

function ClientCard({ client }: { client: ClientEntry }) {
  const [hovered, setHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(client.logo);
  const [imgFailed, setImgFailed] = useState(false);

  const handleError = () => {
    if (!imgFailed) {
      // First failure: try Google S2 favicon (128px, real brand icon)
      setImgSrc(
        `https://www.google.com/s2/favicons?domain=${client.fallbackDomain}&sz=128`
      );
      setImgFailed(true);
    }
    // Second failure: leave as-is; brand name label below always renders
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex flex-col items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-200 cursor-default select-none min-h-[112px] ${
        hovered
          ? 'bg-white border-[#004b87] shadow-md shadow-[#004b87]/10 -translate-y-0.5'
          : 'bg-white border-slate-200/80 shadow-sm'
      }`}
      title={`${client.name} — ${client.sector}`}
      aria-label={client.name}
    >
      {/* Logo area — clean white background, no colored box */}
      <div className="flex-1 w-full flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={`${client.name} logo`}
          onError={handleError}
          className="h-11 w-auto max-w-[140px] object-contain mx-auto"
          loading="lazy"
        />
      </div>

      {/* Brand name */}
      <p className="text-center text-[11px] font-semibold text-slate-700 leading-tight line-clamp-2 w-full">
        {client.name}
      </p>

      {/* Sector badge on hover */}
      <span
        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#004b87] text-white transition-all duration-150 ${
          hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {client.sector}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Export
// ---------------------------------------------------------------------------

export default function TrustedClientsSection() {
  return (
    <section className="w-full py-16 bg-slate-50/50 border-t border-slate-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold mb-3 shadow-xs">
            <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
            </svg>
            Verified Industry Experience
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Trusted by Leading Organizations
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-[#004b87] to-[#16a34a] rounded-full mx-auto mt-3 mb-3" />
          <p className="text-sm text-slate-600 font-normal leading-relaxed">
            Office Bazzar is proud to fulfill the workplace procurement needs of some of the most
            respected corporate, hospitality, medical, and educational institutions across India.
          </p>
        </div>

        {/* Grid — 18 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {TRUSTED_CLIENTS.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Logos and identifiers are used for reference purposes and represent the respective registered trademarks of their organizations.
        </p>
      </div>
    </section>
  );
}
