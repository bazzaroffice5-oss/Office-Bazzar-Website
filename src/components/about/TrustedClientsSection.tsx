'use client';

import React, { useState } from 'react';

// ---------------------------------------------------------------------------
// 100% Authentic, Official Client Logos hosted permanently on Cloudinary
// (Folder: "office-bazzar-clients", optimized transparent WebP < 180KB)
// ---------------------------------------------------------------------------

interface ClientEntry {
  id: string;
  name: string;
  sector: string;
  /** Permanent Cloudinary secure URL */
  logoUrl: string;
  /** Google S2 favicon fallback if network error */
  fallbackDomain: string;
}

const TRUSTED_CLIENTS: ClientEntry[] = [
  {
    id: 'royal-enfield',
    name: 'Royal Enfield',
    sector: 'Automotive',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500953/office-bazzar-clients/royal-enfield.webp',
    fallbackDomain: 'royalenfield.com',
  },
  {
    id: 'cat',
    name: 'Caterpillar (CAT)',
    sector: 'Heavy Equipment',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500949/office-bazzar-clients/cat.webp',
    fallbackDomain: 'cat.com',
  },
  {
    id: 'ashok-leyland',
    name: 'Ashok Leyland',
    sector: 'Commercial Vehicles',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500946/office-bazzar-clients/ashok-leyland.webp',
    fallbackDomain: 'ashokleyland.com',
  },
  {
    id: 'tcs',
    name: 'Tata Consultancy Services',
    sector: 'IT Services',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500958/office-bazzar-clients/tcs.webp',
    fallbackDomain: 'tcs.com',
  },
  {
    id: 'zoho',
    name: 'Zoho',
    sector: 'SaaS / Technology',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500958/office-bazzar-clients/zoho.webp',
    fallbackDomain: 'zoho.com',
  },
  {
    id: 'lt',
    name: 'L&T',
    sector: 'Engineering & Construction',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500952/office-bazzar-clients/lt.webp',
    fallbackDomain: 'larsentoubro.com',
  },
  {
    id: 'srm',
    name: 'SRM IST',
    sector: 'Education',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500956/office-bazzar-clients/srm.webp',
    fallbackDomain: 'srmist.edu.in',
  },
  {
    id: 'hyundai-glovis',
    name: 'Hyundai Glovis',
    sector: 'Logistics',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500950/office-bazzar-clients/hyundai-glovis.webp',
    fallbackDomain: 'glovis.net',
  },
  {
    id: 'indianoil',
    name: 'IndianOil',
    sector: 'Energy & Petroleum',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500951/office-bazzar-clients/indianoil.webp',
    fallbackDomain: 'iocl.com',
  },
  {
    id: 'arun-excello',
    name: 'Arun Excello',
    sector: 'Real Estate',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500945/office-bazzar-clients/arun-excello.webp',
    fallbackDomain: 'arunexcello.com',
  },
  {
    id: 'samsung',
    name: 'Samsung',
    sector: 'Electronics',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500955/office-bazzar-clients/samsung.webp',
    fallbackDomain: 'samsung.com',
  },
  {
    id: 'sun-tv',
    name: 'Sun TV Network',
    sector: 'Media & Broadcasting',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500956/office-bazzar-clients/sun-tv.webp',
    fallbackDomain: 'suntv.in',
  },
  {
    id: 'brakes-india',
    name: 'Brakes India',
    sector: 'Automotive Components',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500948/office-bazzar-clients/brakes-india.webp',
    fallbackDomain: 'brakesindia.com',
  },
  {
    id: 'avt',
    name: 'AVT Group',
    sector: 'Tea & Commodities',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795501824/office-bazzar-clients/avt.webp',
    fallbackDomain: 'avtgroup.in',
  },
  {
    id: 'panimalar',
    name: 'Panimalar Medical College',
    sector: 'Healthcare & Education',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795501825/office-bazzar-clients/panimalar.webp',
    fallbackDomain: 'pmchri.ac.in',
  },
  {
    id: 'taj',
    name: 'Taj Hotels',
    sector: 'Luxury Hospitality',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500957/office-bazzar-clients/taj.webp',
    fallbackDomain: 'tajhotels.com',
  },
  {
    id: 'hinduja-tech',
    name: 'Hinduja Tech',
    sector: 'Engineering Services',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795501825/office-bazzar-clients/hinduja-tech.webp',
    fallbackDomain: 'hindujatech.com',
  },
  {
    id: 'bvg',
    name: 'BVG India',
    sector: 'Facility Management',
    logoUrl: 'https://res.cloudinary.com/dfrwayzr/image/upload/v1795500948/office-bazzar-clients/bvg.webp',
    fallbackDomain: 'bvgindia.com',
  },
];

// ---------------------------------------------------------------------------
// Client Card
// ---------------------------------------------------------------------------

function ClientCard({ client }: { client: ClientEntry }) {
  const [hovered, setHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(client.logoUrl);
  const [imgFailed, setImgFailed] = useState(false);

  const handleError = () => {
    if (!imgFailed) {
      // Fallback to Google S2 favicon (128px) if CDN image fails to load
      setImgSrc(
        `https://www.google.com/s2/favicons?domain=${client.fallbackDomain}&sz=128`
      );
      setImgFailed(true);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex flex-col items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 cursor-default select-none min-h-[120px] bg-white ${
        hovered
          ? 'border-[#004b87] shadow-md shadow-[#004b87]/10 -translate-y-0.5'
          : 'border-slate-200/80 shadow-sm'
      }`}
      title={`${client.name} — ${client.sector}`}
      aria-label={client.name}
    >
      {/* Official Logo area — full-width padded container with zero horizontal clipping */}
      <div className="w-full h-16 px-4 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={`${client.name} logo`}
          onError={handleError}
          className="max-h-12 max-w-full w-auto h-auto object-contain bg-transparent mx-auto"
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
            respected corporate, hospitality, educational, and industrial institutions across India.
          </p>
        </div>

        {/* Grid — 18 cards, 2 → 3 → 4 → 6 columns */}
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
