'use client';

import React, { useState } from 'react';
import { Landmark } from 'lucide-react';

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
    id: 'itc',
    name: 'ITC Limited',
    sector: 'Conglomerate',
    logo: '/images/clients/itc.svg',
    fallbackDomain: 'itcportal.com',
  },
  {
    id: 'sundaram-motors',
    name: 'Sundaram Motors',
    sector: 'Automotive',
    logo: '/images/clients/sundaram-motors.svg',
    fallbackDomain: 'sundarammotors.com',
  },
  {
    id: 'sundaram-clayton',
    name: 'Sundaram Clayton',
    sector: 'Manufacturing',
    logo: '/images/clients/sundaram-clayton.svg',
    fallbackDomain: 'sundaramclayton.com',
  },
  {
    id: 'flsmidth',
    name: 'FLSmidth',
    sector: 'Engineering',
    logo: '/images/clients/flsmidth.svg',
    fallbackDomain: 'flsmidth.com',
  },
  {
    id: 'brakes-india',
    name: 'Brakes India',
    sector: 'Automotive Components',
    logo: '/images/clients/brakes-india.svg',
    fallbackDomain: 'brakesindia.com',
  },
  {
    id: 'empee-hotels',
    name: 'Empee Hotels',
    sector: 'Hospitality',
    logo: '/images/clients/empee-hotels.svg',
    fallbackDomain: 'empeegroup.co.in',
  },
  {
    id: 'the-park',
    name: 'The Park Hotels',
    sector: 'Luxury Hospitality',
    logo: '/images/clients/the-park.svg',
    fallbackDomain: 'theparkhotels.com',
  },
  {
    id: 'hatsun',
    name: 'Hatsun Agro Products',
    sector: 'FMCG / Dairy',
    logo: '/images/clients/hatsun.svg',
    fallbackDomain: 'hap.in',
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    sector: 'Banking & Finance',
    logo: '/images/clients/sbi.svg',
    fallbackDomain: 'sbi.co.in',
  },
  {
    id: 'dr-agarwals',
    name: "Dr. Agarwal's Eye Hospital",
    sector: 'Healthcare',
    logo: '/images/clients/dr-agarwals.svg',
    fallbackDomain: 'dragarwal.com',
  },
  {
    id: 'arun-excello',
    name: 'Arun Excello',
    sector: 'Real Estate',
    logo: '/images/clients/arun-excello.svg',
    fallbackDomain: 'arunexcello.com',
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
      // First failure: try Google S2 favicon (128px, usually a real brand icon)
      setImgSrc(
        `https://www.google.com/s2/favicons?domain=${client.fallbackDomain}&sz=128`
      );
      setImgFailed(true);
    }
    // Second failure (favicon also failed): leave broken, ClientFallback renders
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex flex-col items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-200 cursor-default select-none min-h-[112px] ${hovered
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
          className="h-12 w-auto max-w-[140px] object-contain mx-auto"
          loading="lazy"
        />
      </div>

      {/* Brand name */}
      <p className="text-center text-[11px] font-semibold text-slate-700 leading-tight line-clamp-2 w-full">
        {client.name}
      </p>

      {/* Sector badge on hover */}
      <span
        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#004b87] text-white transition-all duration-150 ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
      >
        {client.sector}
      </span>
    </div>
  );
}

/** Card for Govt. & Educational Institutes — clean Lucide icon, no background box */
function GovtCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex flex-col items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-200 cursor-default select-none min-h-[112px] ${hovered
          ? 'bg-white border-[#004b87] shadow-md shadow-[#004b87]/10 -translate-y-0.5'
          : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      title="Government & Educational Institutes — Public Sector"
      aria-label="Government & Educational Institutes"
    >
      <div className="flex-1 w-full flex items-center justify-center">
        <Landmark
          className={`w-12 h-12 transition-colors duration-200 ${hovered ? 'text-[#004b87]' : 'text-slate-400'}`}
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <p className="text-center text-[11px] font-semibold text-slate-700 leading-tight line-clamp-2 w-full">
        Govt. &amp; Educational Institutes
      </p>
      <span
        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#004b87] text-white transition-all duration-150 ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
      >
        Public Sector
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
            respected corporate, hospitality, medical, and banking institutions across India.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {TRUSTED_CLIENTS.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
          <GovtCard />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Logos and identifiers are used for reference purposes and represent the respective registered trademarks of their organizations.
        </p>
      </div>
    </section>
  );
}
