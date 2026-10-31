import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Truck,
  ArrowRight,
  Award,
  Factory,
  CreditCard,
  Target,
  Compass,
  HeartHandshake,
} from 'lucide-react';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'About Us - Corporate Office & Facility Supplier',
  description:
    'Learn about Office Bazzar (Officebazzar E-Store Pvt Ltd). We manufacture Hi-Clean products and supply corporate office stationery and housekeeping essentials across India.',
  path: '/about',
  keywords: [
    'Officebazzar E-Store Private Limited',
    'office supplies manufacturer Chennai',
    'Hi-Clean cleaning chemicals',
    'institutional stationery supplier Royapettah',
    'corporate procurement Tamil Nadu',
  ],
});

export default function AboutPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
  ]);

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-about" />
      {/* Breadcrumbs */}
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#004b87] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">About Us</span>
        </nav>
      </div>

      {/* Main Section */}
      <section className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Heading, Subtitle, Story */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#004b87] text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5" />
                Company Profile
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                About OfficeBazzar
              </h1>
              <p className="text-base sm:text-lg font-medium text-[#004b87] mt-2">
                Your Trusted Partner for Office Supplies and Business Solutions
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              <strong>Officebazzar E-Store Private Limited</strong> was co-founded by three visionaries in the year 2005. Over 20+ years of dedicated service in corporate supply, we have grown to become a leading Indian brand and trusted procurement partner across Tamil Nadu, Karnataka, Maharashtra, Telangana, and West Bengal.
            </p>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              Operating centrally from our corporate headquarters at <strong>Officebazzar Tower</strong> in Royapettah, Chennai, we maintain specialized departments for telemarketing, field client executives, billing, warehouse dispatch, and customer finance. We manufacture all kinds of commercial cleaning formulations under our in-house brand <strong>Hi-Clean</strong>, and supply comprehensive office stationery, housekeeping items, printer cartridges, computer consumables, packaging materials, and display boards.
            </p>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-[#004b87] flex items-center justify-center">
                  <Factory className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900">In-House Manufacturing</div>
                <div className="text-xs text-slate-500 leading-normal font-normal">
                  Hi-Clean certified commercial cleaning products
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-[#16a34a] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900">Dedicated Fleet</div>
                <div className="text-xs text-slate-500 leading-normal font-normal">
                  Free door delivery in Chennai, Bangalore &amp; Kolkata
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100/70 text-[#0284c7] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900">30-Day Credit</div>
                <div className="text-xs text-slate-500 leading-normal font-normal">
                  For corporate, hospital &amp; institution accounts
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/request-quote"
                className="px-6 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs inline-flex items-center gap-2"
              >
                <span>Request a Quotation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products"
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                Browse Catalogue
              </Link>
            </div>
          </div>

          {/* Right Column: Office Bazzar Corporate Headquarters Image */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-[500px] aspect-[4/5] sm:aspect-[5/6] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-100">
              <Image
                src="/images/officebazzar-building.jpg"
                alt="Office Bazzar building featuring glass-front entrance and brick exterior"
                fill
                priority
                quality={95}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 500px, 500px"
                className="object-cover object-[center_45%]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="w-full bg-slate-50/70 py-14 border-t border-b border-slate-100">
        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16a34a] flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                To add value to customers&apos; money through flawless quantity and quality materials that are manufactured and sourced by us with strict quality control.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004b87] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Our Vision</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our company strives to be the topmost supplier for all workplace products, providing an unmatched range, continuous product innovation, and reliable varieties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing, Customer Approach & Logistics */}
      <section className="w-full py-16 bg-white">
        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Manufacturing Card */}
            <div className="p-7 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#004b87] uppercase">
                <Factory className="w-4 h-4" />
                <span>In-House Manufacturing</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Hi-Clean Brand Formulations</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Initially starting with product trading, we shifted towards manufacturing based on direct demand from institutional clients. Today, we are rated in SSI as a Small and Medium Entrepreneur (SME) and manufacture various commercial cleaning liquids and hygiene products under the registered brand <strong>Hi-Clean</strong>.
              </p>
            </div>

            {/* Customer Approach */}
            <div className="p-7 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase">
                <HeartHandshake className="w-4 h-4" />
                <span>Customer Approach</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Customer Service as an Attitude</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                For us, customer service is not just a business; it is an attitude. Servicing our clients on time is our core motto. Our experienced marketing and support personnel possess deep technical knowledge across all product categories to resolve procurement requirements smoothly.
              </p>
            </div>

            {/* Logistics & Payment */}
            <div className="p-7 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0284c7] uppercase">
                <Truck className="w-4 h-4" />
                <span>Logistics &amp; Credit Terms</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Fleet Dispatch in 2–3 Days</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We maintain a dedicated fleet of 5 delivery vans and 8 delivery vehicles to cater to client dispatches within 2 to 3 working days. We provide free door delivery in Chennai, Bangalore, and Kolkata, and offer 30-day credit terms with NEFT, RTGS, GPAY &amp; Cash payment options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="w-full py-14 bg-slate-50/70 border-t border-slate-100">
        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Company Leadership
            </h2>
            <p className="text-sm text-slate-600 mt-1 font-normal">
              Guiding OfficeBazzar with over 20+ years of dedication to customer satisfaction and workplace service excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Chairman */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-100 bg-slate-100 shadow-2xs">
                <Image
                  src="/images/atul-patel-chairman.jpg"
                  alt="Mr. Atul Patel — Company Founder & Chairman"
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover object-[70%_25%]"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#004b87]">Company Founder &amp; Chairman</div>
                <h3 className="text-xl font-bold text-slate-900">Mr. Atul Patel</h3>
              </div>
              <blockquote className="text-xs sm:text-sm text-slate-600 italic border-l-2 border-[#004b87] pl-3 py-1">
                &ldquo;I believe there is no shortcut to achieving business goals with values like morals, ethics, and honesty. I strongly believe in hard work, delivering promised work to customers, and giving preference to customer satisfaction.&rdquo;
              </blockquote>
            </div>

            {/* Managing Director */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-100 bg-slate-100 shadow-2xs">
                <Image
                  src="/images/ajith-p-dhedhi-managing-director.png"
                  alt="Mr. Ajith P Dhedhi — Managing Director"
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover object-[50%_20%]"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#16a34a]">Managing Director</div>
                <h3 className="text-xl font-bold text-slate-900">Mr. Ajith P Dhedhi</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Mr. Ajith P Dhedhi holds an M.Com degree and joined Officebazzar in 2009. With extensive leadership experience in financial operations and executive management, he directs customer fulfillment, operational expansion, and institutional service delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Corporate Clients Section */}
      <section className="w-full py-16 bg-white border-t border-slate-100">
        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Verified Industry Experience
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Trusted by Leading Organizations
            </h2>
            <p className="text-sm text-slate-600 mt-1 font-normal">
              Office Bazzar is proud to fulfill the workplace procurement needs of some of the most respected corporate, hospitality, medical, and banking institutions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {[
              'ITC',
              'Sundaram Motors',
              'Sundaram Clayton',
              'FLSmidth',
              'Brakes India Limited',
              'Empee Hotels',
              'The Park',
              'Hatsun Agro Products',
              'State Bank of India',
              'Dr. Agarwal Hospital',
              'Arun Excello',
              'Government & Educational Institutes',
            ].map((client) => (
              <div
                key={client}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-center text-center text-xs font-bold text-slate-800 shadow-2xs hover:bg-white hover:border-[#004b87] hover:shadow-xs transition-all"
              >
                <span>{client}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

