'use client';

import React, { useState } from 'react';
import { Landmark } from 'lucide-react';

// ---------------------------------------------------------------------------
// Inline SVG logos — clean, vector, zero external dependency, never broken
// ---------------------------------------------------------------------------

/** ITC Ltd — classic ITC wordmark block */
function LogoITC() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#1B3A6B" />
      <text x="40" y="27" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="20" fill="#FFFFFF" letterSpacing="2">ITC</text>
    </svg>
  );
}

/** Sundaram Motors — SM monogram */
function LogoSundaramMotors() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#0D2B5C" />
      <text x="40" y="26" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="17" fill="#FFFFFF" letterSpacing="1">SM</text>
      <text x="40" y="37" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="6.5" fill="#A0B8D8" letterSpacing="0.5">SUNDARAM MOTORS</text>
    </svg>
  );
}

/** Sundaram Clayton — SC monogram */
function LogoSundaramClayton() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#1E3A5F" />
      <text x="40" y="25" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="17" fill="#FFFFFF" letterSpacing="1">SCL</text>
      <text x="40" y="36.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="6" fill="#93B6D8" letterSpacing="0.4">SUNDARAM CLAYTON</text>
    </svg>
  );
}

/** FLSmidth — FLS wordmark */
function LogoFLSmidth() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#E3001B" />
      <text x="40" y="26" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" fill="#FFFFFF" letterSpacing="1">FLSmidth</text>
    </svg>
  );
}

/** Brakes India — BI monogram with gear motif */
function LogoBrakesIndia() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#003087" />
      <circle cx="21" cy="20" r="10" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="21" cy="20" r="5" fill="#FFFFFF" />
      <text x="49" y="25" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11" fill="#FFFFFF" letterSpacing="0.5">BRAKES</text>
      <text x="49" y="34.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="7.5" fill="#6DA3D8" letterSpacing="0.3">INDIA</text>
    </svg>
  );
}

/** Empee Hotels — crown + E */
function LogoEmpeeHotels() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#8B1A1A" />
      {/* Crown */}
      <path d="M28 28 L18 18 L23 24 L28 14 L33 24 L38 18 L28 28Z" fill="#D4AF37" />
      <text x="55" y="26" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="12" fill="#FFFFFF" letterSpacing="0.5">EMPEE</text>
    </svg>
  );
}

/** The Park Hotels — P in ellipse */
function LogoThePark() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#2C2C2C" />
      <ellipse cx="22" cy="20" rx="12" ry="12" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
      <text x="22" y="25" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="16" fill="#C9A84C">P</text>
      <text x="51" y="22" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="600" fontSize="10" fill="#FFFFFF" letterSpacing="0.5">THE PARK</text>
      <text x="51" y="31" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="300" fontSize="7" fill="#A0A0A0" letterSpacing="1">HOTELS</text>
    </svg>
  );
}

/** Hatsun Agro Products — HAP / milk drop icon */
function LogoHatsun() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#005A9C" />
      {/* Drop shape */}
      <path d="M20 10 Q20 6 24 10 Q28 15 28 20 A8 8 0 0 1 12 20 Q12 15 20 10Z" fill="#FFFFFF" />
      <text x="52" y="22" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="10" fill="#FFFFFF" letterSpacing="0.5">HATSUN</text>
      <text x="52" y="32" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="7" fill="#8DC8F0" letterSpacing="0.3">AGRO PRODUCTS</text>
    </svg>
  );
}

/** State Bank of India — keyhole SBI logo */
function LogoSBI() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#1B4F9C" />
      {/* SBI keyhole icon — stylized */}
      <circle cx="20" cy="15" r="6" fill="#FFFFFF" />
      <path d="M15 21 Q14 32 20 32 Q26 32 25 21Z" fill="#FFFFFF" />
      <text x="52" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="13" fill="#FFFFFF" letterSpacing="1">SBI</text>
      <text x="52" y="31" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="300" fontSize="6.5" fill="#8BB0E8" letterSpacing="0.4">STATE BANK OF INDIA</text>
    </svg>
  );
}

/** Dr. Agarwal Eye Hospital — eye icon */
function LogoDrAgarwal() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#006B8F" />
      {/* Eye shape */}
      <path d="M10 20 Q20 10 30 20 Q20 30 10 20Z" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="20" cy="20" r="4" fill="#FFFFFF" />
      <circle cx="21" cy="19" r="1.2" fill="#006B8F" />
      <text x="56" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8.5" fill="#FFFFFF" letterSpacing="0.3">DR. AGARWAL&apos;S</text>
      <text x="56" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="7" fill="#A0D4E8" letterSpacing="0.3">EYE HOSPITAL</text>
    </svg>
  );
}

