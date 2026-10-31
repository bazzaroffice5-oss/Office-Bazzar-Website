import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, MapPin, Building2, Map } from 'lucide-react';
import ContactForm from '@/components/contact/ContactForm';
import { constructMetadata, getBreadcrumbJsonLd, getLocalBusinessJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Contact Us | Officebazzar E-Store Private Limited, Royapettah, Chennai',
  description:
    'Get in touch with Officebazzar E-Store Private Limited. Visit our headquarters at Officebazzar Tower, Royapettah, Chennai, or call our procurement desk at +91 72008 00040 / sales4@officebazzar.com.',
  path: '/contact',
  keywords: [
    'contact Office Bazzar',
    'Officebazzar Tower Royapettah',
    'office supplies customer care Chennai',
    'institutional sales desk phone number',
  ],
});

export default function ContactPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Contact Us', path: '/contact' },
  ]);
  const localBusinessSchema = getLocalBusinessJsonLd();

  return (
    <main className="min-h-screen bg-slate-50/60 py-8 sm:py-12">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-contact" />
      <JsonLd data={localBusinessSchema} id="local-business-schema-contact" />
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-6 font-medium">
          <Link href="/" className="hover:text-[#004b87] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Contact Us</span>
        </nav>

        {/* Heading */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#004b87] text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Corporate Headquarters &amp; Branches
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Contact Us
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Get in touch with our procurement specialists for institutional quotes, bulk pricing, and facility supplies.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Contact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Phone Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#004b87] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">Direct Enquiries</div>
                <div className="text-base font-semibold text-slate-900">
                  <a href="tel:+917200800040" className="hover:text-[#004b87]">
                    +91 72008 00040
                  </a>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Office: <a href="tel:+917825886622" className="hover:text-[#004b87] font-medium">+91 78258 86622</a>
                </div>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#004b87] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">Email Addresses</div>
                <div className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                  <a href="mailto:sales4@officebazzar.com" className="hover:text-[#004b87]">
                    sales4@officebazzar.com
                  </a>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  Corporate: <a href="mailto:dm@officebazzar.com" className="hover:text-[#004b87] font-medium">dm@officebazzar.com</a>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#004b87] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">Registered Corporate Headquarters</div>
                <div className="text-sm font-semibold text-slate-900 leading-snug mt-0.5">
                  &ldquo;Officebazzar Tower&rdquo; No. 29/15, Subbedar Hussain Street, Royapettah, Chennai, Tamil Nadu — 600014
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Officebazzar E-Store Private Limited
                </div>
              </div>
            </div>

            {/* Verified Branches Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="text-xs font-semibold text-slate-900">
                Pan-India Branch Offices
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="font-semibold text-slate-900">Bangalore Branch</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Jeevan Bima Nagar - 560075</div>
                  <div className="text-[11px] text-[#004b87] font-semibold mt-1">080 48905048 / 9901936099</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="font-bold text-slate-900">Chennai Branch</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Royapettah, Chennai – 600014</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="font-bold text-slate-900">Mumbai Branch</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Andheri East - 400099</div>
                  <div className="text-[11px] text-[#004b87] font-semibold mt-1">90049 87879</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="font-bold text-slate-900">Hyderabad Branch</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Kishangunj, Hyderabad</div>
                  <div className="text-[11px] text-[#004b87] font-semibold mt-1">8401940111</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Send a Message</h2>
              <p className="text-xs text-slate-500 mb-6">
                Fill out the details below and our team will get in touch with you promptly.
              </p>
              <ContactForm />
            </div>

            {/* Supply Zones */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-2">
                <Map className="w-4 h-4 text-[#004b87]" />
                <span>Primary Industrial Corridors &amp; Supply Hubs</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                We cater to corporate houses, business parks, healthcare centers, educational institutions, and manufacturing plants across:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Sriperumbudur',
                  'Oragadam',
                  'Mahindra World City',
                  'Thiruvallur',
                  'Ambattur',
                  'Guindy',
                  'Maraimalai Nagar',
                  'Hosur',
                  'Siruseri',
                  'Vallam-Vadagal',
                  'Irungattukottai',
                ].map((hub) => (
                  <span
                    key={hub}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700"
                  >
                    {hub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
