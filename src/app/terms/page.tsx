import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { constructMetadata, getBreadcrumbJsonLd } from '@/lib/seo/config';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Terms & Conditions | Officebazzar E-Store Private Limited',
  description:
    'Commercial terms, purchase conditions, pricing policies, and institutional supply guidelines for Officebazzar E-Store Private Limited, Chennai.',
  path: '/terms',
});

export default function TermsPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Terms & Conditions', path: '/terms' },
  ]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema-terms" />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Terms and Conditions</h1>
              <p className="text-xs text-slate-500 mt-1">
                Last Updated: October 2026 • OFFICEBAZZAR E-STORE PRIVATE LIMITED
              </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-700 space-y-6 leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing, browsing, or placing orders on OfficeBazzar (officebazzar.com, officebazzar.co.in or associated subdomains), you agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you (&quot;Buyer&quot;, &quot;Customer&quot;) and OFFICEBAZZAR E-STORE PRIVATE LIMITED (&quot;OfficeBazzar&quot;, &quot;Company&quot;).
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Pricing, Invoicing & GST</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All product prices displayed on the website are listed in Indian Rupees (INR ₹).</li>
                <li>Applicable Goods and Services Tax (GST) is calculated at the statutory rate (standard 18% for office supplies, stationery, and hygiene consumables unless otherwise specified by HSN classification).</li>
                <li>Corporate buyers providing a valid corporate GSTIN at checkout will receive an official Tax Invoice allowing legitimate Input Tax Credit (ITC) claiming.</li>
                <li>While we endeavor to ensure all catalog pricing is accurate, in the rare event of an obvious typographical error, we reserve the right to cancel affected orders prior to warehouse dispatch and issue an immediate full refund.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Orders, Dispatch & Fulfillment</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Orders are accepted subject to product availability in our Royapettah, Chennai warehouse or direct manufacturer fulfillment hubs.</li>
                <li>Orders placed before 1:00 PM IST on business days are scheduled for same-day dispatch. Delivery timeframes typically range from 24-48 hours within Tamil Nadu and 2-4 business days for pan-India locations.</li>
                <li>Bulk or palletized shipments (e.g., full truckloads of copier paper cartons or industrial waste bins) may follow freight logistics timelines agreed during quotation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Payment Methods & Credit Terms</h2>
              <p>
                Accepted payment modes include Net Banking, Corporate UPI, Debit/Credit Cards via verified payment gateways, and direct NEFT/RTGS bank transfers for corporate accounts. Institutional credit terms are provided exclusively upon formal vendor onboarding and verification of business credit credentials.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Warranty & OEM Representation</h2>
              <p>
                All branded consumables (such as HP toner cartridges, Diversey chemicals, Kangaro staplers, JK Paper reams) are 100% original OEM units and carry standard manufacturer warranties against defects.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">6. Governing Law & Jurisdiction</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising in connection with transactions on OfficeBazzar shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