/** Arun Excello — AE monogram with skyline */
function LogoArunExcello() {
  return (
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full">
      <rect width="80" height="40" rx="4" fill="#C0392B" />
      {/* Buildings */}
      <rect x="10" y="22" width="6" height="10" fill="rgba(255,255,255,0.3)" />
      <rect x="17" y="17" width="6" height="15" fill="rgba(255,255,255,0.4)" />
      <rect x="24" y="20" width="6" height="12" fill="rgba(255,255,255,0.3)" />
      <text x="55" y="22" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11" fill="#FFFFFF" letterSpacing="0.5">ARUN</text>
      <text x="55" y="33" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" fill="#FAD7D4" letterSpacing="0.5">EXCELLO</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Client data
// ---------------------------------------------------------------------------

interface ClientEntry {
  id: string;
  name: string;
  sector: string;
  Logo: React.FC;
}

const TRUSTED_CLIENTS: ClientEntry[] = [
  {
    id: 'itc',
    name: 'ITC',
    sector: 'Conglomerate',
    Logo: LogoITC,
  },
  {
    id: 'sundaram-motors',
    name: 'Sundaram Motors',
    sector: 'Automotive',
    Logo: LogoSundaramMotors,
  },
  {
    id: 'sundaram-clayton',
    name: 'Sundaram Clayton',
    sector: 'Manufacturing',
    Logo: LogoSundaramClayton,
  },
  {
    id: 'flsmidth',
    name: 'FLSmidth',
    sector: 'Engineering',
    Logo: LogoFLSmidth,
  },
  {
    id: 'brakes-india',
    name: 'Brakes India',
    sector: 'Automotive Components',
    Logo: LogoBrakesIndia,
  },
  {
    id: 'empee-hotels',
    name: 'Empee Hotels',
    sector: 'Hospitality',
    Logo: LogoEmpeeHotels,
  },
  {
    id: 'the-park',
    name: 'The Park Hotels',
    sector: 'Luxury Hospitality',
    Logo: LogoThePark,
  },
  {
    id: 'hatsun',
    name: 'Hatsun Agro Products',
    sector: 'FMCG / Dairy',
    Logo: LogoHatsun,
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    sector: 'Banking & Finance',
    Logo: LogoSBI,
  },
  {
    id: 'dr-agarwal',
    name: "Dr. Agarwal's Hospital",
    sector: 'Healthcare',
    Logo: LogoDrAgarwal,
  },
  {
    id: 'arun-excello',
    name: 'Arun Excello',
    sector: 'Real Estate',
    Logo: LogoArunExcello,
  },
  {
    id: 'govt-edu',
    name: 'Govt. & Educational Institutes',
    sector: 'Public Sector',
    Logo: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-700 rounded">
        <Landmark className="w-7 h-7 text-white" strokeWidth={1.5} />
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Client Card
// ---------------------------------------------------------------------------

function ClientCard({ client }: { client: ClientEntry }) {
  const [hovered, setHovered] = useState(false);
  const { Logo } = client;
  const isGovt = client.id === 'govt-edu';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border transition-all duration-200 cursor-default select-none ${
        hovered
          ? 'bg-white border-[#004b87] shadow-md shadow-[#004b87]/10 -translate-y-0.5'
          : 'bg-slate-50 border-slate-200/80 shadow-2xs'
      }`}
      title={`${client.name} — ${client.sector}`}
      aria-label={client.name}
    >
      {/* Logo area */}
      <div
        className={`w-full flex items-center justify-center rounded-lg overflow-hidden transition-all duration-200 ${
          isGovt ? 'h-10' : 'h-10'
        }`}
      >
        <Logo />
      </div>

      {/* Label */}
      <p className="text-center text-[11px] font-semibold text-slate-700 leading-tight line-clamp-2 w-full">
        {client.name}
      </p>

      {/* Sector badge on hover */}
      <span
        className={`absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#004b87] text-white transition-all duration-150 ${
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
    <section className="w-full py-16 bg-white border-t border-slate-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
            <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
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
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Logos and identifiers are used for reference purposes and represent the respective registered trademarks of their organizations.
        </p>
      </div>
    </section>
  );
}
